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

    // Monitor network status
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        setIsOffline(!navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const toggleMode = useCallback(() => {
        // For testing offline mode behavior
        setIsOffline(prev => !prev);
    }, []);

    const value: AppContextType = {
        mode: isOffline ? 'offline' : 'online',
        isOffline,
        toggleMode,
        demoRole,
        setDemoRole
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
