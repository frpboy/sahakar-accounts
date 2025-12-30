import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient, createAdminClient } from '@/lib/supabase-server';
import crypto from 'crypto';

function getErrorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Unknown error'; }

function toCSV(rows: any[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => esc(r[h])).join(',')));
  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single();
    const role = (user as any)?.role || (session.user as any).user_metadata?.role;
    if (!['auditor','superadmin','ho_accountant','master_admin'].includes(role || '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const url = new URL(request.url);
    const kind = url.searchParams.get('kind') || 'audit_logs';
    const outletId = url.searchParams.get('outletId') || undefined;
    const start = url.searchParams.get('start') || undefined;
    const end = url.searchParams.get('end') || undefined;

    const admin = createAdminClient();
    let query: any;
    if (kind === 'audit_logs') {
      query = admin.from('audit_logs').select('*');
    } else if (kind === 'transactions') {
      query = admin.from('transactions').select('*');
    } else if (kind === 'daily_records') {
      query = admin.from('daily_records').select('*');
    } else {
      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
    }
    if (outletId && kind !== 'audit_logs') query = query.eq('outlet_id', outletId);
    if (start) query = query.gte('created_at', start);
    if (end) query = query.lte('created_at', end);
    const { data, error } = await query.limit(5000);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const csv = toCSV(data || []);

    // Log export
    try {
      await (admin as any).from('export_logs').insert({
        user_id: session.user.id,
        user_role: role,
        export_type: 'excel',
        report_type: kind,
        file_hash: crypto.createHash('sha256').update(csv).digest('hex'),
        record_count: (data || []).length,
        filters: { outletId, start, end },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      } as any);
    } catch {}

    return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename=${kind}.csv` } });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

