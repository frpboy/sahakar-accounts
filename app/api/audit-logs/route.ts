// @ts-nocheck
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        // Get current session
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

        if (user?.role !== 'master_admin') {
            return NextResponse.json({ error: 'Forbidden - Master Admin only' }, { status: 403 });
        }

        // Get query parameters
        const url = new URL(request.url);
        const severity = url.searchParams.get('severity');
        const action = url.searchParams.get('action');
        const startDate = url.searchParams.get('start_date');
        const endDate = url.searchParams.get('end_date');
        const limit = parseInt(url.searchParams.get('limit') || '100');

        let query = supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (severity && severity !== 'all') {
            query = query.eq('severity', severity);
        }

        if (action && action !== 'all') {
            query = query.eq('action', action);
        }

        if (startDate) {
            query = query.gte('created_at', startDate);
        }

        if (endDate) {
            query = query.lte('created_at', endDate);
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
