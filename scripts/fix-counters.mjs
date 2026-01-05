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
        console.log('🔍 Checking outlet counters...');

        // 1. Get all outlets
        const outlets = await sql`SELECT id, name FROM outlets`;

        for (const outlet of outlets) {
            console.log(`\nChecking Outlet: ${outlet.name} (${outlet.id})`);

            // 2. Find Max Transaction Sequence
            const txResult = await sql`
                SELECT internal_entry_id
                FROM transactions
                WHERE outlet_id = ${outlet.id}
                AND internal_entry_id LIKE '%-%-%'
            `;

            let maxTxSeq = 0;
            if (txResult.length > 0) {
                // Parse IDs manually to find max. Format: PRE-CODE-NUM
                // We assume format is %-%-NUM
                for (const row of txResult) {
                    const parts = row.internal_entry_id.split('-');
                    if (parts.length > 0) {
                        const lastPart = parts[parts.length - 1];
                        const seq = parseInt(lastPart, 10);
                        if (!isNaN(seq) && seq > maxTxSeq) {
                            maxTxSeq = seq;
                        }
                    }
                }
            }
            console.log(`   👉 Max Transaction Internal Seq found: ${maxTxSeq}`);

            // 3. Find Max Customer Sequence
            // (Assuming customers might have internal_customer_id)
            const custResult = await sql`
                SELECT internal_customer_id
                FROM customers
                WHERE outlet_id = ${outlet.id}
                AND internal_customer_id LIKE '%-%-C%'
            `;

            let maxCustSeq = 0;
            if (custResult.length > 0) {
                for (const row of custResult) {
                    const parts = row.internal_customer_id.split('-');
                    // Format: CODE-LOC-C00123
                    if (parts.length > 0) {
                        const lastPart = parts[parts.length - 1];
                        // remove 'C' prefix
                        const numStr = lastPart.replace('C', '');
                        const seq = parseInt(numStr, 10);
                        if (!isNaN(seq) && seq > maxCustSeq) {
                            maxCustSeq = seq;
                        }
                    }
                }
            }
            console.log(`   👉 Max Customer Internal Seq found: ${maxCustSeq}`);

            // 4. Check Current Counters
            const [currentCounter] = await sql`
                SELECT * FROM outlet_counters WHERE outlet_id = ${outlet.id}
            `;

            if (!currentCounter) {
                console.log('   ⚠️ No counter record found. Creating one...');
                // We set 'next' to max + 1
                await sql`
                    INSERT INTO outlet_counters (outlet_id, next_entry_seq, next_customer_seq)
                    VALUES (${outlet.id}, ${maxTxSeq + 1}, ${maxCustSeq + 1})
                `;
                console.log(`   ✅ Created counters: Entry=${maxTxSeq + 1}, Cust=${maxCustSeq + 1}`);
            } else {
                console.log(`   👉 Current Counters: Entry=${currentCounter.next_entry_seq}, Cust=${currentCounter.next_customer_seq}`);

                const safeNextEntry = maxTxSeq + 1;
                const safeNextCust = maxCustSeq + 1;

                let needsUpdate = false;
                let updateEntry = currentCounter.next_entry_seq;
                let updateCust = currentCounter.next_customer_seq;

                if (currentCounter.next_entry_seq <= maxTxSeq) {
                    console.log(`   ❌ Entry counter LAG DETECTED! (Current: ${currentCounter.next_entry_seq} <= Max: ${maxTxSeq})`);
                    updateEntry = safeNextEntry;
                    needsUpdate = true;
                }

                if (currentCounter.next_customer_seq <= maxCustSeq) {
                    console.log(`   ❌ Customer counter LAG DETECTED! (Current: ${currentCounter.next_customer_seq} <= Max: ${maxCustSeq})`);
                    updateCust = safeNextCust;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    console.log(`   🛠 Fixing counters to: Entry=${updateEntry}, Cust=${updateCust}`);
                    await sql`
                        UPDATE outlet_counters
                        SET next_entry_seq = ${updateEntry},
                            next_customer_seq = ${updateCust}
                        WHERE outlet_id = ${outlet.id}
                    `;
                    console.log('   ✅ Counters synchronized.');
                } else {
                    console.log('   ✅ Counters are safe.');
                }
            }
        }

    } catch (e) {
        console.error('❌ Failed:', e);
    } finally {
        await sql.end();
    }
}

run();
