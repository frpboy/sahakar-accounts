#!/usr/bin/env tsx
/**
 * Import Demo Data from Excel Files
 * Reads Excel files from ACCOUNTS Demo Data folder and imports to Supabase
 * 
 * Usage: npx tsx scripts/import-demo-data.ts
 */

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Starting demo data import...\n');

// Helper: Get or create outlet
async function getOrCreateOutlet(name: string, code: string): Promise<string> {
    const { data: existing } = await supabase
        .from('outlets')
        .select('id')
        .eq('code', code)
        .single();

    if (existing) {
        console.log(`  ✓ Outlet ${code} already exists`);
        return existing.id;
    }

    const { data, error } = await supabase
        .from('outlets')
        .insert({
            name,
            code,
            location: `${name} Location`,
        })
        .select('id')
        .single();

    if (error) {
        console.error(`  ❌ Failed to create outlet ${code}:`, error.message);
        throw error;
    }

    console.log(`  ✓ Created outlet: ${name} (${code})`);
    return data!.id;
}

// Parse Excel file
function parseExcelFile(filePath: string): any[] {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        return data;
    } catch (error) {
        console.error(`  ❌ Error reading file:`, error);
        return [];
    }
}

// Import daily records from Excel
async function importDailyRecords(outletId: string, records: any[]) {
    console.log(`  📥 Importing ${records.length} daily records...`);

    for (const record of records) {
        try {
            // Parse the Excel row into daily_record format
            const dailyRecord = {
                outlet_id: outletId,
                date: new Date(record['Date'] || record['DATE']).toISOString().split('T')[0],
                opening_cash: parseFloat(record['Opening Cash'] || record['OPENING_CASH'] || 0),
                opening_upi: parseFloat(record['Opening UPI'] || record['OPENING_UPI'] || 0),
                closing_cash: parseFloat(record['Closing Cash'] || record['CLOSING_CASH'] || 0),
                closing_upi: parseFloat(record['Closing UPI'] || record['CLOSING_UPI'] || 0),
                total_income: parseFloat(record['Total Income'] || record['TOTAL_INCOME'] || 0),
                total_expense: parseFloat(record['Total Expense'] || record['TOTAL_EXPENSE'] || 0),
                status: 'locked', // Import as locked since it's historical data
            };

            // Check if record already exists
            const { data: existing } = await supabase
                .from('daily_records')
                .select('id')
                .eq('outlet_id', outletId)
                .eq('date', dailyRecord.date)
                .single();

            if (existing) {
                console.log(`    ⏭️  Skipping ${dailyRecord.date} (already exists)`);
                continue;
            }

            // Insert record
            const { error } = await supabase
                .from('daily_records')
                .insert(dailyRecord);

            if (error) {
                console.error(`    ❌ Error importing ${dailyRecord.date}:`, error.message);
            } else {
                console.log(`    ✓ Imported ${dailyRecord.date}`);
            }
        } catch (err) {
            console.error(`    ❌ Parse error:`, err);
        }
    }
}

// Main import function
async function importFromFolder(folderPath: string) {
    console.log(`📁 Scanning folder: ${folderPath}\n`);

    // Find all Excel files recursively
    function findExcelFiles(dir: string): string[] {
        const files: string[] = [];

        try {
            const items = fs.readdirSync(dir);

            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    files.push(...findExcelFiles(fullPath));
                } else if (item.endsWith('.xlsx') && !item.startsWith('~$')) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            console.error(`Error reading directory ${dir}:`, error);
        }

        return files;
    }

    const excelFiles = findExcelFiles(folderPath);
    console.log(`Found ${excelFiles.length} Excel files\n`);

    // Process each file
    for (const file of excelFiles) {
        console.log(`📊 Processing: ${path.basename(file)}`);

        // Extract outlet info from file path
        // Example: ACCOUNTS Demo Data/HYPER PHARMACY/TIRUR/2025/DECEMBER/...
        const pathParts = file.split(path.sep);

        let outletName = 'Unknown';
        let outletCode = 'UNKNOWN';

        if (pathParts.includes('HYPER PHARMACY')) {
            const locationIndex = pathParts.findIndex(p => ['TIRUR', 'MELATTUR', 'MAKKARAPARAMBA'].includes(p));
            if (locationIndex > 0) {
                outletName = `Sahakar Hyper Pharmacy - ${pathParts[locationIndex]}`;
                outletCode = `HP-${pathParts[locationIndex].substring(0, 3).toUpperCase()}`;
            }
        } else if (pathParts.includes('SMART CLINIC')) {
            const locationIndex = pathParts.findIndex(p => ['TIRUR', 'MELATTUR', 'MAKKARAPARAMBA'].includes(p));
            if (locationIndex > 0) {
                outletName = `Sahakar Smart Clinic - ${pathParts[locationIndex]}`;
                outletCode = `SC-${pathParts[locationIndex].substring(0, 3).toUpperCase()}`;
            }
        }

        try {
            // Get or create outlet
            const outletId = await getOrCreateOutlet(outletName, outletCode);

            // Parse Excel data
            const records = parseExcelFile(file);

            if (records.length > 0) {
                await importDailyRecords(outletId, records);
            } else {
                console.log(`  ⚠️  No data found in file`);
            }
        } catch (error) {
            console.error(`  ❌ Error processing file:`, error);
        }

        console.log('');
    }

    console.log('✅ Import complete!\n');
}

// Run the import
const demoDataPath = path.join(process.cwd(), 'ACCOUNTS Demo Data');

if (!fs.existsSync(demoDataPath)) {
    console.error('❌ ACCOUNTS Demo Data folder not found');
    console.error(`Expected path: ${demoDataPath}`);
    process.exit(1);
}

importFromFolder(demoDataPath)
    .then(() => {
        console.log('🎉 All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
