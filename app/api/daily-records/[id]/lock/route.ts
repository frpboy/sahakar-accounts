export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sheetsService } from '@/lib/google-sheets';
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
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createRouteClient();

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

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

        // --- AUTOMATED SYNC START ---
        try {
            console.log(`[AutoSync] Starting sync for record ${id}...`);
            const adminSupabase = createRouteClient();

            // Get daily record with outlet info
            const { data: record, error: recordError } = await adminSupabase
                .from('daily_records')
                .select('*, outlets(name, google_sheet_id)')
                .eq('id', id)
                .single();

            const typedRecord = record as DailyRecordWithOutlet | null;

            if (!recordError && typedRecord) {
                // Get transactions
                const { data: transactions } = await adminSupabase
                    .from('transactions')
                    .select('*')
                    .eq('daily_record_id', id);

                // Get or create sheet
                let sheetId = typedRecord.outlets?.google_sheet_id;
                if (!sheetId) {
                    const month = new Date(typedRecord.date).toISOString().slice(0, 7);
                    sheetId = await sheetsService.createMonthlySheet(
                        typedRecord.outlets?.name || 'Outlet',
                        month
                    );

                    // Update outlet with sheet ID
                    await adminSupabase
                        .from('outlets')
                        .update({ google_sheet_id: sheetId })
                        .eq('id', typedRecord.outlet_id);
                }

                // Sync to sheet
                await sheetsService.syncDailyRecord(sheetId, typedRecord.date, typedRecord);
                if (transactions && transactions.length > 0) {
                    await sheetsService.syncTransactions(
                        sheetId,
                        transactions as Database['public']['Tables']['transactions']['Row'][]
                    );
                }

                // Update sync status in daily_records
                await adminSupabase
                    .from('daily_records')
                    .update({
                        synced_to_sheets: true,
                        last_synced_at: new Date().toISOString(),
                    })
                    .eq('id', id);

                console.log(`[AutoSync] ✅ Successfully synced record ${id} to sheet ${sheetId}`);
            }
        } catch (syncError: unknown) {
            console.error('[AutoSync] ❌ Failed to auto-sync:', { message: getErrorMessage(syncError) });
            // We don't fail the lock action if sync fails, but we should log it
            // The record is already locked in DB
        }
        // --- AUTOMATED SYNC END ---

        return NextResponse.json({
            success: true,
            message: rpcResult.message
        });
    } catch (error: unknown) {
        console.error('Error in POST /api/daily-records/[id]/lock:', { message: getErrorMessage(error) });
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
