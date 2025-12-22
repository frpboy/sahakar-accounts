'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, MOCK_USERS } from '@/lib/supabase';
import type { AuthUser, AuthContextType, UserProfile } from '@/lib/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(!DEV_MODE); // Don't load in dev mode

    const fetchUserProfile = async (authUser: User): Promise<UserProfile | null> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (error) {
                console.error('Error fetching user profile:', error);
                return null;
            }

            return data as UserProfile;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    const loadUser = async () => {
        // DEV MODE: Use mock user
        if (DEV_MODE) {
            console.log('[AuthContext] 🔧 DEV MODE: Using mock staff user');
            const mockUser = MOCK_USERS.staff;
            setUser(mockUser);
            setLoading(false);
            return;
        }

        // PRODUCTION MODE: Use Supabase
        try {
            console.log('[AuthContext] Loading user from Supabase...');

            const {
                data: { session },
            } = await supabase.auth.getSession();

            const authUser = session?.user;
            console.log('[AuthContext] Auth user:', authUser ? 'Found' : 'Not found');

            if (authUser) {
                console.log('[AuthContext] Fetching profile for:', authUser.id);
                const profile = await fetchUserProfile(authUser);
                console.log('[AuthContext] Profile loaded:', profile ? 'Success' : 'Failed');
                setUser({
                    id: authUser.id,
                    email: authUser.email || '',
                    profile,
                });
            } else {
                console.log('[AuthContext] No auth user, setting to null');
                setUser(null);
            }
        } catch (error) {
            console.error('[AuthContext] Error loading user:', error);
            setUser(null);
        } finally {
            console.log('[AuthContext] Setting loading to false');
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();

        if (DEV_MODE) {
            console.log('[AuthContext] 🔧 DEV MODE: Skipping auth state listener');
            return;
        }

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const profile = await fetchUserProfile(session.user);
                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    profile,
                });
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        // DEV MODE: Simulate login
        if (DEV_MODE) {
            console.log('[AuthContext] 🔧 DEV MODE: Simulating login for:', email);
            const mockUser = email.includes('manager') ? MOCK_USERS.manager :
                email.includes('admin') ? MOCK_USERS.admin :
                    MOCK_USERS.staff;
            setUser(mockUser);
            return;
        }

        // PRODUCTION MODE
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        if (data.user) {
            const profile = await fetchUserProfile(data.user);
            setUser({
                id: data.user.id,
                email: data.user.email || '',
                profile,
            });
        }
    };

    const signOut = async () => {
        // DEV MODE: Just clear user
        if (DEV_MODE) {
            console.log('[AuthContext] 🔧 DEV MODE: Signing out (mock)');
            setUser(null);
            return;
        }

        // PRODUCTION MODE
        await supabase.auth.signOut();
        setUser(null);
    };

    const refreshProfile = async () => {
        if (DEV_MODE) {
            console.log('[AuthContext] 🔧 DEV MODE: Refresh not needed');
            return;
        }

        if (user) {
            const {
                data: { user: authUser },
            } = await supabase.auth.getUser();
            if (authUser) {
                const profile = await fetchUserProfile(authUser);
                setUser({
                    ...user,
                    profile,
                });
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
