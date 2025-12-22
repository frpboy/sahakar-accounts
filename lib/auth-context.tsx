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
import { supabase } from '@/lib/supabase';

/* ======================================================
   TYPES
====================================================== */

export type UserProfile = {
    role:
    | 'superadmin'
    | 'master_admin'
    | 'ho_accountant'
    | 'outlet_manager'
    | 'outlet_staff';
    name?: string;
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
    /* ======================================================
       🔧 DEV MODE — HARD EXIT (NO EFFECTS, NO STATE)
    ====================================================== */

    if (DEV_MODE) {
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
            },
            signOut: async () => {
                console.log('[DEV_MODE] Mock signOut called');
            },
        }), []);

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

    // Fetch user profile from database
    const fetchUserProfile = async (authUser: User): Promise<UserProfile> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (error || !data) {
                console.error('[Auth] Error fetching profile:', error);
                // Return default profile
                return { role: 'outlet_staff' } as UserProfile;
            }

            return {
                role: data.role,
                name: data.name || data.full_name,
            } as UserProfile;
        } catch (err) {
            console.error('[Auth] Exception fetching profile:', err);
            return { role: 'outlet_staff' } as UserProfile;
        }
    };

    // Load user on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
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
                setLoading(false);
            }
        };

        loadUser();

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[Auth] State changed:', event);

                if (session?.user) {
                    const profile = await fetchUserProfile(session.user);
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        profile,
                    });
                } else {
                    setUser(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

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

        if (data.user) {
            const profile = await fetchUserProfile(data.user);
            setUser({
                id: data.user.id,
                email: data.user.email || '',
                profile,
            });
        }
    };

    // Sign out function
    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
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
