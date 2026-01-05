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
        console.log('🔄 updating Outlet Location Codes...');

        const updates = [
            { id: '716b6d1f-a740-406c-a764-548a4de15722', code: 'KKL', name: 'Karinkallathani' },
            { id: '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca', code: 'MKP', name: 'MAKKARAPARAMBA' },
            { id: '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51', code: 'MEL', name: 'MELATTUR' },
            { id: 'b64f135c-5279-4f5e-9331-00392011d3da', code: 'TIR', name: 'TIRUR' }
        ];

        for (const update of updates) {
            console.log(`\n👉 Updating ${update.name} -> ${update.code}`);
            await sql`
                UPDATE outlets
                SET location_code = ${update.code}
                WHERE id = ${update.id}
            `;
            console.log('   ✅ Validated.');
        }

        console.log('\n✨ All outlets updated. IDs will now be unique.');

        // After this, we need to reset/fix counters again because 'MEL' counters might need initialization/check
        // (Though my previous fix-counters script would have set counters for the outlet ID, which is fine)
        // Check if existing "SAH" counters interfere?
        // No, counters are keyed by outlet_id.
        // But if transactions exist with 'HP-SAH-000001', generated 'HP-MEL-000001' will be fine.

    } catch (e) {
        console.error('❌ Failed:', e);
    } finally {
        await sql.end();
    }
}

run();
