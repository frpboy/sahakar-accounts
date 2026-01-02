const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const projectRef = 'pvdqotuhuwzooysrmtrd';
const sql = postgres(`postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`);

async function run() {
    try {
        const rows = await sql`SELECT code, name, is_leaf FROM public.ledger_accounts`;
        console.log('Ledger Accounts:', JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
