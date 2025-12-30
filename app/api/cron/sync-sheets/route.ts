// STEP 4: Cron endpoint for automated Google Sheets sync
// Runs hourly to sync all locked, unsynced records

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'development-secret';

        if (authHeader !== `Bearer ${cronSecret}`) {
            console.error('Unauthorized cron request');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create service client (bypasses RLS)
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch locked, unsynced records (limit 50 per run)
        const { data: records, error: fetchError } = await supabase
            .from('daily_records')
            .select('*, outlets(*)')
            .eq('status', 'locked')
            .eq('synced_to_sheets', false)
            .is('sheet_sync_error', null) // Skip records with errors (manual intervention needed)
            .order('date', { ascending: true })
            .limit(50);

        if (fetchError) {
            console.error('Error fetching records:', fetchError);
            return NextResponse.json({
                error: 'Failed to fetch records',
                details: fetchError.message
            }, { status: 500 });
        }

        if (!records || records.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No records to sync',
                synced: 0,
                failed: 0
            });
        }

        // Calculate transaction stats for records
        const recordIds = records.map(r => r.id);
        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .in('daily_record_id', recordIds);

        if (txError) {
            console.error('Error fetching transactions:', txError);
            return NextResponse.json({
                error: 'Failed to fetch transactions',
                details: txError.message
            }, { status: 500 });
        }

        const txMap: Record<string, { cash_in: number; cash_out: number; upi_in: number; upi_out: number }> = {};
        
        transactions?.forEach((tx) => {
            if (!txMap[tx.daily_record_id]) {
                txMap[tx.daily_record_id] = { cash_in: 0, cash_out: 0, upi_in: 0, upi_out: 0 };
            }
            const stats = txMap[tx.daily_record_id];
            const amount = Number(tx.amount) || 0;
            
            if (tx.type === 'income') {
                if (tx.payment_mode === 'cash') stats.cash_in += amount;
                else if (tx.payment_mode === 'upi') stats.upi_in += amount;
            } else if (tx.type === 'expense') {
                if (tx.payment_mode === 'cash') stats.cash_out += amount;
                else if (tx.payment_mode === 'upi') stats.upi_out += amount;
            }
        });

        // Check if Google Sheets is configured
        const sheetsConfigured = !!(
            process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
            process.env.GOOGLE_SHEETS_PRIVATE_KEY
        );

        if (!sheetsConfigured) {
            console.warn('Google Sheets not configured, skipping sync');
            return NextResponse.json({
                success: false,
                error: 'Google Sheets not configured',
                synced: 0,
                failed: records.length
            }, { status: 503 });
        }

        // Initialize Google Sheets API
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const drive = google.drive({ version: 'v3', auth });

        let synced = 0;
        let failed = 0;

        // Process each record
        for (const record of records) {
            try {
                // Get or create monthly sheet for this outlet
                const date = new Date(record.date);
                const monthYear = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                const sheetName = `${record.outlets.name} - ${monthYear}`;

                const folderID = process.env.GOOGLE_DRIVE_FOLDER_ID;
                let spreadsheetId: string | undefined;

                // Try to find existing sheet
                if (folderID) {
                    const listResponse = await drive.files.list({
                        q: `name='${sheetName}' and '${folderID}' in parents and mimeType='application/vnd.google-apps.spreadsheet'`,
                        fields: 'files(id, name)',
                    });

                    if (listResponse.data.files && listResponse.data.files.length > 0) {
                        spreadsheetId = listResponse.data.files[0].id || undefined;
                    }
                }

                // Create new sheet if not found
                if (!spreadsheetId) {
                    const createResponse = await sheets.spreadsheets.create({
                        requestBody: {
                            properties: {
                                title: sheetName,
                            },
                            sheets: [{
                                properties: {
                                    title: monthYear,
                                    gridProperties: {
                                        frozenRowCount: 1,
                                    }
                                }
                            }]
                        },
                    });

                    spreadsheetId = createResponse.data.spreadsheetId || undefined;

                    // Move to folder
                    if (spreadsheetId && folderID) {
                        await drive.files.update({
                            fileId: spreadsheetId,
                            addParents: folderID,
                            fields: 'id, parents',
                        });
                    }

                    // Add headers
                    if (spreadsheetId) {
                        await sheets.spreadsheets.values.update({
                            spreadsheetId,
                            range: `${monthYear}!A1:J1`,
                            valueInputOption: 'RAW',
                            requestBody: {
                                values: [[
                                    'Date', 'Opening Cash', 'Opening UPI',
                                    'Income Cash', 'Income UPI',
                                    'Expense Cash', 'Expense UPI',
                                    'Closing Cash', 'Closing UPI', 'Status'
                                ]],
                            },
                        });
                    }
                }

                // Append record data
                if (spreadsheetId) {
                    const stats = txMap[record.id] || { cash_in: 0, cash_out: 0, upi_in: 0, upi_out: 0 };

                    const rowData = [
                        date.toLocaleDateString('en-IN'),
                        record.opening_cash || 0,
                        record.opening_upi || 0,
                        stats.cash_in,
                        stats.upi_in,
                        stats.cash_out,
                        stats.upi_out,
                        record.closing_cash || 0,
                        record.closing_upi || 0,
                        record.status,
                    ];

                    await sheets.spreadsheets.values.append({
                        spreadsheetId,
                        range: `${monthYear}!A2`,
                        valueInputOption: 'RAW',
                        requestBody: {
                            values: [rowData],
                        },
                    });

                    // Mark as synced
                    await supabase
                        .from('daily_records')
                        .update({
                            synced_to_sheets: true,
                            last_synced_at: new Date().toISOString(),
                            sheet_sync_error: null
                        })
                        .eq('id', record.id);

                    // Log success
                    await supabase.from('sheet_sync_log').insert({
                        daily_record_id: record.id,
                        spreadsheet_id: spreadsheetId,
                        spreadsheet_url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
                        sync_status: 'success',
                        sync_trigger: 'cron'
                    });

                    synced++;
                }

            } catch (error) {
                console.error(`Failed to sync record ${record.id}:`, error);
                failed++;

                // Log error
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                await supabase
                    .from('daily_records')
                    .update({ sheet_sync_error: errorMessage })
                    .eq('id', record.id);

                await supabase.from('sheet_sync_log').insert({
                    daily_record_id: record.id,
                    sync_status: 'failed',
                    error_message: errorMessage,
                    sync_trigger: 'cron'
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sync complete: ${synced} succeeded, ${failed} failed`,
            synced,
            failed,
            total: records.length
        });

    } catch (error) {
        console.error('Cron sync error:', error);
        return NextResponse.json({
            error: 'Sync failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

// Optional GET endpoint to check cron status
export async function GET() {
    return NextResponse.json({
        service: 'Google Sheets Cron Sync',
        status: 'active',
        schedule: 'Every hour'
    });
}
