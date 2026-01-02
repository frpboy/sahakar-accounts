export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient, createAdminClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';

type CreateOutletBody = {
    name?: string;
    code?: string;
    location?: string;
    phone?: string;
    email?: string;
    type?: string;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteClient();
        const { data: { session } } = await supabase.auth.getSession();

        const isDev = process.env.NODE_ENV === 'development';
        const devBypass = isDev && request.headers.get('x-outlets-dev') === '1';

        if (!session && !devBypass) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        // Determine role; allow admin bypass via service role
        const { data: profile } = session ? await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single() : { data: null } as any;
        let role = (profile as Pick<Database['public']['Tables']['users']['Row'], 'role'> | null)?.role;
        if (!role && session) {
            const metaRole = (session.user as any).user_metadata?.role as string | undefined;
            role = metaRole ?? (session.user.email === 'frpboy12@gmail.com' ? 'superadmin' : undefined);
        }

        if (devBypass || ['superadmin', 'master_admin'].includes(role || '')) {
            const admin = createAdminClient();
            let adminQuery = admin
                .from('outlets')
                .select('id,name,code,address,phone,email,created_at')
                .order('name');
            if (id) adminQuery = adminQuery.eq('id', id).limit(1);
            const { data, error } = await adminQuery;
            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json(data);
        }

        // Non-admin path uses session client (RLS applies)
        let query = supabase
            .from('outlets')
            .select('id,name,code,address,phone,email,created_at')
            .order('name');
        if (id) query = query.eq('id', id).limit(1);
        const { data, error } = await query;

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
        const supabase = createRouteClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: requester } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        const typedRequester = requester as Pick<Database['public']['Tables']['users']['Row'], 'role'> | null;
        let requesterRole = typedRequester?.role;
        if (!requesterRole) {
            const metaRole = (session.user as any).user_metadata?.role as string | undefined;
            requesterRole = metaRole ?? (session.user.email === 'frpboy12@gmail.com' ? 'superadmin' : undefined);
        }
        if (!requesterRole || !['master_admin', 'superadmin'].includes(requesterRole)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = (await request.json()) as CreateOutletBody;

        const { name, code, location, phone, email, type } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Name and code required' }, { status: 400 });
        }

        const insertPayload: Database['public']['Tables']['outlets']['Insert'] = {
            name,
            code,
            location,
            phone,
            email,
            type: type || 'hyper_pharmacy', // Default if not provided
        };
        // Use admin client to bypass RLS for outlet creation
        const admin = createAdminClient();
        const { data, error } = await admin
            .from('outlets')
            .insert(insertPayload as unknown as never)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit: create_outlet
        await admin
            .from('audit_logs')
            .insert({
                user_id: session.user.id,
                action: 'create_outlet',
                entity: 'outlets',
                entity_id: data.id,
                old_data: null,
                new_data: data as any,
                severity: 'normal',
            } as any);

        return NextResponse.json(data, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
