// @ts-nocheck
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is an auditor
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (user?.role !== 'auditor') {
            return NextResponse.json({ error: 'Forbidden - Auditor access only' }, { status: 403 });
        }

        const body = await request.json();
        const { action, entity_type, entity_id, outlet_id } = body;

        // Validate action
        const valid Actions = ['view_dashboard', 'view_record', 'view_transaction', 'export_excel', 'export_pdf', 'filter_data'];
        if (!validActions.includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Get IP address and user agent
        const ip_address = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const user_agent = request.headers.get('user-agent') || 'unknown';

        // Insert audit log
        const { error } = await supabase
            .from('auditor_access_log')
            .insert({
                auditor_id: session.user.id,
                action,
                entity_type,
                entity_id,
                outlet_id,
                ip_address,
                user_agent
            });

        if (error) {
            console.error('Failed to log auditor access:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error: any) {
        console.error('Error in auditor log-access:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET endpoint to retrieve audit logs (Superadmin only)
export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is superadmin
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (user?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Forbidden - Superadmin only' }, { status: 403 });
        }

        // Get query parameters
        const url = new URL(request.url);
        const auditorId = url.searchParams.get('auditor_id');
        const limit = parseInt(url.searchParams.get('limit') || '100');

        let query = supabase
            .from('auditor_access_log')
            .select('*')
            .order('accessed_at', { ascending: false })
            .limit(limit);

        if (auditorId) {
            query = query.eq('auditor_id', auditorId);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
