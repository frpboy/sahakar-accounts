export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createRouteClient } from '@/lib/supabase-server';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const sessionClient = createRouteClient();
    const { data: { session } } = await sessionClient.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Robust role detection using admin client to bypass RLS
    const admin = createAdminClient();
    const { data: caller } = await admin
      .from('users')
      .select('id,role,outlet_id')
      .eq('id', session.user.id)
      .single();
    const role = (caller as any)?.role || (session.user as any).user_metadata?.role;
    const callerOutlet = (caller as any)?.outlet_id || null;

    const payload = await request.json() as { outlet_id?: string };
    const outletId = payload.outlet_id ?? null;
    // admin client already created above

    // Authorization: superadmin/master_admin can assign any; outlet_manager can assign only their own outlet
    if (role === 'outlet_manager') {
      if (!callerOutlet) {
        return NextResponse.json({ error: 'Managers must be assigned to an outlet before assigning others' }, { status: 403 });
      }
      if (outletId !== callerOutlet) {
        return NextResponse.json({ error: 'Managers can only assign their own outlet' }, { status: 403 });
      }
    } else if (!['superadmin', 'master_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden: insufficient privileges' }, { status: 403 });
    }

    const { data: before } = await admin
      .from('users')
      .select('id,email,name,role,outlet_id')
      .eq('id', (await context.params).id)
      .single();

    const { data: updated, error } = await admin
      .from('users')
      .update({ outlet_id: outletId } as any)
      .eq('id', (await context.params).id)
      .select('id,email,name,role,outlet_id')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await admin
      .from('audit_logs')
      .insert({
        user_id: session.user.id,
        action: 'assign_outlet',
        entity: 'users',
        entity_id: updated.id,
        old_data: before as any,
        new_data: updated as any,
        severity: 'normal',
      } as any);

    return NextResponse.json(updated, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
