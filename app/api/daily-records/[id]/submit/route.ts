export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';

type SubmitRpcResult = {
    success: boolean;
    message?: string;
    error?: string;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

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

        // Call submit_day RPC (validates and logs automatically)
        const { data, error } = await supabase.rpc('submit_day', {
            record_id: id,
            submitted_by_user_id: session.user.id
        });

        if (error) {
            console.error('Error calling submit_day RPC:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const rpcResult = data as SubmitRpcResult | null;

        // RPC returns JSON with success/error
        if (!rpcResult || !rpcResult.success) {
            return NextResponse.json({
                error: rpcResult?.error || 'Failed to submit record'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: rpcResult.message
        });
    } catch (error: unknown) {
        console.error('Error in POST /api/daily-records/[id]/submit:', { message: getErrorMessage(error) });
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
