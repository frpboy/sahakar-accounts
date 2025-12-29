const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_COUNT = 140;

async function bulkOnboard() {
    try {
        // 1. Count existing outlets
        const { count: currentCount } = await supabase
            .from('outlets')
            .select('id', { count: 'exact', head: true });

        console.log(`Current outlet count: ${currentCount}`);

        if (currentCount >= TARGET_COUNT) {
            console.log('Target count already reached or exceeded.');
            return;
        }

        const needed = TARGET_COUNT - currentCount;
        console.log(`Onboarding ${needed} more outlets...`);

        const newOutlets = [];
        for (let i = 1; i <= needed; i++) {
            const outletNum = currentCount + i;
            const type = Math.random() > 0.5 ? 'hyper_pharmacy' : 'smart_clinic';
            const typePrefix = type === 'hyper_pharmacy' ? 'HP' : 'SC';
            const code = `${typePrefix}-GEN-${outletNum.toString().padStart(3, '0')}`;

            newOutlets.push({
                name: `Sahakar ${type === 'hyper_pharmacy' ? 'Hyper Pharmacy' : 'Smart Clinic'} - Outlet ${outletNum}`,
                code: code,
                location: 'Generated Location',
                is_active: true,
                type: type
            });
        }

        // Insert in batches of 50
        for (let i = 0; i < newOutlets.length; i += 50) {
            const batch = newOutlets.slice(i, i + 50);
            const { error } = await supabase.from('outlets').insert(batch);
            if (error) {
                console.error(`Error inserting batch starting at ${i}:`, error.message);
            } else {
                console.log(`Inserted batch ${Math.floor(i / 50) + 1}`);
            }
        }

        console.log('✅ Bulk onboarding complete!');

    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

bulkOnboard();
