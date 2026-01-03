const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase
        .from('ledger_accounts')
        .select('name, code, type');

    if (error) {
        console.error(error);
        return;
    }

    console.table(data);
}

check();
