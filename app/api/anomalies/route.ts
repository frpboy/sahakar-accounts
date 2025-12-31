export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-server';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query parameters
        const url = new URL(request.url);
        const startDate = url.searchParams.get('start_date');
        const endDate = url.searchParams.get('end_date');
        const severity = url.searchParams.get('severity');
        const category = url.searchParams.get('category');
        const outletId = url.searchParams.get('outlet_id');
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('limit') || '50');
        const offset = (page - 1) * pageSize;

        // Get user role and outlet
        const { data: user } = await supabase
            .from('users')
            .select('role, outlet_id')
            .eq('id', session.user.id)
            .single();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const allowedRoles = ['superadmin', 'master_admin', 'ho_accountant', 'auditor'];
        if (!allowedRoles.includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Build query
        const admin = createAdminClient();
        let query = admin
            .from('anomalies')
            .select('*', { count: 'exact' });

        // Apply outlet filter for non-superadmins
        if (user.role !== 'superadmin' && user.role !== 'master_admin') {
            if (user.outlet_id) {
                query = query.eq('outlet_id', user.outlet_id);
            }
        }

        // Apply filters
        if (startDate) {
            query = query.gte('detected_at', startDate);
        }

        if (endDate) {
            query = query.lte('detected_at', endDate);
        }

        if (severity && severity !== 'all') {
            query = query.eq('severity', severity as any);
        }

        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        if (outletId && (user.role === 'superadmin' || user.role === 'master_admin')) {
            query = query.eq('outlet_id', outletId);
        }

        // Apply pagination
        query = query
            .order('detected_at', { ascending: false })
            .range(offset, offset + pageSize - 1);

        const { data, error, count } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            anomalies: data || [],
            total_count: count || 0,
            filtered_count: data?.length || 0,
            page,
            page_size: pageSize,
            total_pages: count ? Math.ceil(count / pageSize) : 0
        });

    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createRouteClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, severity, category, type, outlet_id, metadata, transaction_id, business_day_id } = body;

        // Validate required fields
        if (!title || !severity || !(category || type)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get user role
        const { data: user } = await supabase
            .from('users')
            .select('role, outlet_id')
            .eq('id', session.user.id)
            .single();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check permissions
        const allowedRoles = ['superadmin', 'master_admin', 'ho_accountant'];
        if (!allowedRoles.includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // For non-superadmins, ensure outlet_id matches user's outlet
        if (user.role !== 'superadmin' && user.role !== 'master_admin') {
            if (user.outlet_id && outlet_id && outlet_id !== user.outlet_id) {
                return NextResponse.json({ error: 'Cannot create anomalies for other outlets' }, { status: 403 });
            }
            if (!outlet_id && user.outlet_id) {
                // Auto-assign to user's outlet
                body.outlet_id = user.outlet_id;
            }
        }

        // Validate severity
        const validSeverities = ['critical', 'warning', 'info'];
        if (!validSeverities.includes(severity)) {
            return NextResponse.json({ error: 'Invalid severity level' }, { status: 400 });
        }

        const admin = createAdminClient();
        const anomalyType = type || category;

        // Compute fingerprint for grouping/deduplication
        const fingerprintParts = [
            anomalyType,
            severity,
            outlet_id || user.outlet_id || '',
            transaction_id || '',
            business_day_id || '',
            // lightweight metadata normalization
            metadata && metadata.key ? String(metadata.key) : ''
        ];
        const fingerprint = fingerprintParts.join('|');

        // Severity-based throttling window (in minutes)
        const throttleWindows: Record<string, number> = { critical: 0, warning: 15, info: 60 };
        const windowMinutes = throttleWindows[severity] ?? 0;

        // If a matching fingerprint exists within throttle window (non-critical), update counters without creating a new record
        if (windowMinutes > 0) {
            const sinceIso = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
            const { data: existing } = await (admin as any)
                .from('anomalies')
                .select('*')
                .eq('fingerprint', fingerprint)
                .gte('last_detected_at', sinceIso)
                .limit(1)
                .single();

            if (existing) {
                await (admin as any)
                    .from('anomalies')
                    .update({
                        occurrences_count: (existing.occurrences_count || 1) + 1,
                        last_detected_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id);

                return NextResponse.json(existing, { status: 200 });
            }
        }

        // Upsert by fingerprint to group repeated anomalies
        const { data, error } = await (admin as any)
            .from('anomalies')
            .upsert({
                title,
                description,
                severity,
                category: anomalyType,
                outlet_id: outlet_id || user.outlet_id,
                transaction_id: transaction_id || null,
                business_day_id: business_day_id || null,
                metadata: metadata || {},
                fingerprint,
                first_detected_at: new Date().toISOString(),
                last_detected_at: new Date().toISOString(),
                status: 'open'
            }, { onConflict: 'fingerprint' })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Log the creation
        await admin.from('audit_logs').insert({
            user_id: session.user.id,
            action: 'create_anomaly',
            entity: 'anomalies',
            entity_id: data.id,
            severity: severity === 'critical' ? 'critical' : 'normal',
            reason: `Created anomaly: ${title}`
        });

        return NextResponse.json(data, { status: 201 });

    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = createRouteClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, status, assigned_to, resolution_notes, resolution_attachment_url } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing anomaly id' }, { status: 400 });
        }

        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const allowedRoles = ['superadmin', 'master_admin', 'ho_accountant', 'auditor'];
        if (!allowedRoles.includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const admin = createAdminClient();
        const update: any = {};
        if (typeof status === 'string') {
            update.status = status;
            if (status === 'resolved') {
                update.resolved_at = new Date().toISOString();
                update.resolved_by = session.user.id;
            }
        }
        if (typeof assigned_to === 'string') {
            update.assigned_to = assigned_to;
        }
        if (typeof resolution_notes === 'string') {
            update.resolution_notes = resolution_notes;
        }
        if (typeof resolution_attachment_url === 'string') {
            update.resolution_attachment_url = resolution_attachment_url;
        }

        const { data, error } = await admin
            .from('anomalies')
            .update(update)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Write history entry
        await (admin as any).from('anomaly_history').insert({
            anomaly_id: id,
            action: status === 'resolved' ? 'resolved' : 'commented',
            performed_by: session.user.id,
            notes: resolution_notes || null,
            attachment_url: resolution_attachment_url || null,
            old_status: null,
            new_status: status || null
        } as any);

        return NextResponse.json(data, { status: 200 });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
