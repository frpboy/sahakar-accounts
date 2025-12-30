import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createServerClient() {
    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name) {
                return cookies().get(name)?.value;
            },
            set(name, value, options) {
                cookies().set({ name, value, ...options });
            },
            remove(name, options) {
                cookies().delete({ name, ...options });
            },
        },
    });
}

export function createRouteClient() {
    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name) {
                return cookies().get(name)?.value;
            },
            set(name, value, options) {
                cookies().set({ name, value, ...options });
            },
            remove(name, options) {
                cookies().delete({ name, ...options });
            },
        },
    });
}

// Admin client with service role (Bypass RLS)
export function createAdminClient() {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
        console.error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }

    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}
