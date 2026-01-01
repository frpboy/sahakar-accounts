import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get('outletId');
        const months = parseInt(searchParams.get('months') || '6');

        const supabase = createRouteClient();

        // Calculate start date (N months ago)
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);
        const startDateStr = startDate.toISOString().split('T')[0];

        let query = (supabase as any)
            .from('customers')
            .select('created_at')
            .gte('created_at', startDateStr)
            .eq('is_active', true);

        // Filter by outlet if provided
        if (outletId) {
            query = query.eq('outlet_id', outletId);
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) throw error;

        // Group by month
        const monthlyData: Record<string, number> = {};

        data?.forEach((customer: any) => {
            const date = new Date(customer.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
        });

        // Convert to array format
        const labels: string[] = [];
        const values: number[] = [];

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        Object.keys(monthlyData).sort().forEach(monthKey => {
            const [year, month] = monthKey.split('-');
            const monthNum = parseInt(month) - 1;
            labels.push(`${monthNames[monthNum]} ${year.slice(2)}`);
            values.push(monthlyData[monthKey]);
        });

        return NextResponse.json({
            labels,
            values,
            total: values.reduce((sum, val) => sum + val, 0)
        });

    } catch (error: any) {
        console.error('Customer growth error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch customer growth data' },
            { status: 500 }
        );
    }
}
