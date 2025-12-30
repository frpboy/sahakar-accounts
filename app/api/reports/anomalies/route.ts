import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';

function getErrorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Unknown error'; }

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = new URL(request.url);
    const outletId = url.searchParams.get('outletId');
    const month = url.searchParams.get('month');
    if (!outletId || !month) return NextResponse.json({ error: 'outletId and month required' }, { status: 400 });

    const start = new Date(`${month}-01T00:00:00.000Z`).toISOString();
    const endDate = new Date(`${month}-01T00:00:00.000Z`);
    endDate.setMonth(endDate.getMonth() + 1);
    const end = endDate.toISOString();

    const { data: days, error } = await (supabase as any)
      .from('daily_records')
      .select('id,date,total_income,total_expense,closing_cash,closing_upi,status')
      .eq('outlet_id', outletId)
      .gte('date', start)
      .lt('date', end)
      .order('date', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const incomes = ((days || []) as any[]).map((d: any) => Number(d.total_income || 0)).filter((n: any) => Number.isFinite(n));
    const median = incomes.length ? incomes.sort((a,b)=>a-b)[Math.floor(incomes.length/2)] : 0;
    const anomalies = [] as any[];
    for (const d of ((days || []) as any[])) {
      const inc = Number((d as any).total_income || 0);
      const exp = Number((d as any).total_expense || 0);
      const net = inc - exp;
      if (inc > median * 3 && inc > 1000) anomalies.push({ type: 'income_spike', date: (d as any).date, value: inc, median });
      if (net < -100) anomalies.push({ type: 'negative_net', date: (d as any).date, value: net });
      if ((d as any).status === 'draft') anomalies.push({ type: 'unsubmitted_day', date: (d as any).date });
      if (((d as any).closing_cash || 0) < 0 || ((d as any).closing_upi || 0) < 0) anomalies.push({ type: 'negative_closing', date: (d as any).date });
    }

    // Missing days detection
    const seen = new Set(((days || []) as any[]).map((d: any) => new Date(d.date).getUTCDate()));
    const missing = [] as number[];
    const sampleDate = new Date(start);
    const daysInMonth = new Date(sampleDate.getUTCFullYear(), sampleDate.getUTCMonth()+1, 0).getUTCDate();
    for (let i=1;i<=daysInMonth;i++) if (!seen.has(i)) missing.push(i);
    if (missing.length) anomalies.push({ type: 'missing_days', days: missing });

    return NextResponse.json({ anomalies, summary: { median_income: median, days_count: (days||[]).length } });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

