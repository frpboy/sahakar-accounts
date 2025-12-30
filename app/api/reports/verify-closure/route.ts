import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';
import crypto from 'crypto';

function getErrorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Unknown error'; }

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = new URL(request.url);
    const outletId = url.searchParams.get('outletId');
    const monthDate = url.searchParams.get('month');
    if (!outletId || !monthDate) return NextResponse.json({ error: 'outletId and month required' }, { status: 400 });
    const { data, error } = await (supabase as any)
      .from('monthly_closure_snapshots')
      .select('id,outlet_id,month_date,snapshot,snapshot_hash,created_at')
      .eq('outlet_id', outletId)
      .eq('month_date', monthDate)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ valid: false, reason: 'no_snapshot' });
    const raw = JSON.stringify((data as any).snapshot || {});
    const recompute = crypto.createHash('md5').update(raw + monthDate + outletId).digest('hex');
    const valid = recompute === (data as any).snapshot_hash;
    return NextResponse.json({ valid, snapshotId: (data as any).id, computed: recompute, stored: (data as any).snapshot_hash });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

