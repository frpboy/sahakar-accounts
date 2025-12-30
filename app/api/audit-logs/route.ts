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

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is superadmin or ho_accountant
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        const allowedRoles = ['master_admin', 'superadmin', 'ho_accountant', 'auditor'];
        if (!user?.role || !allowedRoles.includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get query parameters
        const url = new URL(request.url);
        const severity = url.searchParams.get('severity');
        const action = url.searchParams.get('action');
        const startDate = url.searchParams.get('start_date');
        const endDate = url.searchParams.get('end_date');
        const page = parseInt(url.searchParams.get('page') || '1');
        const pageSize = parseInt(url.searchParams.get('limit') || '50');
        const offset = (page - 1) * pageSize;

        // Use admin client to bypass RLS and retrieve logs for allowed roles
        const admin = createAdminClient();
        let query = admin
            .from('audit_logs')
            .select('*', { count: 'exact' });

        // Apply filters
        if (severity && severity !== 'all') {
            const sev = (severity === 'critical' || severity === 'warning' || severity === 'normal') ? severity : 'normal';
            query = query.eq('severity', sev);
        }

        if (action && action !== 'all') {
            query = query.eq('action', action as any);
        }

        if (startDate) {
            query = query.gte('created_at', startDate);
        }

        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        // Apply pagination
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + pageSize - 1);

        const { data, error, count } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            data,
            meta: {
                total: count,
                page,
                pageSize,
                totalPages: count ? Math.ceil(count / pageSize) : 0
            }
        });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
