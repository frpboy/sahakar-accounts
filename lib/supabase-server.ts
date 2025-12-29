import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from './database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Server-side client with session capability (Server Components)
export function createServerClient() {
    return createServerComponentClient<Database>({ cookies }) as unknown as SupabaseClient<
        Database,
        'public',
        'public',
        Database['public']
    >;
}

export function createRouteClient() {
    return createRouteHandlerClient<Database>({ cookies }) as unknown as SupabaseClient<
        Database,
        'public',
        'public',
        Database['public']
    >;
}

// Admin client with service role (Bypass RLS)
export function createAdminClient() {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
        console.error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }

    return createClient<Database, 'public'>(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}
