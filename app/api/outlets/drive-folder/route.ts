export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createRouteClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';

type Body = { outletId?: string; driveFolderUrl?: string };

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function POST(request: NextRequest) {
    try {
        const sessionClient = createRouteClient();
        const { data: { session } } = await sessionClient.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: requester } = await sessionClient
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        const role = (requester as Pick<Database['public']['Tables']['users']['Row'], 'role'> | null)?.role
            || (session.user as any).user_metadata?.role
            || (session.user.email === 'frpboy12@gmail.com' ? 'superadmin' : undefined);

        if (!role || !['superadmin', 'master_admin'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = (await request.json()) as Body;
        const outletId = body.outletId;
        const driveFolderUrl = (body.driveFolderUrl || '').trim();

        if (!outletId || !driveFolderUrl) {
            return NextResponse.json({ error: 'Outlet ID and folder URL required' }, { status: 400 });
        }

        // Basic validation
        const isDriveUrl = /^https:\/\/drive\.google\.com\//.test(driveFolderUrl);
        if (!isDriveUrl) {
            return NextResponse.json({ error: 'Invalid Google Drive URL' }, { status: 400 });
        }

        const admin = createAdminClient();
        const { data, error } = await admin
            .from('outlets')
            .update({ drive_folder_url: driveFolderUrl } as unknown as Database['public']['Tables']['outlets']['Update'])
            .eq('id', outletId)
            .select('id,name,code,drive_folder_url')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
