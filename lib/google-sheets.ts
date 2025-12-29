import { google } from 'googleapis';

type DailyRecordSyncData = {
    opening_cash?: number | null;
    opening_upi?: number | null;
    total_income?: number | null;
    total_expense?: number | null;
    closing_cash?: number | null;
    closing_upi?: number | null;
    status?: string | null;
};

type TransactionSyncData = {
    created_at: string;
    type: string;
    category: string;
    payment_mode: string;
    amount: number;
    description?: string | null;
};

export class GoogleSheetsService {
    private sheets;
    private drive;

    constructor() {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL!,
                private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.file',
            ],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
        this.drive = google.drive({ version: 'v3', auth });
    }

    async createMonthlySheet(outletName: string, month: string) {
        try {
            const title = `${outletName} - ${month}`;

            const response = await this.sheets.spreadsheets.create({
                requestBody: {
                    properties: { title },
                    sheets: [
                        {
                            properties: { title: 'Daily Records' },
                        },
                        {
                            properties: { title: 'Summary' },
                        },
                        {
                            properties: { title: 'Transactions' },
                        },
                    ],
                },
            });

            const spreadsheetId = response.data.spreadsheetId!;

            // Move to folder
            if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
                await this.drive.files.update({
                    fileId: spreadsheetId,
                    addParents: process.env.GOOGLE_DRIVE_FOLDER_ID,
                    fields: 'id, parents',
                });
            }

            return spreadsheetId;
        } catch (error) {
            console.error('Error creating sheet:', error);
            throw error;
        }
    }

    async syncDailyRecord(spreadsheetId: string, date: string, data: DailyRecordSyncData) {
        try {
            const values = [
                [
                    date,
                    data.opening_cash || 0,
                    data.opening_upi || 0,
                    data.total_income || 0,
                    data.total_expense || 0,
                    data.closing_cash || 0,
                    data.closing_upi || 0,
                    data.status || '',
                ],
            ];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Daily Records!A:H',
                valueInputOption: 'RAW',
                requestBody: { values },
            });

            return true;
        } catch (error) {
            console.error('Error syncing daily record:', error);
            throw error;
        }
    }

    async syncTransactions(spreadsheetId: string, transactions: TransactionSyncData[]) {
        try {
            const values = transactions.map((t) => [
                new Date(t.created_at).toLocaleString('en-IN'),
                t.type,
                t.category,
                t.payment_mode,
                t.amount,
                t.description || '',
            ]);

            await this.sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Transactions!A:F',
                valueInputOption: 'RAW',
                requestBody: { values },
            });

            return true;
        } catch (error) {
            console.error('Error syncing transactions:', error);
            throw error;
        }
    }
}

export const sheetsService = new GoogleSheetsService();
