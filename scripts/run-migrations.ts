// Run SQL migrations via Supabase API
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filePath: string): Promise<void> {
    console.log(`\n📂 Reading: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`🔧 Executing SQL (${sql.length} characters)...`);

    // Execute via RPC or direct SQL execution
    // Note: Supabase doesn't have a direct SQL execution endpoint in JS client
    // We need to use the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Failed to execute ${filePath}:`, error);
        throw new Error(error);
    }

    console.log(`✅ Successfully executed: ${filePath}`);
}

async function main() {
    console.log('🚀 Starting database migrations...\n');
    console.log(`📍 Supabase URL: ${supabaseUrl}`);

    const migrations = [
        'database/add-time-bound-access.sql',
        'database/auditor-access-log.sql'
    ];

    for (const migration of migrations) {
        try {
            await executeSQLFile(migration);
        } catch (error) {
            console.error(`\n💥 Migration failed: ${migration}`);
            console.error(error);
            process.exit(1);
        }
    }

    console.log('\n✅ All migrations completed successfully!');

    // Verification
    console.log('\n🔍 Verifying migrations...');

    const { data: functions, error: funcError } = await supabase
        .rpc('is_access_valid', { user_id: '6a622bde-bde5-4eef-947b-19d4197c124d' });

    if (funcError) {
        console.error('⚠️  Function verification failed:', funcError.message);
    } else {
        console.log('✅ is_access_valid() function works!');
    }

    const { count, error: tableError } = await supabase
        .from('auditor_access_log')
        .select('*', { count: 'exact', head: true });

    if (tableError) {
        console.error('⚠️  Table verification failed:', tableError.message);
    } else {
        console.log(`✅ auditor_access_log table exists (${count} rows)`);
    }

    console.log('\n🎉 Migration verification complete!');
}

main().catch(console.error);
