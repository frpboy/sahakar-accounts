import { NextResponse } from 'next/server';
import { createAdminClient, createRouteClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function POST(request: Request) {
    try {
        const sessionClient = createRouteClient();
        const { data: { session } } = await sessionClient.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: adminUser, error: adminUserError } = await sessionClient
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        const typedAdminUser = adminUser as Pick<Database['public']['Tables']['users']['Row'], 'role'> | null;
        const adminRole = typedAdminUser?.role;
        if (adminUserError || !adminRole || !['master_admin', 'superadmin'].includes(adminRole)) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { auditor_id } = await request.json();

        if (!auditor_id) {
            return NextResponse.json({ error: 'Missing required field: auditor_id' }, { status: 400 });
        }

        // Revoke access by setting expiry to now
        const adminClient = createAdminClient();
        const { error } = await adminClient
            .from('users')
            .update({
                auditor_access_expires_at: new Date().toISOString()
            })
            .eq('id', auditor_id)
            .eq('role', 'auditor');

        if (error) {
            console.error('[RevokeAccess] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            revoked_at: new Date()
        });
    } catch (error: unknown) {
        console.error('[RevokeAccess] Exception:', error);
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
