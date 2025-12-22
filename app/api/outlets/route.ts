import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();

        const { data, error } = await supabase
            .from('outlets')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const body = await request.json();

        const { name, code, location, phone, email } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Name and code required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('outlets')
            .insert({
                organization_id: '00000000-0000-0000-0000-000000000001',
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
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
