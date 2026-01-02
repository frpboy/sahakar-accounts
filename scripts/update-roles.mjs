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

    const updates = [
        { email: 'paymentstarlexpmna@gmail.com', role: 'ho_accountant' },
        { email: 'frpboy12@gmail.com', role: 'master_admin' },
        { email: 'auditor.test@sahakar.com', role: 'auditor' }
    ];

    async function runUpdate() {
        console.log('🔄 Starting Role Updates...');

        for (const update of updates) {
            console.log(`\n🔍 Looking for ${update.email}...`);

            // Find user
            const { data: user, error: findError } = await supabase
                .from('users')
                .select('id, email, role')
                .eq('email', update.email)
                .maybeSingle();

            if (findError) {
                console.error(`❌ Error finding user: ${findError.message}`);
                continue;
            }

            if (!user) {
                console.warn(`⚠️ User not found: ${update.email}`);
                continue;
            }

            console.log(`   Found User: ${user.email} (Current Role: ${user.role})`);

            if (user.role === update.role) {
                console.log('   ✅ Role already set.');
                continue;
            }

            // Update role
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: update.role })
                .eq('id', user.id);

            if (updateError) {
                console.error(`   ❌ Failed to update role: ${updateError.message}`);
            } else {
                console.log(`   ✅ Updated Role to: ${update.role}`);
            }
        }
    }

    runUpdate();

} catch (e) {
    console.error(e);
}
