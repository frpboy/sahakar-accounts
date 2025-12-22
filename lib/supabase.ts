import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Development mode flag - set to true to bypass Supabase
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: !DEV_MODE, // Don't auto-refresh in dev mode
    },
});

// Server-side client with session capability (Server Components)
export function createServerClient() {
    return createServerComponentClient<Database>({ cookies });
}

// Admin client with service role (Bypass RLS)
export function createAdminClient() {
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

// Mock user for development
export const MOCK_USERS = {
    staff: {
        id: '4e734021-0118-4147-8880-cdfab90d45e4',
        email: 'staff.test@sahakar.com',
        profile: {
            id: '4e734021-0118-4147-8880-cdfab90d45e4',
            email: 'staff.test@sahakar.com',
            name: 'Test Staff',
            role: 'outlet_staff' as const,
            outlet_id: '9e0c4614-53cf-40d3-abdd-a1d0183c3909',
            created_at: '2025-12-22T13:20:08.734131+00:00',
        }
    },
    manager: {
        id: '5e734021-0118-4147-8880-cdfab90d45e5',
        email: 'manager.test@sahakar.com',
        profile: {
            id: '5e734021-0118-4147-8880-cdfab90d45e5',
            email: 'manager.test@sahakar.com',
            name: 'Test Manager',
            role: 'outlet_manager' as const,
            outlet_id: '9e0c4614-53cf-40d3-abdd-a1d0183c3909',
            created_at: '2025-12-22T13:20:08.734131+00:00',
        }
    },
    admin: {
        id: '6e734021-0118-4147-8880-cdfab90d45e6',
        email: 'admin@sahakar.com',
        profile: {
            id: '6e734021-0118-4147-8880-cdfab90d45e6',
            email: 'admin@sahakar.com',
            name: 'Super Admin',
            role: 'superadmin' as const,
            outlet_id: null,
            created_at: '2025-12-22T13:20:08.734131+00:00',
        }
    }
};
