const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase
        .from('daily_records')
        .select('status');

    if (error) {
        console.error(error);
        return;
    }

    const counts = {};
    data.forEach(t => {
        counts[t.status] = (counts[t.status] || 0) + 1;
    });

    console.log('Daily Records Status Counts:');
    console.table(counts);
}

check();
