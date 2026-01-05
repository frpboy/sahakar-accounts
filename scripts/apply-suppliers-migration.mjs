import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from parent dir
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL or POSTGRES_URL environment variable is missing.');
    process.exit(1);
}

const sql = postgres(dbUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1
});

async function applyMigration() {
    try {
        const filePath = path.resolve(__dirname, '../supabase/migrations/20260105_create_suppliers.sql');
        console.log(`\n📖 Reading SQL file: ${filePath}...`);

        const fileContent = fs.readFileSync(filePath, 'utf8');
        console.log('🚀 Executing SQL...');

        await sql.unsafe(fileContent);

        console.log(`✅ Suppliers table created successfully.`);
    } catch (e) {
        console.error('❌ Migration failed:', e);
    } finally {
        await sql.end();
    }
}

applyMigration();
