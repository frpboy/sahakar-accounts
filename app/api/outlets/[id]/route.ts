
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-server';

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createRouteClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (!profile || !['master_admin', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await request.json();

        // Extract allowed fields
        const updateData: any = {};
        if (body.name) updateData.name = body.name;
        if (body.code) updateData.code = body.code;
        if (body.address) updateData.address = body.address;
        if (body.location) updateData.location = body.location;
        if (body.type) updateData.type = body.type;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;

        const adminForUpdate = createAdminClient();
        const { data, error } = await adminForUpdate
            .from('outlets')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'Outlet not found or permission denied' }, { status: 404 });
        }

        const updatedOutlet = data[0];

        // Audit Log
        try {
            const admin = createAdminClient();
            await admin.from('audit_logs').insert({
                user_id: session.user.id,
                action: 'update_outlet',
                entity: 'outlets',
                entity_id: id,
                new_data: updateData,
                severity: 'warning'
            } as any);
        } catch (e) {
            console.error('Audit log failed', e);
        }

        return NextResponse.json(updatedOutlet);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
