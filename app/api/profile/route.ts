export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function GET(request: NextRequest) {
    try {
        const response = NextResponse.next();
        const sessionClient = createMiddlewareClient(request, response);
        let user = null as any;
        try {
            const result = await sessionClient.auth.getUser();
            user = result.data.user;
        } catch (err: any) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from('users')
            .select('id,email,role,name,outlet_id,access_start_date,access_end_date,auditor_access_granted_at,auditor_access_expires_at')
            .eq('id', user.id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            // Graceful fallback from session metadata when profile row missing
            const meta = (user as any).user_metadata || {};
            const role = (meta.role || 'outlet_staff') as string;
            const name = (meta.full_name || meta.name || user.email || null) as string | null;
            return NextResponse.json({
                id: user.id,
                email: user.email,
                role,
                name,
                outlet_id: null,
                access_start_date: null,
                access_end_date: null,
                auditor_access_granted_at: null,
                auditor_access_expires_at: null,
            });
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
