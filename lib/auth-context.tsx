'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AuthUser, AuthContextType, UserProfile } from '@/lib/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

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
        try {
            const {
                data: { user: authUser },
            } = await supabase.auth.getUser();

            if (authUser) {
                const profile = await fetchUserProfile(authUser);
                setUser({
                    id: authUser.id,
                    email: authUser.email || '',
                    profile,
                });
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Error loading user:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();

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
        await supabase.auth.signOut();
        setUser(null);
    };

    const refreshProfile = async () => {
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
