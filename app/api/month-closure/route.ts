export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { startOfMonth } from 'date-fns';

const ClosureSchema = z.object({
    outlet_id: z.string().uuid(),
    month_date: z.string(), // YYYY-MM-DD
    action: z.enum(['close', 'reopen']),
    reason: z.string().min(10).optional(), // Required for reopen
});

export async function POST(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify role (HO Accountant or Superadmin only)
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (!['superadmin', 'ho_accountant'].includes(user?.role || '')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const validation = ClosureSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors }, { status: 400 });
        }

        const { outlet_id, month_date, action, reason } = validation.data;
        const monthStart = startOfMonth(new Date(month_date)).toISOString().split('T')[0];

        // For reopen, reason is mandatory
        if (action === 'reopen' && !reason) {
            return NextResponse.json({ error: 'Reason is required for reopening a month' }, { status: 400 });
        }

        // 1. Calculate snapshots if closing
        let snapshots = {};
        if (action === 'close') {
            // Get aggregates from daily_records
            const { data: aggregates, error: aggError } = await supabase
                .from('daily_records')
                .select('total_income, total_expense, opening_cash, closing_cash')
                .eq('outlet_id', outlet_id)
                .gte('date', monthStart)
                .lte('date', new Date(new Date(monthStart).setMonth(new Date(monthStart).getMonth() + 1, 0)).toISOString().split('T')[0]);

            if (aggError) throw aggError;

            // Simple sum logic (refine based on exact business logic if needed)
            const totalIncome = aggregates?.reduce((sum, r) => sum + (r.total_income || 0), 0) || 0;
            const totalExpense = aggregates?.reduce((sum, r) => sum + (r.total_expense || 0), 0) || 0;
            const openingCash = aggregates?.[0]?.opening_cash || 0; // First day opening
            const closingCash = aggregates?.[aggregates.length - 1]?.closing_cash || 0; // Last day closing

            snapshots = {
                total_income: totalIncome,
                total_expense: totalExpense,
                opening_cash: openingCash,
                closing_cash: closingCash,
                closed_at: new Date().toISOString(),
                closed_by: session.user.id
            };
        } else {
            // Reopen
            snapshots = {
                closed_at: null,
                closed_by: null
            };
        }

        // 2. Upsert closure record
        const { data, error } = await supabase
            .from('monthly_closures')
            .upsert({
                outlet_id,
                month_date: monthStart,
                status: action === 'close' ? 'closed' : 'open',
                updated_at: new Date().toISOString(),
                ...snapshots
            })
            .select()
            .single();

        if (error) throw error;

        // 3. Log Audit
        await supabase.from('audit_logs').insert({
            user_id: session.user.id,
            action: `month.${action}`,
            entity_type: 'monthly_closures',
            entity_id: data.id,
            details: { outlet_id, month: monthStart, reason },
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown'
        });

        return NextResponse.json({ success: true, data });

    } catch (error) {
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}
