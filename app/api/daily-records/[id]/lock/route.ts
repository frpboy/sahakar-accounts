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

        // Get reason from request body (optional)
        const body = await request.json().catch(() => ({}));
        const reason = body.reason || null;

        // Call lock_day RPC (validates role and logs automatically)
        const { data, error } = await supabase.rpc('lock_day', {
            record_id: id,
            locked_by_user_id: session.user.id,
            lock_reason: reason
        });

        if (error) {
            console.error('Error calling lock_day RPC:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // RPC returns JSON with success/error
        if (!data || !data.success) {
            return NextResponse.json({
                error: data?.error || 'Failed to lock record'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: data.message
        });
    } catch (error: any) {
        console.error('Error in POST /api/daily-records/[id]/lock:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
