import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get('outletId');

        if (!outletId) {
            return NextResponse.json(
                { error: 'Outlet ID is required' },
                { status: 400 }
            );
        }

        const supabase = createRouteClient();

        // Get all credit transactions for the outlet
        const { data, error } = await (supabase as any)
            .from('transactions')
            .select('customer_phone, amount, description, created_at')
            .eq('outlet_id', outletId)
            .eq('category', 'credit')
            .eq('transaction_type', 'income')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by customer and calculate outstanding
        const customerCredits: Record<string, { phone: string; amount: number; lastDate: string }> = {};

        data?.forEach((transaction: any) => {
            const phone = transaction.customer_phone;
            if (!customerCredits[phone]) {
                customerCredits[phone] = {
                    phone,
                    amount: 0,
                    lastDate: transaction.created_at
                };
            }
            customerCredits[phone].amount += transaction.amount;
        });

        // Get customer names
        const phones = Object.keys(customerCredits);
        const { data: customers } = await (supabase as any)
            .from('customers')
            .select('phone, name')
            .in('phone', phones);

        const customerMap = new Map(customers?.map((c: any) => [c.phone, c.name]) || []);

        // Convert to array with names
        const byCustomer = Object.values(customerCredits)
            .map(item => ({
                phone: item.phone,
                name: customerMap.get(item.phone) || 'Unknown',
                amount: item.amount,
                lastDate: item.lastDate
            }))
            .filter(item => item.amount > 0)
            .sort((a, b) => b.amount - a.amount);

        const total = byCustomer.reduce((sum, item) => sum + item.amount, 0);

        return NextResponse.json({
            total,
            count: byCustomer.length,
            byCustomer
        });

    } catch (error: any) {
        console.error('Credit outstanding error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch credit outstanding' },
            { status: 500 }
        );
    }
}
