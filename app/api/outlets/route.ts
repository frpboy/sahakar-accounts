export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';

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
        const supabase = createRouteClient();
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

        const requesterRole = (requester as any)?.role as string | undefined;
        if (!requesterRole || !['master_admin', 'superadmin'].includes(requesterRole)) {
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
            } as any)
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
