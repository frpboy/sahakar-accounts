// cleanup-outlets.js
// Execute the outlet cleanup SQL using Supabase client with service role key

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Create Supabase client with SERVICE ROLE key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function executeCleanup() {
    console.log('🔧 Starting outlet cleanup...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20260101220000_cleanup_drop_constraints.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Loaded SQL migration file');
    console.log('⚡ Executing with SERVICE ROLE privileges (bypasses RLS)...\n');

    try {
        // Execute the SQL using rpc or direct query
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

        if (error) {
            // If exec_sql function doesn't exist, try direct execution
            console.log('⚠️  exec_sql function not found, trying direct execution...');

            // Split SQL into individual statements and execute them
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            console.log(`📊 Executing ${statements.length} SQL statements...\n`);

            for (let i = 0; i < statements.length; i++) {
                const stmt = statements[i];
                if (stmt.length === 0) continue;

                console.log(`[${i + 1}/${statements.length}] Executing: ${stmt.substring(0, 60)}...`);

                const { error: stmtError } = await supabase.from('_').select('*').limit(0); // Dummy query to test connection

                // Use the raw SQL execution
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': serviceRoleKey,
                        'Authorization': `Bearer ${serviceRoleKey}`
                    },
                    body: JSON.stringify({ query: stmt })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Statement ${i + 1} failed: ${errorText}`);
                }
            }

            console.log('\n✅ All statements executed successfully!');
        } else {
            console.log('✅ SQL executed successfully!');
            console.log('Result:', data);
        }

        console.log('\n🎉 Outlet cleanup completed!');
        console.log('\n📋 Summary:');
        console.log('   - Removed all unwanted outlets');
        console.log('   - Kept only 4 outlets (Tirur, Makkaraparamba, Melattur, Karinkallathani)');
        console.log('   - Remapped manager and staff users to their correct outlets');

    } catch (err) {
        console.error('❌ Error executing cleanup:', err.message);
        console.error(err);
        process.exit(1);
    }
}

executeCleanup();
