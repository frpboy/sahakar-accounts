import { NextResponse } from 'next/server';
import { createAdminClient, createRouteClient } from '@/lib/supabase-server';

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

        const adminRole = (adminUser as any)?.role as string | undefined;
        if (adminUserError || !adminRole || !['master_admin', 'superadmin'].includes(adminRole)) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { auditor_id, days } = await request.json();

        if (!auditor_id || typeof days !== 'number' || !Number.isFinite(days) || days <= 0) {
            return NextResponse.json({ error: 'Missing required fields: auditor_id, days' }, { status: 400 });
        }

        // Calculate expiry date
        const grantedAt = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        // Grant access
        const adminClient = createAdminClient();
        const { error } = await adminClient
            .from('users')
            .update({
                auditor_access_granted_at: grantedAt.toISOString(),
                auditor_access_expires_at: expiresAt.toISOString(),
                auditor_access_granted_by: session.user.id
            })
            .eq('id', auditor_id)
            .eq('role', 'auditor');

        if (error) {
            console.error('[GrantAccess] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            granted_at: grantedAt,
            expires_at: expiresAt,
            days: days
        });
    } catch (error: unknown) {
        console.error('[GrantAccess] Exception:', error);
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
