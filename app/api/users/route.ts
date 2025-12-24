// @ts-nocheck
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('users')
            .select('id,email,name,role,outlet_id,phone,created_at')
            .order('created_at', { ascending: false })
            .limit(100); // Limit to 100 users

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
        const supabase = createAdminClient();
        const body = await request.json();

        const { email, fullName, role, phone, outletId } = body;

        if (!email || !fullName || !role) {
            return NextResponse.json(
                { error: 'Email, name, and role required' },
                { status: 400 }
            );
        }

        // Create auth user first
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: 'Zabnix@2025', // Default password
            email_confirm: true,
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }

        // Create user profile with outlet_id if provided
        const { data, error } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                name: fullName,
                role,
                phone,
                outlet_id: outletId || null,
            })
            .select()
            .single();

        if (error) {
            // Rollback auth user if profile creation fails
            await supabase.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Outlet is already set in the insert above, no need for separate table

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
