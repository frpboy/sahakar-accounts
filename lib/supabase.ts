import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});

// Server-side client with service role
export function createServerClient() {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
        console.error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
        console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }

    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}
