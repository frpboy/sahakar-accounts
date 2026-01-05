import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const sql = postgres(dbUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1
});

const filesToRun = [
    'supabase/migrations/20260105_complete_schema.sql',
    'supabase/migrations/20260105_customer_dedup.sql'
];

async function run() {
    try {
        for (const file of filesToRun) {
            const filePath = path.resolve(process.cwd(), file);
            console.log(`\n📖 Reading SQL file: ${file}...`);

            if (!fs.existsSync(filePath)) {
                console.error(`❌ File not found: ${filePath}`);
                continue;
            }

            const fileContent = fs.readFileSync(filePath, 'utf8');
            console.log('🚀 Executing SQL...');

            await sql.unsafe(fileContent);

            console.log(`✅ ${file} executed successfully.`);
        }

    } catch (e) {
        console.error('❌ Execution failed:', e);
    } finally {
        await sql.end();
    }
}

run();
