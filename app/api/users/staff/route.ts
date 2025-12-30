export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createRouteClient } from '@/lib/supabase-server';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function POST(request: NextRequest) {
  try {
    const sessionClient = createRouteClient();
    const { data: { session } } = await sessionClient.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: caller } = await sessionClient
      .from('users')
      .select('role,outlet_id')
      .eq('id', session.user.id)
      .single();
    const role = (caller as any)?.role || (session.user as any).user_metadata?.role;
    const outletId = (caller as any)?.outlet_id || null;
    if (role !== 'outlet_manager' || !outletId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json() as { email: string; fullName: string };
    if (!body.email || !body.fullName) {
      return NextResponse.json({ error: 'Email and name required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const tempPassword = Math.random().toString(36).slice(2) + 'A@1';
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: body.email,
      password: tempPassword,
      email_confirm: false,
    });
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

    const { data: profile, error: profErr } = await admin
      .from('users')
      .insert({ id: authData.user.id, email: body.email, name: body.fullName, role: 'outlet_staff', outlet_id: outletId } as any)
      .select('*')
      .single();
    if (profErr) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    await admin
      .from('audit_logs')
      .insert({
        user_id: session.user.id,
        action: 'create_user',
        entity: 'users',
        entity_id: profile.id,
        old_data: null,
        new_data: profile as any,
        severity: 'normal',
      } as any);

    return NextResponse.json(profile, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
