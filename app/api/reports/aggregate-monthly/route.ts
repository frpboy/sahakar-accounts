export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createRouteClient } from '@/lib/supabase-server';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function GET(request: NextRequest) {
  try {
    const sessionClient = createRouteClient();
    const { data: { session } } = await sessionClient.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: caller } = await sessionClient
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    const role = (caller as any)?.role || (session.user as any).user_metadata?.role;
    if (!['superadmin', 'ho_accountant', 'master_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const month = request.nextUrl.searchParams.get('month'); // YYYY-MM
    if (!month) return NextResponse.json({ error: 'Month parameter required' }, { status: 400 });

    const startDate = `${month}-01`;
    const endDate = new Date(month + '-01');
    endDate.setMonth(endDate.getMonth() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('daily_records')
      .select('total_income,total_expense')
      .gte('date', startDate)
      .lt('date', endDateStr);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let totalIncome = 0;
    let totalExpense = 0;
    for (const r of (data || [])) {
      totalIncome += Number((r as any).total_income || 0);
      totalExpense += Number((r as any).total_expense || 0);
    }

    return NextResponse.json({ month, totalIncome, totalExpense, netProfit: totalIncome - totalExpense });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
