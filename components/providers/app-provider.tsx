'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { getISTDate, getBusinessDate } from '@/lib/ist-utils';

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
    isDarkMode: boolean;
    toggleDarkMode: () => void;
};

/* ======================================================
   CONTEXT
====================================================== */

const AppContext = createContext<AppContextType | undefined>(undefined);

/* ======================================================
   PROVIDER
====================================================== */

import { PWAInstallPrompt } from '@/components/pwa-install-prompt';

export function AppProvider({ children }: { children: ReactNode }) {
    const [isOffline, setIsOffline] = useState(false);
    const [demoRole, setDemoRole] = useState<UserRole>('outlet_staff');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Initial theme load
    useEffect(() => {
        const saved = localStorage.getItem('theme-mode');
        if (saved === 'dark') {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else if (saved === 'light') {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDarkMode = useCallback(() => {
        setIsDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('theme-mode', next ? 'dark' : 'light');
            if (next) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
            return next;
        });
    }, []);

    const { user, signOut } = useAuth();

    // Unified staff guard: Auto sign-out at 2 AM OR if duty ended OR outside business hours (7 AM - 2 AM)
    useEffect(() => {
        if (!user || user?.profile?.role !== 'outlet_staff') return;

        const checkStaffAccess = async () => {
            const ist = getISTDate();
            const hour = ist.getHours();

            // 1. Check Business Hours (Locked between 02:00 and 07:00 IST)
            if (hour >= 2 && hour < 7) {
                console.log('[StaffGuard] Outside business hours (2 AM - 7 AM), signing out...');
                alert('🛑 System is closed. Access is permitted only from 7:00 AM to 2:00 AM IST.');
                await signOut();
                return;
            }

            // 2. Check if Duty already Ended for current business date
            const bizDate = getBusinessDate();
            const supabase = createClientBrowser();

            const { data: dutyLog } = await supabase
                .from('duty_logs' as any)
                .select('duty_end')
                .eq('user_id', user.id)
                .eq('date', bizDate)
                .maybeSingle() as any;

            if (dutyLog && dutyLog.duty_end) {
                console.log('[StaffGuard] Duty already ended for today, signing out...');
                await signOut();
                window.location.href = '/rest?reason=duty_locked';
            }
        };

        const interval = setInterval(checkStaffAccess, 120000); // Check every 2 minutes
        checkStaffAccess(); // Check immediately

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
        setIsMobileMenuOpen,
        isDarkMode,
        toggleDarkMode
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
