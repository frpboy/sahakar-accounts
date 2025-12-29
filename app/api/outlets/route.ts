export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

type CreateOutletBody = {
    name?: string;
    code?: string;
    location?: string;
    phone?: string;
    email?: string;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient<Database, 'public'>({ cookies });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        let query = supabase
            .from('outlets')
            .select('id,name,code,address,phone,email,created_at')
            .order('name');

        if (id) {
            query = query.eq('id', id).limit(1);
        }

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
        const supabase = createRouteHandlerClient<Database, 'public'>({ cookies });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: requester } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (!requester || !['master_admin', 'superadmin'].includes(requester.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = (await request.json()) as CreateOutletBody;

        const { name, code, location, phone, email } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Name and code required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('outlets')
            .insert({
                name,
                code,
                location,
                phone,
                email,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
