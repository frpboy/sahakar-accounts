export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';
import { createRouteClient } from '@/lib/supabase-server';

type LockBody = {
    reason?: string;
};

type LockRpcResult = {
    success: boolean;
    message?: string;
    error?: string;
};

type DailyRecordWithOutlet = Database['public']['Tables']['daily_records']['Row'] & {
    outlets: Pick<Database['public']['Tables']['outlets']['Row'], 'name' | 'google_sheet_id'> | null;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

type RpcClient = {
    rpc: (
        fn: string,
        args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createRouteClient();

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;

        // Get reason from request body (optional)
        const body = (await request.json().catch(() => ({}))) as LockBody;
        const reason = typeof body.reason === 'string' ? body.reason : null;

        // Call lock_day RPC (validates role and logs automatically)
        const rpcClient = supabase as unknown as RpcClient;
        const { data, error } = await rpcClient.rpc('lock_day', {
            record_id: id,
            locked_by_user_id: session.user.id,
            lock_reason: reason
        });

        if (error) {
            console.error('Error calling lock_day RPC:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const rpcResult = data as LockRpcResult | null;

        // RPC returns JSON with success/error
        if (!rpcResult || !rpcResult.success) {
            return NextResponse.json({
                error: rpcResult?.error || 'Failed to lock record'
            }, { status: 400 });
        }

        // Google Sheets integration discontinued

        return NextResponse.json({
            success: true,
            message: rpcResult.message
        });
    } catch (error: unknown) {
        console.error('Error in POST /api/daily-records/[id]/lock:', { message: getErrorMessage(error) });
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
