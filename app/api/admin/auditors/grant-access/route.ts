import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function POST(request: Request) {
    try {
        const supabase = createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: adminUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!adminUser || !['master_admin', 'superadmin'].includes(adminUser.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { auditor_id, days } = await request.json();

        if (!auditor_id || !days) {
            return NextResponse.json({ error: 'Missing required fields: auditor_id, days' }, { status: 400 });
        }

        // Calculate expiry date
        const grantedAt = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        // Grant access
        const { error } = await supabase
            .from('users')
            .update({
                auditor_access_granted_at: grantedAt.toISOString(),
                auditor_access_expires_at: expiresAt.toISOString(),
                auditor_access_granted_by: user.id
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
