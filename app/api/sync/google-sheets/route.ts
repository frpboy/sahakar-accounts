import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';
import { google } from 'googleapis';

// This endpoint will sync locked daily records to Google Sheets
export async function POST() {
    try {
    const supabase = createRouteClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user role to verify permissions
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (user?.role !== 'ho_accountant' && user?.role !== 'master_admin' && user?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Get locked daily records that need to be synced
        const { data: records, error: fetchError } = await supabase
            .from('daily_records')
            .select(`
                *,
                outlets ( name, code )
            `)
            .eq('status', 'locked')
            .order('date', { ascending: false })
            .limit(100);

        if (fetchError) {
            console.error('Error fetching records:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
        }

        // Check if Google Sheets credentials are configured
        const sheetsConfigured = !!(
            process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
            process.env.GOOGLE_SHEETS_PRIVATE_KEY
        );

        if (!sheetsConfigured) {
            return NextResponse.json({
                success: false,
                error: 'Google Sheets not configured',
                message: 'Please add GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY to environment variables',
                recordCount: records?.length || 0,
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

        // Get or create the spreadsheet
        const folderID = process.env.GOOGLE_DRIVE_FOLDER_ID;
        const spreadsheetName = 'Sahakar Accounts - Daily Records';

        let spreadsheetId: string | undefined;

        // Try to find existing sheet in folder
        if (folderID) {
            const listResponse = await drive.files.list({
                q: `name='${spreadsheetName}' and '${folderID}' in parents and mimeType='application/vnd.google-apps.spreadsheet'`,
                fields: 'files(id, name)',
            });

            if (listResponse.data.files && listResponse.data.files.length > 0) {
                spreadsheetId = listResponse.data.files[0].id || undefined;
            }
        }

        // Create new spreadsheet if not found
        if (!spreadsheetId) {
            const createResponse = await sheets.spreadsheets.create({
                requestBody: {
                    properties: {
                        title: spreadsheetName,
                    },
                    sheets: [{
                        properties: {
                            title: 'Daily Records',
                        }
                    }]
                },
            });

            spreadsheetId = createResponse.data.spreadsheetId || undefined;

            // Move to folder if specified
            if (spreadsheetId && folderID) {
                await drive.files.update({
                    fileId: spreadsheetId,
                    addParents: folderID,
                    fields: 'id, parents',
                });
            }

            // Add headers
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Daily Records!A1:J1',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[
                        'Date', 'Outlet Code', 'Outlet Name', 'Opening Cash', 'Opening UPI',
                        'Total Income', 'Total Expense', 'Closing Cash', 'Closing UPI', 'Status'
                    ]],
                },
            });
        }

        // Prepare data rows
        const rows = records?.map(record => [
            record.date,
            record.outlets?.code || 'N/A',
            record.outlets?.name || 'N/A',
            record.opening_cash || 0,
            record.opening_upi || 0,
            record.total_income || 0,
            record.total_expense || 0,
            record.closing_cash || 0,
            record.closing_upi || 0,
            record.status,
        ]) || [];

        // Append data to sheet
        if (rows.length > 0 && spreadsheetId) {
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Daily Records!A2',
                valueInputOption: 'RAW',
                requestBody: {
                    values: rows,
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: `Successfully synced ${records?.length || 0} records to Google Sheets`,
            recordCount: records?.length || 0,
            spreadsheetId,
            spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
            synced_at: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({
            error: 'Sync failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

// GET endpoint to check sync status
export async function GET() {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        // Get count of locked records
        const { count, error } = await supabase
            .from('daily_records')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'locked');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const sheetsConfigured = !!(
            process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
            process.env.GOOGLE_SHEETS_PRIVATE_KEY
        );

        return NextResponse.json({
            configured: sheetsConfigured,
            locked_records_count: count || 0,
            folder_id: process.env.GOOGLE_DRIVE_FOLDER_ID || null,
        });

    } catch (error) {
        console.error('Status check error:', error);
        return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
    }
}
