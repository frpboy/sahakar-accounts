export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createRouteClient } from '@/lib/supabase-server';

type CreateUserBody = {
    email?: string;
    fullName?: string;
    role?: string;
    phone?: string | null;
    outletId?: string | null;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function GET() {
    try {
        const sessionClient = createRouteClient();
        const { data: { session } } = await sessionClient.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: requester } = await sessionClient
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (!requester || !['master_admin', 'superadmin'].includes(requester.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from('users')
            .select('id,email,name,role,outlet_id,created_at')
            .order('created_at', { ascending: false })
            .limit(100); // Limit to 100 users

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const sessionClient = createRouteClient();
        const { data: { session } } = await sessionClient.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: requester } = await sessionClient
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (!requester || !['master_admin', 'superadmin'].includes(requester.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = (await request.json()) as CreateUserBody;

        const { email, fullName, role, outletId } = body;

        if (!email || !fullName || !role) {
            return NextResponse.json(
                { error: 'Email, name, and role required' },
                { status: 400 }
            );
        }

        const allowedRoles = ['master_admin', 'superadmin', 'ho_accountant', 'outlet_manager', 'outlet_staff', 'auditor'] as const;
        if (!allowedRoles.includes(role as (typeof allowedRoles)[number])) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Create auth user first
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email,
            password: 'Zabnix@2025', // Default password
            email_confirm: true,
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }

        // Create user profile with outlet_id if provided
        const { data, error } = await adminClient
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                name: fullName,
                role,
                outlet_id: outletId || null,
            })
            .select()
            .single();

        if (error) {
            // Rollback auth user if profile creation fails
            await adminClient.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Outlet is already set in the insert above, no need for separate table

        return NextResponse.json(data, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
