import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get('outletId');
        const limit = parseInt(searchParams.get('limit') || '10');

        const supabase = createRouteClient();

        let query = (supabase as any)
            .from('customers')
            .select('referred_by')
            .eq('is_active', true)
            .not('referred_by', 'is', null);

        // Filter by outlet if provided
        if (outletId) {
            query = query.eq('outlet_id', outletId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Count referrals
        const referralCounts: Record<string, number> = {};

        data?.forEach((customer: any) => {
            const referrer = customer.referred_by;
            referralCounts[referrer] = (referralCounts[referrer] || 0) + 1;
        });

        // Convert to array and sort
        const referrers = Object.entries(referralCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        return NextResponse.json({
            referrers,
            totalReferrals: data?.length || 0
        });

    } catch (error: any) {
        console.error('Top referrers error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch top referrers' },
            { status: 500 }
        );
    }
}
