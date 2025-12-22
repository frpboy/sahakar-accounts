// @ts-nocheck
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        const searchParams = request.nextUrl.searchParams;
        const outletId = searchParams.get('outletId') || '9e0c4614-53cf-40d3-abdd-a1d0183c3909';
        const month = searchParams.get('month'); // Format: YYYY-MM

        let query = supabase
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
    } catch (error: any) {
        console.error('Error in GET /api/daily-records:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
