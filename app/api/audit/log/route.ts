export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createMiddlewareClient } from '@/lib/supabase-server';
export const runtime = 'nodejs';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function POST(request: NextRequest) {
    try {
        const response = NextResponse.next();
        const sessionClient = createMiddlewareClient(request, response);
        let user: any = null;
        try {
            const r = await sessionClient.auth.getUser();
            user = r.data.user;
        } catch (e) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await request.json() as { action: string; entity?: string; entity_id?: string; severity?: string; reason?: string };
        if (!payload?.action) {
            return NextResponse.json({ error: 'Action required' }, { status: 400 });
        }
        const admin = createAdminClient();

        const ip = request.headers.get('x-forwarded-for') || null;
        const ua = request.headers.get('user-agent') || null;

        const { error } = await admin
            .from('audit_logs')
            .insert({
                user_id: user.id,
                action: payload.action,
                entity: payload.entity || 'page',
                entity_id: payload.entity_id || null,
                old_data: null,
                new_data: null,
                severity: payload.severity || 'normal',
                reason: payload.reason || null,
                ip_address: ip,
                user_agent: ua,
            } as any);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ status: 'ok' }, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
