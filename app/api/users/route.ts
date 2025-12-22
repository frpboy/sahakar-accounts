// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

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

        // Create user profile
        const { data, error } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                organization_id: '00000000-0000-0000-0000-000000000001',
                email,
                full_name: fullName,
                role,
                phone,
            })
            .select()
            .single();

        if (error) {
            // Rollback auth user if profile creation fails
            await supabase.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Add outlet access if provided
        if (outletId) {
            await supabase
                .from('user_outlet_access')
                .insert({
                    user_id: authData.user.id,
                    outlet_id: outletId,
                });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
