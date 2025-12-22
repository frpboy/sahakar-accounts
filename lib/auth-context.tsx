'use client';

import React, {
    createContext,
    useContext,
    useMemo,
    ReactNode,
} from 'react';

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
            signIn: async (email: string, password: string) => { },
            signOut: async () => { },
        }), []);

        return (
            <AuthContext.Provider value={value}>
                {children}
            </AuthContext.Provider>
        );
    }

    /* ======================================================
       🚫 PRODUCTION MODE (placeholder for later)
    ====================================================== */

    const value = useMemo<AuthContextType>(() => ({
        user: null,
        loading: false,
        signIn: async (email: string, password: string) => { },
        signOut: async () => { },
    }), []);

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
