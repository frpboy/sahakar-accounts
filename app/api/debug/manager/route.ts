import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = createAdminClient();

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
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
