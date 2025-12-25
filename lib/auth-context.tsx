// @ts-nocheck
'use client';

import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import { User } from '@supabase/supabase-js';
// Replace explicit supabase import with client component client
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

/* ======================================================
   TYPES
====================================================== */

export type UserProfile = {
    role:
    | 'superadmin'
    | 'master_admin'
    | 'ho_accountant'
    | 'outlet_manager'
    | 'outlet_staff'
    | 'auditor';
    name?: string;
    outlet_id?: string;
    access_start_date?: string;
    access_end_date?: string;
};

export type AuthUser = {
    id: string;
    email: string;
    profile: UserProfile;
};

type AuthContextType = {
    user: AuthUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
};

/* ======================================================
   CONFIG
====================================================== */

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';

/* ======================================================
   CONTEXT
====================================================== */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ======================================================
   PROVIDER
====================================================== */

export function AuthProvider({ children }: { children: ReactNode }) {
    // initialize cookie-aware supabase client
    const supabase = createClientComponentClient();
    const router = useRouter();

    /* ======================================================
       🔧 DEV MODE — HARD EXIT (NO EFFECTS, NO STATE)
    ====================================================== */

    if (DEV_MODE) {
        // ... (Development mode logic typically unchanged, omitting for brevity in this focused fix if it was working, but keeping structure)
        const value = useMemo<AuthContextType>(() => ({
            user: {
                id: 'dev-staff',
                email: 'staff@test.local',
                profile: {
                    role: 'outlet_staff',
                    name: 'Dev Staff',
                },
            },
            loading: false,
            signIn: async (email: string, password: string) => {
                console.log('[DEV_MODE] Mock signIn called for:', email);
                router.push('/dashboard');
            },
            signOut: async () => {
                console.log('[DEV_MODE] Mock signOut called');
                router.push('/login');
            },
        }), [router]);

        return (
            <AuthContext.Provider value={value}>
                {children}
            </AuthContext.Provider>
        );
    }

    /* ======================================================
       🔐 PRODUCTION MODE (REAL SUPABASE AUTH)
    ====================================================== */

    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Fetch user profile from database with retry logic
    const fetchUserProfile = async (authUser: User, retryCount = 0): Promise<UserProfile> => {
        const maxRetries = 3;
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s

        try {
            console.log(`[Auth] Fetching profile for user ${authUser.id} (attempt ${retryCount + 1}/${maxRetries + 1})`);

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (error) {
                console.error('[Auth] Error fetching profile:', error);

                // Retry on network errors or timeouts
                if (retryCount < maxRetries && (error.message?.includes('timeout') || error.message?.includes('network'))) {
                    console.warn(`[Auth] Retrying profile fetch in ${retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    return fetchUserProfile(authUser, retryCount + 1);
                }

                // If no data after retries, throw error instead of returning default
                throw new Error(`Profile not found for user ${authUser.id}`);
            }

            if (!data) {
                throw new Error(`Profile not found for user ${authUser.id}`);
            }

            console.log('[Auth] Profile fetched successfully:', data.email, data.role);

            return {
                role: data.role,
                name: data.name || data.full_name,
                outlet_id: data.outlet_id,
                access_start_date: data.access_start_date,
                access_end_date: data.access_end_date,
            } as UserProfile;
        } catch (err) {
            console.error('[Auth] Exception fetching profile:', err);

            // Retry on exceptions
            if (retryCount < maxRetries) {
                console.warn(`[Auth] Retrying profile fetch in ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return fetchUserProfile(authUser, retryCount + 1);
            }

            // After all retries failed, throw the error
            throw err;
        }
    };

    // Load user on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                // Get session from cookie-aware client
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    const profile = await fetchUserProfile(session.user);
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        profile,
                    });
                }
            } catch (err) {
                console.error('[Auth] Error loading user:', err);
            } finally {
                console.log('[Auth] Initial load complete, setting loading=false');
                setLoading(false);
            }
        };

        // SAFETY FALLBACK: Force loading to false after 10 seconds if it hangs
        const timeoutId = setTimeout(() => {
            setLoading((prev) => {
                if (prev) {
                    console.warn('[Auth] Session check timed out after 10s, forcing loading=false');
                    return false;
                }
                return prev;
            });
        }, 10000); // Increased from 4000ms to 10000ms

        loadUser();

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[Auth] State changed:', event);

                // Clear timeout if state changes (meaning auth is alive)
                clearTimeout(timeoutId);

                if (session?.user) {
                    const profile = await fetchUserProfile(session.user);
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        profile,
                    });
                    // Use router.refresh() on sign-in related events to update Server Components
                    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                        router.refresh();
                    }
                } else {
                    setUser(null);
                    // Force refresh on sign out to clear server state
                    if (event === 'SIGNED_OUT') {
                        router.refresh();
                    }
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    // Sign in function
    const signIn = async (email: string, password: string) => {
        console.log('[Auth] Signing in:', email);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('[Auth] Sign in error:', error.message);
            throw error;
        }

        console.log('[Auth] Sign in successful');
        // Login page will handle redirect explicitly
        // No need for router.refresh() here
    };

    // Sign out function
    const signOut = async () => {
        try {
            console.log('[Auth] Signing out...');

            // Clear user state immediately for instant feedback
            setUser(null);

            // Sign out from Supabase
            await supabase.auth.signOut();

            console.log('[Auth] Sign out successful');

            // Redirect to login
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('[Auth] Error signing out:', error);

            // Even if signOut fails, clear local state and redirect
            setUser(null);
            router.push('/login');
            router.refresh();
        }
    };

    const value = useMemo<AuthContextType>(
        () => ({
            user,
            loading,
            signIn,
            signOut,
        }),
        [user, loading]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/* ======================================================
   HOOK
====================================================== */

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
}
