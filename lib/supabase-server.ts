import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createServerSupabase() {
    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name) {
                const store = cookies();
                return store.get(name)?.value;
            },
            set(name, value, options) {
                const store = cookies();
                store.set(name, value, options);
            },
            remove(name, options) {
                const store = cookies();
                store.delete(name, options);
            },
        },
    });
}

export function createRouteClient() {
    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name) {
                const store = cookies();
                return store.get(name)?.value;
            },
            set(name, value, options) {
                const store = cookies();
                store.set(name, value, options);
            },
            remove(name, options) {
                const store = cookies();
                store.delete(name, options);
            },
        },
    });
}

export function createMiddlewareClient(req: NextRequest, res: NextResponse) {
    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name) {
                return req.cookies.get(name);
            },
            set(name, value, options) {
                res.cookies.set(name, value, options);
            },
            remove(name, options) {
                res.cookies.delete(name, options);
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
