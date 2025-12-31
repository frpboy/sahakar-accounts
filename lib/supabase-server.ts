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
            async get(name: string) {
                const store = await cookies();
                return store.get(name)?.value;
            },
            async set(name: string, value: string, options?: any) {
                const store = await cookies();
                store.set(name, value, options);
            },
            async remove(name: string, _options?: any) {
                const store = await cookies();
                store.delete(name);
            },
        },
    });
}

export function createRouteClient() {
    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
            async get(name: string) {
                const store = await cookies();
                return store.get(name)?.value;
            },
            async set(name: string, value: string, options?: any) {
                const store = await cookies();
                store.set(name, value, options);
            },
            async remove(name: string, _options?: any) {
                const store = await cookies();
                store.delete(name);
            },
        },
    });
}

export function createMiddlewareClient(req: NextRequest, res: NextResponse) {
    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                const cookie: any = req.cookies.get(name) as any;
                return (typeof cookie === 'string' ? cookie : cookie?.value) as string | undefined;
            },
            set(name: string, value: string, options?: any) {
                res.cookies.set(name, value, options);
            },
            remove(name: string, _options?: any) {
                res.cookies.delete(name);
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
