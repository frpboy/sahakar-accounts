import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        const searchParams = request.nextUrl.searchParams;
        const outletId = searchParams.get('outletId') || '9e0c4614-53cf-40d3-abdd-a1d0183c3909';
        const month = searchParams.get('month'); // Format: YYYY-MM

        if (!month) {
            return NextResponse.json({ error: 'Month parameter required' }, { status: 400 });
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
            opening_balance: records?.[0]?.opening_cash + records?.[0]?.opening_upi || 0,
            closing_balance: records?.[records.length - 1]?.closing_cash + records?.[records.length - 1]?.closing_upi || 0,
        };

        if (records) {
            records.forEach(record => {
                summary.total_income += Number(record.total_income || 0);
                summary.total_expense += Number(record.total_expense || 0);
            });
            summary.net_profit = summary.total_income - summary.total_expense;
        }

        return NextResponse.json(summary);
    } catch (error: any) {
        console.error('Error in GET /api/reports/monthly:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
