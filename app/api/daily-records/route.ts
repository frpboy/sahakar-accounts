export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';

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

        const searchParams = request.nextUrl.searchParams;
        const requestedOutletId = searchParams.get('outletId');
        const month = searchParams.get('month'); // Format: YYYY-MM

        const { data: profile, error: profileError } = await (supabase as any)
            .from('users')
            .select('role,outlet_id')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const typedProfile = profile as Pick<Database['public']['Tables']['users']['Row'], 'role' | 'outlet_id'>;
        const profileOutletId = typedProfile.outlet_id;
        const profileRole = typedProfile.role;
        const outletId = requestedOutletId ?? profileOutletId ?? null;

        if (requestedOutletId) {
            const canSelectOutlet = ['master_admin', 'superadmin', 'ho_accountant'].includes(profileRole || '');
            if (!canSelectOutlet && requestedOutletId !== profileOutletId) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        if (!outletId) {
            return NextResponse.json({ error: 'Outlet ID is required or not assigned to user' }, { status: 400 });
        }

        let query = (supabase as any)
            .from('daily_records')
            .select('*')
            .eq('outlet_id', outletId)
            .order('date', { ascending: false });

        if (month) {
            const startDate = `${month}-01`;
            const endDate = new Date(month + '-01');
            endDate.setMonth(endDate.getMonth() + 1);
            const endDateStr = endDate.toISOString().split('T')[0];

            query = query.gte('date', startDate).lt('date', endDateStr);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching daily records:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('Error in GET /api/daily-records:', { message: getErrorMessage(error) });
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
