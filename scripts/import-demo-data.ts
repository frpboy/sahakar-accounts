import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Base directory containing demo data
const DEMO_DATA_DIR = './ACCOUNTS Demo Data';

// Mapping of outlet types to folder names
const OUTLET_TYPES = {
    'HYPER PHARMACY': 'hyper_pharmacy',
    'SMART CLINIC': 'smart_clinic'
} as const;

// Cell mapping for daily sheet data (based on the Excel template)
// Data starts around Row 2-3
// Column B has labels, Column C has the actual values
const CELL_MAP = {
    DATE: 'C2',  // Date is in C2
    OUTLET_NAME: 'B3',
    OPENING_CASH: 'C5',
    OPENING_UPI: 'C6',
    OPENING_CREDIT: 'C7',
    CASH_FROM_HO: 'C8',
    TOTAL_SALE: 'C9',
    CASH_SALE: 'C10',
    UPI_SALE: 'C11',
    CREDIT_SALE: 'C12',
    CASH_FROM_CREDIT: 'C13',
    UPI_FROM_CREDIT: 'C14',
    SALES_RETURN: 'C15',
    TOTAL_EXPENSES: 'C16',
    CASH_EXPENSES: 'C17',
    UPI_EXPENSES: 'C18',
    CREDIT_EXPENSES: 'C19',
    CLOSING_CREDIT: 'C20',
    CLOSING_UPI: 'C21',
    CLOSING_CASH: 'C22',
    PHYSICAL_CASH: 'C23',
    DIFFERENCE: 'C24',
};

// Helper to parse Excel date serial number
function parseExcelDate(serial: any): string | null {
    if (!serial) return null;

    try {
        if (typeof serial === 'number') {
            const date = XLSX.SSF.parse_date_code(serial);
            if (!date) return null;
            const jsDate = new Date(date.y, date.m - 1, date.d);
            if (isNaN(jsDate.getTime())) return null;
            return jsDate.toISOString().split('T')[0];
        }

        if (serial instanceof Date) {
            if (isNaN(serial.getTime())) return null;
            return serial.toISOString().split('T')[0];
        }

        if (typeof serial === 'string') {
            const parsed = new Date(serial);
            if (isNaN(parsed.getTime())) return null;
            return parsed.toISOString().split('T')[0];
        }

        return null;
    } catch (error) {
        return null;
    }
}

// Helper to safely parse number from cell
function parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
}

// Get or create outlet
async function getOrCreateOutlet(
    name: string,
    code: string,
    location: string,
    type: 'hyper_pharmacy' | 'smart_clinic'
): Promise<string | null> {
    try {
        // Check if outlet exists
        const { data: existing, error: fetchError } = await supabase
            .from('outlets')
            .select('id')
            .eq('code', code)
            .single();

        if (existing) {
            console.log(`  ✓ Outlet ${code} already exists`);
            return existing.id;
        }

        // Create new outlet
        const { data: newOutlet, error: insertError } = await supabase
            .from('outlets')
            .insert({
                name,
                code,
                location,
                type,
                is_active: true
            })
            .select('id')
            .single();

        if (insertError) {
            console.error(`  ❌ Failed to create outlet ${code}:`, insertError.message);
            return null;
        }

        console.log(`  ✅ Created outlet ${code}`);
        return newOutlet.id;
    } catch (error) {
        console.error(`  ❌ Error with outlet ${code}:`, error);
        return null;
    }
}

// Parse a single daily sheet and import data
async function parseDailySheet(
    workbook: XLSX.WorkBook,
    sheetName: string,
    outletId: string
): Promise<boolean> {
    try {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return false;

        // Extract date from C2 (Row 1 is empty, data starts at Row 2)
        const dateSerial = sheet['C2']?.v;
        const date = parseExcelDate(dateSerial);

        if (!date) {
            console.log(`    ⏭️  Skipping sheet ${sheetName} - invalid date`);
            return false;
        }

        // Check if this date already exists for this outlet
        const { data: existing } = await supabase
            .from('daily_records')
            .select('id')
            .eq('outlet_id', outletId)
            .eq('date', date)
            .limit(1);

        if (existing && existing.length > 0) {
            console.log(`    ⏭️  ${date} already exists`);
            return false;
        }

        // Extract all values from the sheet (Column C)
        const openingCash = parseNumber(sheet['C4']?.v);
        const openingUPI = parseNumber(sheet['C5']?.v);
        const totalSale = parseNumber(sheet['C8']?.v);
        const cashSale = parseNumber(sheet['C9']?.v);
        const upiSale = parseNumber(sheet['C10']?.v);
        const creditSale = parseNumber(sheet['C11']?.v);
        const salesReturn = parseNumber(sheet['C14']?.v);
        const totalExpenses = parseNumber(sheet['C15']?.v);
        const closingCash = parseNumber(sheet['C21']?.v);
        const closingUPI = parseNumber(sheet['C20']?.v);

        // Create daily_records entries (one per transaction type)
        const records = [];

        // 1. Sales - Cash
        if (cashSale > 0) {
            records.push({
                outlet_id: outletId,
                date,
                particulars: 'Cash Sales',
                amount: cashSale,
                category: 'sales',
                payment_mode: 'cash',
                opening_cash: openingCash,
                opening_upi: openingUPI,
                total_income: totalSale,
                total_expense: totalExpenses,
                closing_cash: closingCash,
                closing_upi: closingUPI,
                status: 'locked'
            });
        }

        // 2. Sales - UPI
        if (upiSale > 0) {
            records.push({
                outlet_id: outletId,
                date,
                particulars: 'UPI Sales',
                amount: upiSale,
                category: 'sales',
                payment_mode: 'upi',
                opening_cash: openingCash,
                opening_upi: openingUPI,
                total_income: totalSale,
                total_expense: totalExpenses,
                closing_cash: closingCash,
                closing_upi: closingUPI,
                status: 'locked'
            });
        }

        // 3. Sales - Credit
        if (creditSale > 0) {
            records.push({
                outlet_id: outletId,
                date,
                particulars: 'Credit Sales',
                amount: creditSale,
                category: 'sales',
                payment_mode: 'credit',
                opening_cash: openingCash,
                opening_upi: openingUPI,
                total_income: totalSale,
                total_expense: totalExpenses,
                closing_cash: closingCash,
                closing_upi: closingUPI,
                status: 'locked'
            });
        }

        // 4. Sales Return
        if (salesReturn > 0) {
            records.push({
                outlet_id: outletId,
                date,
                particulars: 'Sales Return',
                amount: salesReturn,
                category: 'sales_return',
                payment_mode: 'cash',
                opening_cash: openingCash,
                opening_upi: openingUPI,
                total_income: totalSale,
                total_expense: totalExpenses,
                closing_cash: closingCash,
                closing_upi: closingUPI,
                status: 'locked'
            });
        }

        // 5. Expenses
        if (totalExpenses > 0) {
            records.push({
                outlet_id: outletId,
                date,
                particulars: 'Total Expenses',
                amount: totalExpenses,
                category: 'expenses',
                payment_mode: 'cash',
                opening_cash: openingCash,
                opening_upi: openingUPI,
                total_income: totalSale,
                total_expense: totalExpenses,
                closing_cash: closingCash,
                closing_upi: closingUPI,
                status: 'locked'
            });
        }

        // Insert all records
        if (records.length > 0) {
            const { error } = await supabase
                .from('daily_records')
                .insert(records);

            if (error) {
                console.error(`    ❌ Error importing ${date}:`, error.message);
                return false;
            }

            console.log(`    ✅ Imported ${date} (${records.length} records)`);
            return true;
        }

        return false;
    } catch (error) {
        console.error(`    ❌ Error parsing sheet ${sheetName}:`, error);
        return false;
    }
}

// Process a single Excel workbook
async function processWorkbook(filePath: string, outletId: string): Promise<void> {
    try {
        const workbook = XLSX.readFile(filePath);
        console.log(`  📊 Processing: ${path.basename(filePath)}`);
        console.log(`  📋 Found ${workbook.SheetNames.length} sheets`);

        let imported = 0;

        // Process each sheet (skip non-date sheets like TEMPLATE, Meta, Summary)
        for (const sheetName of workbook.SheetNames) {
            // Only process sheets that look like dates (6 digits: DDMMYY or similar)
            if (/^\d{6}$/.test(sheetName)) {
                const success = await parseDailySheet(workbook, sheetName, outletId);
                if (success) imported++;
            }
        }

        console.log(`  ✅ Imported ${imported} days from ${path.basename(filePath)}\n`);
    } catch (error) {
        console.error(`  ❌ Error processing workbook:`, error);
    }
}

// Recursively scan and process folders
async function scanAndImport(dir: string, outletType?: string, location?: string): Promise<void> {
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Determine context from folder name
            const folderName = item.toUpperCase();

            // Check if this is an outlet type folder
            if (folderName === 'HYPER PHARMACY' || folderName === 'SMART CLINIC') {
                console.log(`\n📁 Processing ${item}...`);
                await scanAndImport(fullPath, OUTLET_TYPES[folderName as keyof typeof OUTLET_TYPES]);
            }
            // Check if this is a location folder (within an outlet type)
            else if (outletType && !location && folderName !== 'OUTLETS.XLSX') {
                console.log(`\n  📍 Location: ${item}`);
                await scanAndImport(fullPath, outletType, item);
            }
            // Otherwise, recurse into subdirectories (year/month folders)
            else {
                await scanAndImport(fullPath, outletType, location);
            }
        } else if (item.endsWith('.xlsx') && !item.startsWith('~') && !item.includes('TEMPLATE') && !item.includes('OUTLETS')) {
            // Process Excel file
            if (outletType && location) {
                // Generate outlet code
                const typePrefix = outletType === 'hyper_pharmacy' ? 'HP' : 'SC';
                const locationCode = location.substring(0, 3).toUpperCase();
                const code = `${typePrefix}-${locationCode}`;

                // Get or create outlet
                const outletId = await getOrCreateOutlet(
                    `${location} ${outletType === 'hyper_pharmacy' ? 'Hyper Pharmacy' : 'Smart Clinic'}`,
                    code,
                    location,
                    outletType as 'hyper_pharmacy' | 'smart_clinic'
                );

                if (outletId) {
                    await processWorkbook(fullPath, outletId);
                }
            }
        }
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting Excel Import...\n');
    console.log(`📂 Scanning: ${DEMO_DATA_DIR}\n`);

    try {
        await scanAndImport(DEMO_DATA_DIR);
        console.log('\n✅ Import complete!');
    } catch (error) {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
    }
}

main();
