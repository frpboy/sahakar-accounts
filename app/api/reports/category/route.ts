// @ts-nocheck
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build query
        let query = supabase
            .from('transactions')
            .select('type,category,amount,date');

        // Apply date filters
        if (startDate) {
            query = query.gte('date', startDate);
        }
        if (endDate) {
            query = query.lte('date', endDate);
        }

        const { data: transactions, error } = await query;

        if (error) {
            console.error('Error fetching transactions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Group by category and type
        const grouped = transactions?.reduce((acc: any, tx: any) => {
            const key = `${tx.category}-${tx.type}`;
            if (!acc[key]) {
                acc[key] = {
                    category: tx.category,
                    type: tx.type,
                    total: 0,
                    count: 0,
                };
            }
            acc[key].total += parseFloat(tx.amount);
            acc[key].count += 1;
            return acc;
        }, {});

        const result = Object.values(grouped || {});

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in GET /api/reports/category:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
