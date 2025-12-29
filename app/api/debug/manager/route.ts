import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function GET() {
    try {
        const supabase = createRouteHandlerClient<Database>({ cookies });
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

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'manager.test@sahakar.com')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            user,
            message: "Debug info for manager.test@sahakar.com"
        });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
