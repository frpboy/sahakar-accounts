export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';

type AuditorAction =
    | 'view_dashboard'
    | 'view_record'
    | 'view_transaction'
    | 'export_excel'
    | 'export_pdf'
    | 'filter_data';

type LogAccessBody = {
    action?: AuditorAction;
    entity_type?: string | null;
    entity_id?: string | null;
    outlet_id?: string | null;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createRouteClient();

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

        const body = (await request.json()) as LogAccessBody;
        const { action, entity_type, entity_id, outlet_id } = body;

        const validActions: AuditorAction[] = [
            'view_dashboard',
            'view_record',
            'view_transaction',
            'export_excel',
            'export_pdf',
            'filter_data',
        ];
        if (!action || !validActions.includes(action)) {
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
            } as unknown as never);

        if (error) {
            console.error('Failed to log auditor access:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error in auditor log-access:', { message: getErrorMessage(error) });
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
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
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
