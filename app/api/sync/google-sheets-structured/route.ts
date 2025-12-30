import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';
import { google } from 'googleapis';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function parseDriveFolderId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m?.[1] || null;
}

async function getOrCreateFolder(drive: any, name: string, parentId: string): Promise<string> {
  const list = await drive.files.list({
    q: `name='${name.replace(/'/g, "\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id,name)'
  });
  if (list.data.files?.length) return list.data.files[0].id as string;
  const created = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id'
  });
  return created.data.id as string;
}

async function getOrCreateSpreadsheet(drive: any, sheets: any, title: string, parentId: string): Promise<string> {
  const list = await drive.files.list({
    q: `name='${title.replace(/'/g, "\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: 'files(id,name)'
  });
  if (list.data.files?.length) return list.data.files[0].id as string;
  const created = await sheets.spreadsheets.create({
    requestBody: { properties: { title } }
  });
  const spreadsheetId = created.data.spreadsheetId as string;
  await drive.files.update({ fileId: spreadsheetId, addParents: parentId, fields: 'id,parents' });
  return spreadsheetId;
}

async function ensureDailyTab(sheets: any, spreadsheetId: string, tabTitle: string) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const hasTab = (meta.data.sheets || []).some((s: any) => s.properties?.title === tabTitle);
  if (!hasTab) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: tabTitle, gridProperties: { rowCount: 200, columnCount: 20 } } } }] }
    });
    // Optional: add headers in the new tab
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabTitle}!A1:C1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['Field', 'Value', 'Notes']] }
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (!['superadmin', 'master_admin', 'ho_accountant'].includes((user as any)?.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { data: records } = await supabase
      .from('daily_records')
      .select('*, outlets(id,name,code,location,drive_folder_url)')
      .eq('status', 'locked')
      .order('date', { ascending: false })
      .limit(200);

    const sheetsConfigured = !!(process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY);
    if (!sheetsConfigured) {
      return NextResponse.json({ error: 'Google Sheets not configured' }, { status: 503 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    const results: Array<{ record_id: string; spreadsheetId?: string; sheet?: string; status: string; detail?: string }> = [];

    for (const r of (records || [])) {
      const outlet = (r as any).outlets || {};
      const baseFolderId = parseDriveFolderId(outlet.drive_folder_url);
      if (!baseFolderId) {
        results.push({ record_id: (r as any).id, status: 'skipped', detail: 'No drive_folder_url' });
        continue;
      }
      const d = new Date((r as any).date);
      const yearStr = String(d.getFullYear());
      const monthName = d.toLocaleString('en-US', { month: 'long' }).toUpperCase();
      const dayTab = `${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getFullYear()).slice(2)}`;

      // Create Year and Month folders
      const yearFolder = await getOrCreateFolder(drive, yearStr, baseFolderId);
      const monthFolder = await getOrCreateFolder(drive, monthName, yearFolder);

      const spreadsheetTitle = `${monthName} ${yearStr} ${(outlet.location || outlet.code || '').toUpperCase()} SAHAKAR ${(outlet.name || '').toUpperCase()} ACCOUNTS REPORT`;
      const spreadsheetId = await getOrCreateSpreadsheet(drive, sheets, spreadsheetTitle, monthFolder);

      await ensureDailyTab(sheets, spreadsheetId, dayTab);

      // Write summary fields
      const summary = [
        ['Date', (r as any).date, 'DD/MM/YYYY'],
        ['Opening Cash', (r as any).opening_cash || 0, ''],
        ['Opening UPI', (r as any).opening_upi || 0, ''],
        ['Total Income', (r as any).total_income || 0, ''],
        ['Total Expense', (r as any).total_expense || 0, ''],
        ['Closing Cash', (r as any).closing_cash || 0, ''],
        ['Closing UPI', (r as any).closing_upi || 0, ''],
        ['Status', (r as any).status || '', ''],
      ];
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${dayTab}!A2:C9`,
        valueInputOption: 'RAW',
        requestBody: { values: summary }
      });

      // Fetch transactions for this daily record and populate SALE TABLE (E-I)
      const { data: txs } = await supabase
        .from('transactions')
        .select('id,type,payment_mode,amount,description')
        .eq('daily_record_id', (r as any).id)
        .order('created_at', { ascending: true })
        .limit(27);
      const saleRows: any[] = [];
      let no = 1;
      for (const t of (txs || [])) {
        if ((t as any).type !== 'income') continue; // only income in sales table
        const amt = Number((t as any).amount || 0);
        const pm = (t as any).payment_mode;
        const cash = pm === 'cash' ? amt : 0;
        const upi = pm === 'upi' ? amt : 0;
        const credit = 0; // not tracked in schema; leave as 0
        saleRows.push([no, amt, cash, upi, credit, (t as any).description || '']);
        no++;
        if (no > 27) break;
      }
      if (saleRows.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${dayTab}!E2:I${2 + saleRows.length - 1}`,
          valueInputOption: 'RAW',
          requestBody: { values: saleRows }
        });
      }

      results.push({ record_id: (r as any).id, spreadsheetId, sheet: dayTab, status: 'synced' });
    }

    return NextResponse.json({ success: true, count: results.length, results });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

