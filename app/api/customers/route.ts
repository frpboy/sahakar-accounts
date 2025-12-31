import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const outletId = searchParams.get('outlet_id');

        let query = supabase
            .from('customers')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (outletId) {
            query = query.eq('outlet_id', outletId);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ customers: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, phone, email, address, notes, outlet_id, credit_limit } = body;

        // Validation
        if (!name || !outlet_id) {
            return NextResponse.json(
                { error: 'Name and outlet_id are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('customers')
            .insert({
                name,
                phone,
                email,
                address,
                notes,
                outlet_id,
                credit_limit: credit_limit || 0,
                outstanding_balance: 0,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ customer: data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
