'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';

/* ======================================================
   TYPES
====================================================== */

export type AppMode = 'online' | 'offline';

export type UserRole = 'outlet_staff' | 'outlet_manager' | 'admin';

export type AppContextType = {
    mode: AppMode;
    isOffline: boolean;
    toggleMode: () => void;
    demoRole: UserRole;
    setDemoRole: (role: UserRole) => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
};

/* ======================================================
   CONTEXT
====================================================== */

const AppContext = createContext<AppContextType | undefined>(undefined);

/* ======================================================
   PROVIDER
====================================================== */

export function AppProvider({ children }: { children: ReactNode }) {
    const [isOffline, setIsOffline] = useState(false);
    const [demoRole, setDemoRole] = useState<UserRole>('outlet_staff');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { user, signOut } = useAuth();

    // Auto sign-out at 2 AM for staff
    useEffect(() => {
        if (user?.profile?.role !== 'outlet_staff') return;

        const checkTime = () => {
            const now = new Date();
            const hour = now.getHours();
            // If it's between 2:00 AM and 2:01 AM, sign out
            if (hour === 2) {
                console.log('[AutoSignOut] It is 2 AM, signing out staff...');
                signOut();
            }
        };

        const interval = setInterval(checkTime, 60000); // Check every minute
        checkTime(); // Check immediately

        return () => clearInterval(interval);
    }, [user, signOut]);

    // Monitor network status

    const toggleMode = useCallback(() => {
        // For testing offline mode behavior
        setIsOffline(prev => !prev);
    }, []);

    const value: AppContextType = {
        mode: isOffline ? 'offline' : 'online',
        isOffline,
        toggleMode,
        demoRole,
        setDemoRole,
        isMobileMenuOpen,
        setIsMobileMenuOpen
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

/* ======================================================
   HOOK
====================================================== */

export function useApp(): AppContextType {
    const ctx = useContext(AppContext);
    if (!ctx) {
        throw new Error('useApp must be used within AppProvider');
    }
    return ctx;
}
