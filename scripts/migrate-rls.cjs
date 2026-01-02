const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to manage RLS
    );

    const sqlPath = path.join(__dirname, '../supabase/migrations/20260103_ledger_rls_security.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying RLS Security Migration...');

    // Split into individual statements since basic /rest/v1/rpc/exec might not handle blocks?
    // Actually, we should use a single RPC if possible, or just run via CLI if available.
    // For now, let's try calling Postgres via RPC if the user has an 'exec_sql' function.
    // If not, we'll assume the user has the dashboard open and can run it.

    // BUT! Since I am an agent, I should try to run it. 
    // I'll try calling an RPC if it exists, otherwise I'll output instructions.

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('Migration failed (Standard RPC not found?):', error.message);
        console.log('\n--- PLEASE RUN THIS SQL IN SUPABASE DASHBOARD ---\n');
        console.log(sql);
        console.log('\n-------------------------------------------------\n');
    } else {
        console.log('RLS Migration applied successfully!');
    }
}

migrate();
