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
        console.log('🔍 Listing Top 20 internal_entry_id for Melattur...');

        // Melattur ID from previous valid run
        const outletId = '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51';

        const result = await sql`
            SELECT id, internal_entry_id, created_at 
            FROM transactions 
            WHERE outlet_id = ${outletId}
            ORDER BY created_at DESC
            LIMIT 20
        `;

        console.table(result);

        const [outlet] = await sql`SELECT outlet_type, location_code FROM outlets WHERE id = ${outletId}`;
        console.log('Outlet details:', outlet);

    } catch (e) {
        console.error('❌ Failed:', e);
    } finally {
        await sql.end();
    }
}

run();
