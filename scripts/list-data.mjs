import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY // Attempting with Anon first, might need Admin if RLS blocks listing
);

// Better: If we have a service role key in env, use it.
const serviceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminClient = createClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey
);

async function listData() {
    console.log('--- Outlets ---');
    const { data: outlets, error: outletError } = await adminClient
        .from('outlets')
        .select('id, name, location');
    if (outletError) console.error(outletError);
    else console.table(outlets);

    console.log('\n--- Profiles (Users) ---');
    const { data: profiles, error: profileError } = await adminClient
        .from('profiles')
        .select('id, email, first_name, last_name, role, outlet_id');
    if (profileError) console.error(profileError);
    else console.table(profiles);
}

listData();
