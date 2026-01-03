export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';

type DailyRecordRow = Database['public']['Tables']['daily_records']['Row'];
type TransactionRow = Database['public']['Tables']['transactions']['Row'];

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
            console.error('Error fetching daily records:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!records || records.length === 0) {
            return NextResponse.json([]);
        }

        const typedRecords = records as DailyRecordRow[];

        // Get all transactions for these records
        const recordIds = typedRecords.map(r => r.id);
        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .in('daily_record_id', recordIds);

        if (txError) {
            console.error('Error fetching transactions:', txError);
            return NextResponse.json({ error: txError.message }, { status: 500 });
        }

        // Map transactions to daily records
        const txMap = (transactions as TransactionRow[] || []).reduce((acc, tx) => {
            if (!tx.daily_record_id) return acc;
            if (!acc[tx.daily_record_id]) {
                acc[tx.daily_record_id] = {
                    cash_in: 0,
                    cash_out: 0,
                    upi_in: 0,
                    upi_out: 0
                };
            }
            const group = acc[tx.daily_record_id];
            const amount = Number(tx.amount);

            if (tx.type === 'income') {
                if ((tx.payment_modes || '').toLowerCase() === 'cash') group.cash_in += amount;
                if ((tx.payment_modes || '').toLowerCase() === 'upi') group.upi_in += amount;
            } else if (tx.type === 'expense') {
                if ((tx.payment_modes || '').toLowerCase() === 'cash') group.cash_out += amount;
                if ((tx.payment_modes || '').toLowerCase() === 'upi') group.upi_out += amount;
            }
            return acc;
        }, {} as Record<string, { cash_in: number, cash_out: number, upi_in: number, upi_out: number }>);

        // Build result
        const result = (records as DailyRecordRow[]).map(record => {
            const stats = txMap[record.id] || { cash_in: 0, cash_out: 0, upi_in: 0, upi_out: 0 };
            return {
                date: record.date,
                cash_in: stats.cash_in,
                cash_out: stats.cash_out,
                upi_in: stats.upi_in,
                upi_out: stats.upi_out,
                net_cash: stats.cash_in - stats.cash_out,
                net_upi: stats.upi_in - stats.upi_out
            };
        });

        return NextResponse.json(result);

    } catch (error: unknown) {
        console.error('Error in GET /api/reports/cash-flow:', { message: getErrorMessage(error) });
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
