export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase-server';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
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
            query = query.eq('severity', severity);
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
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, severity, category, outlet_id, metadata } = body;

        // Validate required fields
        if (!title || !severity || !category) {
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
        const { data, error } = await admin
            .from('anomalies')
            .insert({
                title,
                description,
                severity,
                category,
                outlet_id: outlet_id || user.outlet_id,
                metadata: metadata || {}
            })
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