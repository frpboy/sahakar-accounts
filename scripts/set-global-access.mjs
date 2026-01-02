import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));

    const url = envConfig.NEXT_PUBLIC_SUPABASE_URL;
    const key = envConfig.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) { throw new Error('Missing env vars'); }

    const supabase = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const globalUsers = [
        'paymentstarlexpmna@gmail.com',
        'frpboy12@gmail.com',
        'auditor.test@sahakar.com'
    ];

    async function setGlobal() {
        console.log('🌍 Setting Global Access (Removing Outlet restrictions)...');

        for (const email of globalUsers) {
            console.log(`\n🔍 Update for ${email}...`);

            // Find user
            const { data: user } = await supabase
                .from('users')
                .select('id, outlet_id')
                .eq('email', email)
                .maybeSingle();

            if (!user) {
                console.warn(`⚠️ User not found: ${email}`);
                continue;
            }

            if (user.outlet_id === null) {
                console.log('   ✅ Already Global (outlet_id is NULL).');
                continue;
            }

            // Set outlet_id to NULL
            const { error: updateError } = await supabase
                .from('users')
                .update({ outlet_id: null })
                .eq('id', user.id);

            if (updateError) {
                console.error(`   ❌ Failed to set global: ${updateError.message}`);
            } else {
                console.log('   ✅ Removed Outlet restriction (Global Access enabled).');
            }
        }
    }

    setGlobal();

} catch (e) {
    console.error(e);
}
