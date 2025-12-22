import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const outletId = searchParams.get('outletId') || '9e0c4614-53cf-40d3-abdd-a1d0183c3909';

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'startDate and endDate required' },
                { status: 400 }
            );
        }

        // Get daily records
        const { data: dailyRecords, error: recordsError } = await supabase
            .from('daily_records')
            .select('id')
            .eq('outlet_id', outletId)
            .gte('date', startDate)
            .lte('date', endDate);

        if (recordsError) {
            return NextResponse.json({ error: recordsError.message }, { status: 500 });
        }

        const recordIds = dailyRecords?.map(r => r.id) || [];

        if (recordIds.length === 0) {
            return NextResponse.json([]);
        }

        // Get all transactions and group by category
        const { data: transactions, error: transError } = await supabase
            .from('transactions')
            .select('type, category, amount')
            .in('daily_record_id', recordIds);

        if (transError) {
            return NextResponse.json({ error: transError.message }, { status: 500 });
        }

        // Group by category
        const categoryMap = new Map<string, { income: number; expense: number; net: number }>();

        transactions?.forEach(t => {
            if (!categoryMap.has(t.category)) {
                categoryMap.set(t.category, { income: 0, expense: 0, net: 0 });
            }
            const cat = categoryMap.get(t.category)!;
            if (t.type === 'income') {
                cat.income += Number(t.amount);
                cat.net += Number(t.amount);
            } else {
                cat.expense += Number(t.amount);
                cat.net -= Number(t.amount);
            }
        });

        const summary = Array.from(categoryMap.entries()).map(([category, data]) => ({
            category,
            ...data,
        })).sort((a, b) => Math.abs(b.income + b.expense) - Math.abs(a.income + a.expense));

        return NextResponse.json(summary);
    } catch (error: any) {
        console.error('Error in GET /api/reports/category:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
