import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Derived from .env.local
const connectionString = 'postgresql://postgres:VqVzHScRLdNyCYlq@db.pvdqotuhuwzooysrmtrd.supabase.co:5432/postgres';

const sql = postgres(connectionString);

async function main() {
    try {
        const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260103_ledger_schema_update.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration: 20260103_ledger_schema_update.sql');
        await sql.unsafe(migrationSql);
        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sql.end();
    }
}

main();
