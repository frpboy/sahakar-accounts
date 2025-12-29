export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

type UnlockBody = {
    reason?: string;
};

type UnlockRpcResult = {
    success: boolean;
    message?: string;
    error?: string;
    warning?: string;
    unlock_reason?: string;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

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

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (userError) {
            return NextResponse.json({ error: userError.message }, { status: 500 });
        }

        if (user?.role !== 'master_admin') {
            return NextResponse.json({ error: 'Forbidden - Master Admin only' }, { status: 403 });
        }

        const { id } = params;

        // Get mandatory reason from request body
        const body = (await request.json()) as UnlockBody;
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

        const rpcResult = data as UnlockRpcResult | null;

        // RPC returns JSON with success/error
        if (!rpcResult || !rpcResult.success) {
            return NextResponse.json({
                error: rpcResult?.error || 'Failed to unlock record'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: rpcResult.message,
            warning: rpcResult.warning,
            unlock_reason: rpcResult.unlock_reason
        });
    } catch (error: unknown) {
        console.error('Error in POST /api/daily-records/[id]/unlock:', { message: getErrorMessage(error) });
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
