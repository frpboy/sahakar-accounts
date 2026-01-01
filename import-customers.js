import postgres from 'postgres';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Please set it in your .env.local file or run:');
    console.log('export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.pvdqotuhuwzooysrmtrd.supabase.co:5432/postgres"');
    process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function importCustomers() {
    console.log('📊 Starting customer data import...\n');

    const customers = [];

    // Read and parse CSV
    const parser = createReadStream('customers_rows.csv').pipe(
        parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
        })
    );

    for await (const record of parser) {
        customers.push({
            outlet_id: record.outlet_id,
            name: record.name,
            phone: record.phone || null,
            email: record.email || null,
            address: record.address || null,
            notes: record.notes || null,
            credit_limit: record.credit_limit ? parseInt(record.credit_limit) : 0,
            outstanding_balance: record.outstanding_balance ? parseInt(record.outstanding_balance) : 0,
            is_active: record.is_active === 'TRUE' || record.is_active === 'true',
            created_by: record.created_by || null,
            referred_by: record.referred_by || null,
            internal_customer_id: record.internal_customer_id || null,
            customer_code: record.customer_code || null,
        });
    }

    console.log(`✅ Parsed ${customers.length} customer records from CSV\n`);

    // Insert in batches of 100
    const batchSize = 100;
    let imported = 0;

    for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, i + batchSize);

        try {
            await sql`
        INSERT INTO customers ${sql(batch,
                'outlet_id',
                'name',
                'phone',
                'email',
                'address',
                'notes',
                'credit_limit',
                'outstanding_balance',
                'is_active',
                'created_by',
                'referred_by',
                'internal_customer_id',
                'customer_code'
            )}
      `;

            imported += batch.length;
            console.log(`✅ Imported batch ${Math.floor(i / batchSize) + 1} (${imported}/${customers.length} records)`);
        } catch (error) {
            console.error(`❌ Error importing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
            throw error;
        }
    }

    console.log(`\n🎉 Successfully imported ${imported} customers!`);

    // Verify import
    const count = await sql`SELECT COUNT(*) as count FROM customers`;
    console.log(`📊 Total customers in database: ${count[0].count}\n`);

    await sql.end();
}

importCustomers().catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
});
