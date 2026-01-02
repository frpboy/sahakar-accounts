const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const projectRef = 'pvdqotuhuwzooysrmtrd';
    const sql = postgres(`postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`);
    try {
        const res = await sql`SELECT * FROM public.transactions LIMIT 0`;
        console.log('Columns in transactions:', res.columns.map(c => c.name));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
