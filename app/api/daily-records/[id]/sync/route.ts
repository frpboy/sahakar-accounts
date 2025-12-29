export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sheetsService } from '@/lib/google-sheets';
import type { Database } from '@/lib/database.types';

type DailyRecordWithOutlet = Database['public']['Tables']['daily_records']['Row'] & {
    outlets: Pick<Database['public']['Tables']['outlets']['Row'], 'name' | 'google_sheet_id'> | null;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function POST(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createRouteHandlerClient<any>({ cookies });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: requester } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (!requester || !['ho_accountant', 'master_admin', 'superadmin'].includes(requester.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = params;

        // Get daily record
        const { data: record, error: recordError } = await supabase
            .from('daily_records')
            .select('*, outlets(name, google_sheet_id)')
            .eq('id', id)
            .single();

        const typedRecord = record as DailyRecordWithOutlet | null;

        if (recordError || !typedRecord) {
            return NextResponse.json({ error: 'Daily record not found' }, { status: 404 });
        }

        if (typedRecord.status !== 'locked') {
            return NextResponse.json({ error: 'Only locked records can be synced' }, { status: 409 });
        }

        // Get transactions for this record
        const { data: transactions } = await supabase
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
            await supabase
                .from('outlets')
                .update({ google_sheet_id: sheetId })
                .eq('id', typedRecord.outlet_id);
        }

        // Sync to sheet
        await sheetsService.syncDailyRecord(sheetId, typedRecord.date, typedRecord);
        if (transactions && transactions.length > 0) {
            await sheetsService.syncTransactions(sheetId, transactions);
        }

        // Update sync status
        await supabase
            .from('daily_records')
            .update({
                synced_to_sheets: true,
                last_synced_at: new Date().toISOString(),
            })
            .eq('id', id);

        return NextResponse.json({ success: true, sheetId });
    } catch (error: unknown) {
        console.error('Error syncing to sheet:', error);
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
