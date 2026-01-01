// cleanup-outlets.mjs
// Execute the outlet cleanup SQL using Supabase client with service role key

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

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
    console.log('⚡ Using SERVICE ROLE to bypass RLS...\n');

    // Split into individual statements
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i] + ';';
        if (stmt.trim() === ';') continue;

        const preview = stmt.substring(0, 80).replace(/\s+/g, ' ');
        process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

        try {
            const { error } = await supabase.rpc('exec', { sql: stmt });

            if (error) {
                console.error(`\n❌ Failed: ${error.message}`);
                throw error;
            }

            console.log('✓');
        } catch (err) {
            console.error(`\n❌ Error: ${err.message}`);
            throw err;
        }
    }

    console.log('\n✅ All statements executed successfully!');
    console.log('\n🎉 Outlet cleanup completed!');
    console.log('\n📋 Summary:');
    console.log('   - Removed all unwanted outlets');
    console.log('   - Kept only 4 outlets (Tirur, Makkaraparamba, Melattur, Karinkallathani)');
    console.log('   - Remapped manager and staff users to their correct outlets');
}

executeCleanup().catch(err => {
    console.error('\n❌ Cleanup failed:', err);
    process.exit(1);
});
