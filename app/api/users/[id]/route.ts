export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createRouteClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';

type PatchUserBody = {
    role?: string | null;
    outlet_id?: string | null;
    outletId?: string | null;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

const ALLOWED_ROLES = new Set([
    'superadmin',
    'master_admin',
    'ho_accountant',
    'outlet_manager',
    'outlet_staff',
    'auditor',
]);

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const sessionClient = createRouteClient();
        const { data: { session } } = await sessionClient.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: caller, error: callerError } = await sessionClient
            .from('users')
            .select('role,outlet_id')
            .eq('id', session.user.id)
            .single();

        if (callerError || !caller) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const typedCaller = caller as Pick<Database['public']['Tables']['users']['Row'], 'role' | 'outlet_id'>;
        const callerRole = typedCaller.role;
        const callerOutlet = typedCaller.outlet_id ?? null;
        if (!callerRole) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = (await request.json()) as PatchUserBody;
        const role = body.role ?? undefined;
        const outletId = (body.outlet_id ?? body.outletId) ?? undefined;

        const updateData: Record<string, unknown> = {};

        if (role !== undefined) {
            if (role !== null && !ALLOWED_ROLES.has(role)) {
                return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
            }
            // Approval workflow for superadmin
            if (role === 'superadmin') {
                if (callerRole === 'outlet_manager') {
                    return NextResponse.json({ error: 'Managers cannot request superadmin role' }, { status: 403 });
                }
                const adminClient = createAdminClient();
                const { data: target } = await adminClient
                    .from('users')
                    .select('role')
                    .eq('id', (await context.params).id)
                    .single();

                const { data: approval, error: apprErr } = await (adminClient as any)
                    .from('role_approvals')
                    .insert({
                        target_user_id: (await context.params).id,
                        requested_by: session.user.id,
                        requested_role: 'superadmin',
                        old_role: (target as any)?.role || null,
                        status: 'pending',
                    } as any)
                    .select('*')
                    .single();
                if (apprErr) {
                    return NextResponse.json({ error: apprErr.message }, { status: 500 });
                }
                // Audit log request
                await adminClient
                    .from('audit_logs')
                    .insert({
                        user_id: session.user.id,
                        action: 'request_role_superadmin',
                        entity: 'users',
                        entity_id: (await context.params).id,
                        old_data: target as any,
                        new_data: { role: 'superadmin' },
                        severity: 'critical',
                    } as any);
                return NextResponse.json({ status: 'pending', approvalId: approval.id }, { status: 202 });
            }
            // Manager can only assign outlet_staff or outlet_manager within their outlet
            if (callerRole === 'outlet_manager') {
                if (role && !['outlet_staff', 'outlet_manager'].includes(role)) {
                    return NextResponse.json({ error: 'Managers can assign only staff/manager roles' }, { status: 403 });
                }
                // Fetch target to confirm outlet scope
                const adminClient = createAdminClient();
                const { data: targetScope } = await adminClient
                    .from('users')
                    .select('outlet_id')
                    .eq('id', (await context.params).id)
                    .single();
                const targetOutlet = (targetScope as any)?.outlet_id ?? null;
                if (!callerOutlet || !targetOutlet || callerOutlet !== targetOutlet) {
                    return NextResponse.json({ error: 'Managers can modify users in their own outlet only' }, { status: 403 });
                }
            }
            updateData.role = role;
        }

        if (outletId !== undefined) {
            if (callerRole === 'outlet_manager') {
                if (!callerOutlet || outletId !== callerOutlet) {
                    return NextResponse.json({ error: 'Managers can set outlet only to their own outlet' }, { status: 403 });
                }
            }
            updateData.outlet_id = outletId === '' ? null : outletId;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
        }

        const adminClient = createAdminClient();
        const { data: before } = await adminClient
            .from('users')
            .select('id,email,name,role,outlet_id,created_at')
            .eq('id', (await context.params).id)
            .single();

        const { data: updated, error: updateError } = await adminClient
            .from('users')
            .update(updateData as unknown as never)
            .eq('id', params.id)
            .select('id,email,name,role,outlet_id,created_at')
            .single();

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Write audit log
        await adminClient
            .from('audit_logs')
            .insert({
                user_id: session.user.id,
                action: 'update_user_permissions',
                entity: 'users',
                entity_id: updated.id,
                old_data: before ? before as unknown as Record<string, unknown> : null,
                new_data: updated as unknown as Record<string, unknown>,
                severity: (updateData.role === 'superadmin') ? 'critical' : 'normal'
            } as unknown as never);

        return NextResponse.json(updated);
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const sessionClient = createRouteClient();
        const { data: { session } } = await sessionClient.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const admin = createAdminClient();
        const { data: caller } = await admin
            .from('users')
            .select('role,outlet_id')
            .eq('id', session.user.id)
            .single();
        const role = (caller as any)?.role || (session.user as any).user_metadata?.role;
        const callerOutlet = (caller as any)?.outlet_id || null;

        // Allow superadmin/master_admin to delete any user; managers can delete outlet_staff in their outlet
        if (role === 'outlet_manager') {
            const { data: target } = await admin
                .from('users')
                .select('id,role,outlet_id,email,name')
                .eq('id', (await context.params).id)
                .single();
            if (!target || (target as any).role !== 'outlet_staff' || (target as any).outlet_id !== callerOutlet) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        } else if (!['superadmin', 'master_admin'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: before } = await admin
            .from('users')
            .select('id,email,name,role,outlet_id')
            .eq('id', (await context.params).id)
            .single();

        const { error: delErr } = await admin
            .from('users')
            .delete()
            .eq('id', params.id);
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

        // Also remove auth user
        await admin.auth.admin.deleteUser((await context.params).id).catch(() => {});

        await admin
            .from('audit_logs')
            .insert({
                user_id: session.user.id,
                action: 'delete_user',
                entity: 'users',
                entity_id: (await context.params).id,
                old_data: before as any,
                new_data: null,
                severity: 'warning',
            } as any);

        return NextResponse.json({ status: 'deleted' });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
