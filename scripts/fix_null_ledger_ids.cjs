const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(`postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.vckpndicizqmjyivicue.supabase.co:5432/postgres`);

async function run() {
    try {
        const nulls = await sql`SELECT DISTINCT category FROM public.transactions WHERE ledger_account_id IS NULL`;
        console.log('Categories with NULL ledger_account_id:', nulls);

        // Map them to a general 'Miscellaneous' account if they don't hit our logic
        // Let's create a 'Miscellaneous' account if it doesn't exist
        const misc = await sql`SELECT id FROM public.ledger_accounts WHERE code = '4002' LIMIT 1`;
        if (misc.length > 0) {
            const res = await sql`UPDATE public.transactions SET ledger_account_id = ${misc[0].id} WHERE ledger_account_id IS NULL`;
            console.log('Backfilled NULLs with default account 4002:', res.count);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
