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
    if (!outletId) return NextResponse.json({ error: 'outletId required' }, { status: 400 });

    const { data, error } = await (supabase as any)
      .from('outlet_chats')
      .select('*')
      .eq('outlet_id', outletId)
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
    const role = (user as any)?.role || (session.user as any).user_metadata?.role;
    const outletId = (user as any)?.outlet_id || null;
    if (!outletId) return NextResponse.json({ error: 'User not assigned to outlet' }, { status: 403 });

    const body = await request.json() as { content: string };
    if (!body.content || !body.content.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });
    const lower = body.content.toLowerCase();
    const banned = ['abuse','spam','fake'];
    if (banned.some(w => lower.includes(w))) return NextResponse.json({ error: 'Inappropriate content' }, { status: 422 });

    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count } = await sessionClient
      .from('outlet_chats')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .gte('created_at', oneMinAgo);
    if ((count || 0) > 10) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const admin = createAdminClient();
    const { data: inserted, error } = await (admin as any)
      .from('outlet_chats')
      .insert({ outlet_id: outletId, user_id: session.user.id, role, content: body.content.trim() } as any)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await admin
      .from('audit_logs')
      .insert({ user_id: session.user.id, action: 'chat_message', entity: 'outlet', entity_id: outletId, old_data: null, new_data: inserted as any, severity: 'normal' } as any);

    return NextResponse.json(inserted, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

