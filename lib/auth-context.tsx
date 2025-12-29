'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
} from 'react';
import { User } from '@supabase/supabase-js';
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
    const supabase = createClientComponentClient();
    const router = useRouter();

    const devUser: AuthUser = {
        id: 'dev-staff',
        email: 'staff@test.local',
        profile: {
            role: 'outlet_staff',
            name: 'Dev Staff',
        },
    };

    const [user, setUser] = useState<AuthUser | null>(DEV_MODE ? devUser : null);
    const [loading, setLoading] = useState<boolean>(!DEV_MODE);

    // Fetch user profile from database with retry logic
    const fetchUserProfile = useCallback(async (authUser: User, retryCount = 0): Promise<UserProfile> => {
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
                if (retryCount < maxRetries && (error.message.includes('timeout') || error.message.includes('network'))) {
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
                role: (data as { role: UserProfile['role'] }).role,
                name: (data as { name?: string | null; full_name?: string | null }).name || (data as { full_name?: string | null }).full_name || undefined,
                outlet_id: (data as { outlet_id?: string | null }).outlet_id || undefined,
                access_start_date: (data as { access_start_date?: string | null }).access_start_date || undefined,
                access_end_date: (data as { access_end_date?: string | null }).access_end_date || undefined,
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
    }, [supabase]);

    // Load user on mount
    useEffect(() => {
        if (DEV_MODE) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        const loadUser = async () => {
            try {
                console.log('[Auth] Starting session check...');
                // Get session from cookie-aware client
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user && isMounted) {
                    console.log('[Auth] Session found, fetching profile...');
                    const profile = await fetchUserProfile(session.user);

                    if (isMounted) {
                        setUser({
                            id: session.user.id,
                            email: session.user.email || '',
                            profile,
                        });
                        console.log('[Auth] User loaded successfully');
                    }
                } else {
                    console.log('[Auth] No session found');
                }
            } catch (err) {
                console.error('[Auth] Error loading user:', err);
                // Don't set user on error, let it remain null
            } finally {
                if (isMounted) {
                    console.log('[Auth] Initial load complete, setting loading=false');
                    setLoading(false);
                }
            }
        };

        // EMERGENCY FALLBACK: Force loading to false after 30 seconds if everything hangs
        const emergencyTimeoutId = setTimeout(() => {
            if (isMounted) {
                setLoading((prev) => {
                    if (prev) {
                        console.error('[Auth] EMERGENCY: Session check/Profile fetch timed out after 30s. Unblocking UI.');
                        return false;
                    }
                    return prev;
                });
            }
        }, 30000);

        loadUser().finally(() => {
            clearTimeout(emergencyTimeoutId);
        });

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[Auth] State changed:', event);

                if (session?.user && isMounted) {
                    const profile = await fetchUserProfile(session.user);
                    if (isMounted) {
                        setUser({
                            id: session.user.id,
                            email: session.user.email || '',
                            profile,
                        });
                    }
                    // Use router.refresh() on sign-in related events to update Server Components
                    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                        router.refresh();
                    }
                } else if (isMounted) {
                    setUser(null);
                    // Force refresh on sign out to clear server state
                    if (event === 'SIGNED_OUT') {
                        router.refresh();
                    }
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [supabase, router, fetchUserProfile]);

    // Sign in function
    const signIn = async (email: string, password: string) => {
        if (DEV_MODE) {
            router.push('/dashboard');
            return;
        }

        console.log('[Auth] Signing in:', email);

        const { error } = await supabase.auth.signInWithPassword({
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
        if (DEV_MODE) {
            setUser(null);
            router.push('/login');
            return;
        }

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

    const value: AuthContextType = { user, loading, signIn, signOut };

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
