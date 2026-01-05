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
        console.log('🔍 Checking Outlets...');
        const outlets = await sql`SELECT id, name, outlet_type, location_code FROM outlets`;
        console.table(outlets);

        const targetID = 'HP-SAH-000001';
        console.log(`\n🔍 Checking for global existence of: ${targetID}`);

        const collision = await sql`SELECT id, outlet_id, internal_entry_id, created_at FROM transactions WHERE internal_entry_id = ${targetID}`;
        console.table(collision);

    } catch (e) {
        console.error('❌ Failed:', e);
    } finally {
        await sql.end();
    }
}

run();
