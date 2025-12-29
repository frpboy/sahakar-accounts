export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';
import { createAdminClient } from '@/lib/supabase-server';

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
    { params }: { params: { id: string } }
) {
    try {
        const sessionClient = createRouteHandlerClient<Database, 'public'>({ cookies });
        const { data: { session } } = await sessionClient.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: caller, error: callerError } = await sessionClient
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (callerError || !caller) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!['master_admin', 'superadmin'].includes(caller.role)) {
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
            updateData.role = role;
        }

        if (outletId !== undefined) {
            updateData.outlet_id = outletId === '' ? null : outletId;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
        }

        const adminClient = createAdminClient();
        const { data: updated, error: updateError } = await adminClient
            .from('users')
            .update(updateData)
            .eq('id', params.id)
            .select('id,email,name,role,outlet_id,created_at')
            .single();

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json(updated);
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
