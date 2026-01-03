export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createRouteClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';

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

export async function GET(request: NextRequest) {
    try {
        const sessionClient = createRouteClient();
        const { data: { session } } = await sessionClient.auth.getSession();

        const isDev = process.env.NODE_ENV === 'development';
        const devBypass = isDev && request.headers.get('x-users-dev') === '1';

        if (!session && !devBypass) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session?.user?.id ?? null;

        if (!devBypass) {
            if (!userId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            const { data: requester } = await sessionClient
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();

            let requesterRole = (requester as Pick<Database['public']['Tables']['users']['Row'], 'role'> | null)?.role;
            if (!requesterRole) {
                const safeEmail = session?.user?.email;
                if (safeEmail === 'frpboy12@gmail.com') {
                    requesterRole = 'superadmin';
                } else {
                    const metaRole = (session?.user as any)?.user_metadata?.role as string | undefined;
                    requesterRole = (metaRole || undefined) as any;
                }
            }
            const allowedViewers = ['master_admin', 'superadmin', 'ho_accountant', 'outlet_manager', 'outlet_staff', 'auditor'];
            if (!requesterRole || !allowedViewers.includes(requesterRole)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from('users')
            .select('*, outlet:outlets(name)')
            .order('name', { ascending: true })
            .limit(1000); // Increased limit for global search

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

        const typedRequester = requester as Pick<Database['public']['Tables']['users']['Row'], 'role'> | null;
        let requesterRole = typedRequester?.role;

        if (!requesterRole) {
            // Check for hardcoded superadmin email as ultimate fallback for bootstrapping
            if (session.user.email === 'frpboy12@gmail.com') {
                requesterRole = 'superadmin';
            } else {
                // Fallback to session metadata when profile row missing
                const metaRole = (session.user as any).user_metadata?.role as string | undefined;
                requesterRole = (metaRole || undefined) as any;
            }
        }

        if (!requesterRole || !['master_admin', 'superadmin'].includes(requesterRole)) {
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
        // Temporary password; require email confirmation
        const tempPassword = Math.random().toString(36).slice(2) + 'A@1';
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: false,
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }

        // Create user profile with outlet_id if provided
        // If requested role is superadmin, enforce approval workflow
        let effectiveRole = role;
        let approvalId: string | undefined;
        if (role === 'superadmin') {
            effectiveRole = 'auditor';
        }

        const { data, error } = await adminClient
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                name: fullName,
                role: effectiveRole,
                outlet_id: outletId || null,
            } as unknown as never)
            .select()
            .single();

        if (error) {
            // Rollback auth user if profile creation fails
            await adminClient.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log creation
        await adminClient
            .from('audit_logs')
            .insert({
                user_id: session.user.id,
                action: 'create_user',
                entity: 'users',
                entity_id: data.id,
                old_data: null,
                new_data: data as unknown as Record<string, unknown>,
                severity: (role === 'superadmin') ? 'critical' : 'normal',
            } as unknown as never);

        // Create approval request if superadmin was requested
        if (role === 'superadmin') {
            const { data: approval } = await (adminClient as any)
                .from('role_approvals')
                .insert({
                    target_user_id: data.id,
                    requested_by: session.user.id,
                    requested_role: 'superadmin',
                    old_role: effectiveRole,
                    status: 'pending',
                } as any)
                .select('*')
                .single();
            approvalId = approval?.id;
        }

        // Rate limiting: deny more than 3 user creations in 10 minutes
        const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { count } = await adminClient
            .from('audit_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .eq('action', 'create_user')
            .gte('created_at', tenMinAgo);
        if ((count || 0) > 3) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        // Outlet is already set in the insert above, no need for separate table

        if (approvalId) {
            return NextResponse.json({ status: 'pending', user: data, approvalId }, { status: 202 });
        }
        return NextResponse.json(data, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
