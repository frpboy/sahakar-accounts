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

        const { auditor_id } = await request.json();

        if (!auditor_id) {
            return NextResponse.json({ error: 'Missing required field: auditor_id' }, { status: 400 });
        }

        // Revoke access by setting expiry to now
        const { error } = await supabase
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
