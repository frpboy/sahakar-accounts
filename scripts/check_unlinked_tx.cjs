const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase
        .from('transactions')
        .select('category, type')
        .is('ledger_account_id', null);

    if (error) {
        console.error(error);
        return;
    }

    const counts = {};
    data.forEach(t => {
        const key = `${t.type}:${t.category}`;
        counts[key] = (counts[key] || 0) + 1;
    });

    console.log('Unlinked Transactions by Category:');
    console.table(counts);
}

check();
