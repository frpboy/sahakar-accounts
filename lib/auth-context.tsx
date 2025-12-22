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
import { supabase, MOCK_USERS } from '@/lib/supabase';
import type { AuthUser, AuthContextType, UserProfile } from '@/lib/types';

/* ======================================================
   CONFIG
===================================================== */

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

/* ======================================================
   CONTEXT
===================================================== */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ======================================================
   PROVIDER
===================================================== */

export function AuthProvider({ children }: { children: ReactNode }) {
    // ---------- DEV MODE QUICK PATH ----------
    if (DEV_MODE) {
        // Mock user is created once, no effects, no state changes after mount
        const devValue = useMemo<AuthContextType>(
            () => ({
                user: MOCK_USERS.staff,
                loading: false,
                signIn: async () => { },
                signOut: async () => { },
                refreshProfile: async () => { },
            }),
            []
        );
        return <AuthContext.Provider value={devValue}>{children}</AuthContext.Provider>;
    }

    // ---------- PRODUCTION LOGIC ----------
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fallbackProfile: UserProfile = { role: 'staff' } as UserProfile;

    const fetchUserProfile = async (authUser: User): Promise<UserProfile> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (error) {
                console.error('Error fetching user profile:', error);
                return fallbackProfile;
            }
            return (data as UserProfile) ?? fallbackProfile;
        } catch (err) {
            console.error('Error fetching user profile:', err);
            return fallbackProfile;
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            try {
                console.log('[AuthContext] Loading user from Supabase...');
                const { data: { session } } = await supabase.auth.getSession();
                const authUser = session?.user;
                if (authUser) {
                    const profile = await fetchUserProfile(authUser);
                    setUser({ id: authUser.id, email: authUser.email || '', profile });
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error('[AuthContext] Error loading user:', err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        loadUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[AuthContext] Auth state changed:', event);
                if (session?.user) {
                    const profile = await fetchUserProfile(session.user);
                    setUser({ id: session.user.id, email: session.user.email || '', profile });
                } else {
                    setUser(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []); // run once on mount

    const signIn = async (email: string, password: string) => {
        // Production sign‑in only – DEV_MODE is handled above
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
            const profile = await fetchUserProfile(data.user);
            setUser({ id: data.user.id, email: data.user.email || '', profile });
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const refreshProfile = async () => {
        if (!user) return;
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            const profile = await fetchUserProfile(authUser);
            setUser({ id: authUser.id, email: authUser.email || '', profile });
        }
    };

    const value = useMemo<AuthContextType>(
        () => ({ user, loading, signIn, signOut, refreshProfile }),
        [user, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ======================================================
   HOOK
===================================================== */

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
}
