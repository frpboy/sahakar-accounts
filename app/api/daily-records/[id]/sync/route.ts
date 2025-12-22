import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sheetsService } from '@/lib/google-sheets';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient();
        const { id } = params;

        // Get daily record
        const { data: record, error: recordError } = await supabase
            .from('daily_records')
            .select('*, outlets(name, google_sheet_id)')
            .eq('id', id)
            .single();

        if (recordError || !record) {
            return NextResponse.json({ error: 'Daily record not found' }, { status: 404 });
        }

        // Get transactions for this record
        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('daily_record_id', id);

        // Get or create sheet
        let sheetId = record.outlets?.google_sheet_id;
        if (!sheetId) {
            const month = new Date(record.date).toISOString().slice(0, 7);
            sheetId = await sheetsService.createMonthlySheet(
                record.outlets?.name || 'Outlet',
                month
            );

            // Update outlet with sheet ID
            await supabase
                .from('outlets')
                .update({ google_sheet_id: sheetId })
                .eq('id', record.outlet_id);
        }

        // Sync to sheet
        await sheetsService.syncDailyRecord(sheetId, record.date, record);
        if (transactions && transactions.length > 0) {
            await sheetsService.syncTransactions(sheetId, transactions);
        }

        // Update sync status
        await supabase
            .from('daily_records')
            .update({
                synced_to_sheet: true,
                last_synced_at: new Date().toISOString(),
            })
            .eq('id', id);

        return NextResponse.json({ success: true, sheetId });
    } catch (error: any) {
        console.error('Error syncing to sheet:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
