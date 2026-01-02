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

    async function runFix() {
        // 1. Get Outlet
        const { data: outlets } = await supabase.from('outlets').select('id, name');
        if (!outlets?.length) {
            console.log('No outlets found.');
            return;
        }
        const targetOutlet = outlets.find(o => o.name.toLowerCase().includes('makkaraparamba')) || outlets[0];
        console.log(`Target Outlet: ${targetOutlet.name} (${targetOutlet.id})`);

        // 2. Get Profiles from 'users' table
        console.log('Fetching users...');
        // Only select essential columns to minimize schema issues
        const { data: profiles, error } = await supabase
            .from('users')
            .select('id, email, outlet_id');

        if (error) {
            console.error('Fetch Error:', error);
            return;
        }

        console.log(`Total Users: ${profiles.length}`);

        const unassigned = profiles.filter(p => !p.outlet_id);
        console.log(`Unassigned Users: ${unassigned.length}`);

        // 3. Update
        for (const p of unassigned) {
            console.log(`Assigning ${p.email || p.id}...`);
            const { error: updateError } = await supabase
                .from('users')
                .update({ outlet_id: targetOutlet.id })
                .eq('id', p.id);

            if (updateError) console.error(`Failed: ${updateError.message}`);
            else console.log('Success.');
        }
    }

    runFix();

} catch (e) {
    console.error(e);
}
