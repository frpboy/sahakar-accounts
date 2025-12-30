export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createRouteClient } from '@/lib/supabase-server';

function getErrorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Unknown error'; }

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const outletId = request.nextUrl.searchParams.get('outletId');
    const pageKey = request.nextUrl.searchParams.get('pageKey') || 'admin';
    if (!outletId) return NextResponse.json({ error: 'outletId required' }, { status: 400 });
    const { data, error } = await (supabase as any)
      .from('dashboard_annotations')
      .select('*')
      .eq('outlet_id', outletId)
      .eq('page_key', pageKey)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionClient = createRouteClient();
    const { data: { session } } = await sessionClient.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: user } = await sessionClient
      .from('users')
      .select('role,outlet_id')
      .eq('id', session.user.id)
      .single();
    const outletId = (user as any)?.outlet_id || null;
    if (!outletId) return NextResponse.json({ error: 'User not assigned to outlet' }, { status: 403 });
    const body = await request.json() as { text: string; pageKey?: string };
    if (!body.text || !body.text.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 });
    const pageKey = body.pageKey || 'admin';
    const admin = createAdminClient();
    const { data: inserted, error } = await (admin as any)
      .from('dashboard_annotations')
      .insert({ outlet_id: outletId, user_id: session.user.id, page_key: pageKey, text: body.text.trim() } as any)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin
      .from('audit_logs')
      .insert({ user_id: session.user.id, action: 'add_annotation', entity: 'outlet', entity_id: outletId, old_data: null, new_data: inserted as any, severity: 'normal' } as any);
    return NextResponse.json(inserted, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

