// @ts-nocheck
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        // Get mandatory reason from request body
        const body = await request.json();
        const reason = body.reason;

        if (!reason || reason.trim() === '') {
            return NextResponse.json({
                error: 'Unlock reason is required for audit compliance'
            }, { status: 400 });
        }

        // Call unlock_day RPC (validates superadmin role and logs as critical)
        const { data, error } = await supabase.rpc('unlock_day', {
            record_id: id,
            admin_id: session.user.id,
            unlock_reason: reason
        });

        if (error) {
            console.error('Error calling unlock_day RPC:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // RPC returns JSON with success/error
        if (!data || !data.success) {
            return NextResponse.json({
                error: data?.error || 'Failed to unlock record'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: data.message,
            warning: data.warning,
            unlock_reason: data.unlock_reason
        });
    } catch (error: any) {
        console.error('Error in POST /api/daily-records/[id]/unlock:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
