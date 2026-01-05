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
    console.error('❌ Error: DATABASE_URL is missing.');
    process.exit(1);
}

const sql = postgres(dbUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1
});

async function run() {
    try {
        console.log('🔍 Fetching definition of generate_internal_id()...');

        const [func] = await sql`
            SELECT pg_get_functiondef(oid) as definition
            FROM pg_proc
            WHERE proname = 'generate_internal_id'
        `;

        if (func) {
            console.log('\n--- Function Definition ---\n');
            console.log(func.definition);
            console.log('\n---------------------------\n');
        } else {
            console.log('❌ Function not found.');
        }

    } catch (e) {
        console.error('❌ Failed:', e);
    } finally {
        await sql.end();
    }
}

run();
