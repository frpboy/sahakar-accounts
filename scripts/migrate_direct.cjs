const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    const password = process.env.SUPABASE_DB_PASSWORD;
    const projectRef = 'pvdqotuhuwzooysrmtrd'; // From URL
    const connectionString = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

    const sql = postgres(connectionString);

    const sqlFile = process.argv[2];
    if (!sqlFile) {
        console.error('Please provide a SQL file path.');
        process.exit(1);
    }

    const sqlPath = path.join(__dirname, '..', sqlFile);
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log(`Applying Migration: ${sqlFile}...`);

    try {
        await sql.unsafe(sqlContent);
        console.log('Migration applied successfully!');
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

migrate();
