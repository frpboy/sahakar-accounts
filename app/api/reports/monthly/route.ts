export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

type DailyRecordRow = Database['public']['Tables']['daily_records']['Row'];

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient<Database>({ cookies });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const requestedOutletId = searchParams.get('outletId');
        const month = searchParams.get('month'); // Format: YYYY-MM

        if (!month) {
            return NextResponse.json({ error: 'Month parameter required' }, { status: 400 });
        }

        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role,outlet_id')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const profileOutletId = (profile as any)?.outlet_id as string | null | undefined;
        const profileRole = (profile as any)?.role as string | undefined;
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

        // Get all daily records for the month
        const startDate = `${month}-01`;
        const endDate = new Date(month + '-01');
        endDate.setMonth(endDate.getMonth() + 1);
        const endDateStr = endDate.toISOString().split('T')[0];

        const { data: records, error } = await supabase
            .from('daily_records')
            .select('*')
            .eq('outlet_id', outletId)
            .gte('date', startDate)
            .lt('date', endDateStr)
            .order('date', { ascending: true });

        if (error) {
            console.error('Error fetching monthly summary:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Calculate summary
        const firstRecord = (records as DailyRecordRow[] | null | undefined)?.[0];
        const lastRecord = (records as DailyRecordRow[] | null | undefined)?.[
            records ? records.length - 1 : 0
        ];

        const summary = {
            month,
            outlet_id: outletId,
            days_count: records?.length || 0,
            total_income: 0,
            total_expense: 0,
            total_cash_in: 0,
            total_cash_out: 0,
            total_upi_in: 0,
            total_upi_out: 0,
            net_profit: 0,
            opening_balance: (Number(firstRecord?.opening_cash || 0) + Number(firstRecord?.opening_upi || 0)),
            closing_balance: (Number(lastRecord?.closing_cash || 0) + Number(lastRecord?.closing_upi || 0)),
        };

        if (records) {
            (records as DailyRecordRow[]).forEach((record) => {
                summary.total_income += Number(record.total_income || 0);
                summary.total_expense += Number(record.total_expense || 0);
            });
            summary.net_profit = summary.total_income - summary.total_expense;
        }

        return NextResponse.json(summary);
    } catch (error: unknown) {
        console.error('Error in GET /api/reports/monthly:', { message: getErrorMessage(error) });
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
