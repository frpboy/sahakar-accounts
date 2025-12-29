export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';

type TransactionRow = {
    type: string;
    category: string;
    amount: number | string;
    created_at: string;
};

type GroupedCategory = {
    category: string;
    type: string;
    total: number;
    count: number;
};

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

        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const typedProfile = profile as Pick<Database['public']['Tables']['users']['Row'], 'role'>;
        const profileRole = typedProfile.role;
        if (!profileRole || !['master_admin', 'superadmin', 'ho_accountant'].includes(profileRole)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build query
        let query = supabase
            .from('transactions')
            .select('type,category,amount,created_at');

        // Apply date filters
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', `${endDate}T23:59:59.999Z`);
        }

        const { data: transactions, error } = await query;

        if (error) {
            console.error('Error fetching transactions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Group by category and type
        const grouped = (transactions as TransactionRow[] | null | undefined)?.reduce<Record<string, GroupedCategory>>((acc, tx) => {
            const key = `${tx.category}-${tx.type}`;
            if (!acc[key]) {
                acc[key] = {
                    category: tx.category,
                    type: tx.type,
                    total: 0,
                    count: 0,
                };
            }
            acc[key].total += typeof tx.amount === 'number' ? tx.amount : Number(tx.amount);
            acc[key].count += 1;
            return acc;
        }, {});

        const result = Object.values(grouped || {});

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error('Error in GET /api/reports/category:', { message: getErrorMessage(error) });
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
