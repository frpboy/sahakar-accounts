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
import { createClientBrowser } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { cacheHelpers } from '@/lib/db';

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
    const supabase = createClientBrowser();
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

            // Always bypass cache for critical auth data to prevent stale outlet assignments
            // const cached = await cacheHelpers.getUser(authUser.id);
            // if (cached) { ... }

            const res = await fetch('/api/profile', {
                method: 'GET',
                cache: 'no-store', // Force fresh fetch
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (!res.ok) {
                // Graceful fallback when profile row is missing
                if (res.status === 404) {
                    const meta = (authUser as any).user_metadata || {};
                    const role = (meta.role || 'outlet_staff') as UserProfile['role'];
                    const name = (meta.full_name || meta.name || authUser.email || undefined) as string | undefined;
                    console.warn('[Auth] Profile not found in DB, using metadata fallback:', authUser.email, role);
                    return {
                        role,
                        name,
                        outlet_id: undefined,
                        access_start_date: undefined,
                        access_end_date: undefined,
                    };
                }
                const payload = (await res.json().catch(() => null)) as { error?: string } | null;
                throw new Error(payload?.error || `Failed to fetch profile (${res.status})`);
            }

            const data = (await res.json()) as {
                id: string;
                email: string;
                role: UserProfile['role'];
                name?: string | null;
                outlet_id?: string | null;
                access_start_date?: string | null;
                access_end_date?: string | null;
                auditor_access_granted_at?: string | null;
                auditor_access_expires_at?: string | null;
            };

            if (!data) {
                throw new Error(`Profile not found for user ${authUser.id}`);
            }

            await cacheHelpers.cacheUser({
                id: data.id,
                email: data.email,
                name: data.name || undefined,
                role: data.role,
                outlet_id: data.outlet_id || undefined,
                access_start_date: data.access_start_date || undefined,
                access_end_date: data.access_end_date || undefined,
                auditor_access_granted_at: data.auditor_access_granted_at || undefined,
                auditor_access_expires_at: data.auditor_access_expires_at || undefined,
            });

            console.log('[Auth] Profile fetched successfully:', data.email, data.role);

            return {
                role: data.role,
                name: data.name || undefined,
                outlet_id: data.outlet_id || undefined,
                access_start_date: data.access_start_date || undefined,
                access_end_date: data.access_end_date || undefined,
            };
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
    }, []);

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
                    try {
                        const profile = await fetchUserProfile(session.user);
                        if (isMounted) {
                            setUser({
                                id: session.user.id,
                                email: session.user.email || '',
                                profile,
                            });
                        }
                    } catch (e) {
                        // Final safety: construct metadata-based profile to avoid stale session state
                        const meta = (session.user as any).user_metadata || {};
                        const role = (meta.role || 'outlet_staff') as UserProfile['role'];
                        const name = (meta.full_name || meta.name || session.user.email || undefined) as string | undefined;
                        if (isMounted) {
                            setUser({
                                id: session.user.id,
                                email: session.user.email || '',
                                profile: { role, name },
                            });
                        }
                    }
                    // Use router.refresh() on sign-in related events to update Server Components
                    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                        router.refresh();
                        // Audit login
                        try {
                            await fetch('/api/audit/log', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: event === 'SIGNED_IN' ? 'login' : 'session_update', entity: 'auth' }),
                            });
                        } catch { }
                    }
                } else if (isMounted) {
                    setUser(null);
                    // Force refresh on sign out to clear server state
                    if (event === 'SIGNED_OUT') {
                        router.refresh();
                        // Audit logout
                        try {
                            await fetch('/api/audit/log', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'logout', entity: 'auth' }),
                            });
                        } catch { }
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
    const signIn = useCallback(async (email: string, password: string) => {
        if (DEV_MODE) {
            router.push('/dashboard');
            return;
        }

        console.log('[Auth] Signing in:', email);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('[Auth] Sign in error:', error.message);
            throw error;
        }

        // Check if staff has ended duty today
        if (data.user) {
            const { data: profileData } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profileData?.role === 'outlet_staff') {
                // Check login time window (7 AM - 12 AM only)
                // Strict lockout: 02:00 to 06:59
                const now = new Date();
                const hour = now.getHours(); // 0-23

                if (hour >= 2 && hour < 7) {
                    await supabase.auth.signOut();
                    router.push('/rest');
                    return; // Stop execution
                }

                const today = new Date().toISOString().split('T')[0];

                const { data: dutyLog } = await (supabase
                    .from('duty_logs' as any) as any)
                    .select('duty_end')
                    .eq('user_id', data.user.id)
                    .eq('date', today)
                    .single();

                if (dutyLog?.duty_end) {
                    // Staff has ended duty today - sign them out and block login
                    await supabase.auth.signOut();
                    throw new Error('Your duty has ended for today. Please login tomorrow after 7:00 AM.');
                }
            }
        }

        console.log('[Auth] Sign in successful');
        // Login page will handle redirect explicitly
        // No need for router.refresh() here
    }, [supabase, router]);

    // Sign out function
    const signOut = useCallback(async () => {
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
    }, [supabase, router]);

    // Auto-logout staff during prohibited hours (Midnight - 7 AM)
    useEffect(() => {
        if (!user || user.profile.role !== 'outlet_staff') return;

        const checkTime = async () => {
            const now = new Date();
            const hour = now.getHours();

            // Strict lockout: 02:00 to 06:59 blocked
            if (hour >= 2 && hour < 7) {
                console.warn('[Auth] Prohibited hours (02:00-07:00). Auto-signing out staff.');

                // Custom logout flow for Rest Mode
                setUser(null);
                await supabase.auth.signOut();
                router.push('/rest');
            }
        };

        // Check immediately on mount/user change
        checkTime();

        // Check every minute
        const interval = setInterval(checkTime, 60000);
        return () => clearInterval(interval);
    }, [user, supabase, router]);

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
