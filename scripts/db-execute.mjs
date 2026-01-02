import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL or POSTGRES_URL environment variable is missing.');
    console.error('   Please check your .env.local file.');
    process.exit(1);
}

// Connect to database
// connection.ssl required for Supabase usually
const sql = postgres(dbUrl, {
    ssl: { rejectUnauthorized: false }, // For Supabase transaction pooler/direct connection
    max: 1
});

async function run() {
    try {
        const sqlFilePath = 'database/fix-infinite-recursion.sql';
        console.log(`📖 Reading SQL file: ${sqlFilePath}...`);

        const fileContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('🚀 Executing SQL...');

        // Split by semicolon? No, postgres.js might handle multi-statement.
        // But postgres.js `sql.file` is best if we had it, or just pass the string.
        // Wait, for multiple statements we might need `sql.unsafe`.

        // We will use sql.unsafe() to run the raw SQL script
        const result = await sql.unsafe(fileContent);

        console.log('✅ SQL executed successfully.');
        console.log('   (Note: Output might be empty for DDL statements)');

        // Run verification query manually to show output
        console.log('\n🔍 Verifying policies...');
        const policies = await sql`
            SELECT schemaname, tablename, policyname, permissive, roles, cmd
            FROM pg_policies
            WHERE tablename = 'users'
        `;

        if (policies.length > 0) {
            console.table(policies);
        } else {
            console.log('⚠️ No policies found on users table (unexpected if script ran).');
        }

    } catch (e) {
        console.error('❌ Execution failed:', e);
    } finally {
        await sql.end();
    }
}

run();
