'use client';

import React, { useState } from 'react';
import { useApp } from '@/components/providers/app-provider';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { getISTDate, getBusinessDate, formatISTClock } from '@/lib/ist-utils';

export function TopBar({ title }: { title: string }) {
    const { isOffline, isMobileMenuOpen, setIsMobileMenuOpen, isDarkMode, toggleDarkMode } = useApp();
    const { user, signOut } = useAuth();
    const [endingDuty, setEndingDuty] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const isStaff = user?.profile?.role === 'outlet_staff';
    const supabase = createClientBrowser();

    // Live Clock Effect
    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const { dateStr, timeStr } = formatISTClock(currentTime);

    const handleDutyEnd = async () => {
        if (!user?.id || !user?.profile?.outlet_id) return;

        const confirmed = confirm(
            '⚠️ End Duty?\n\n' +
            'You will be logged out and locked out until 7:00 AM IST tomorrow.\n\n' +
            'Are you sure you want to end your duty for today?'
        );

        if (!confirmed) return;

        setEndingDuty(true);

        try {
            const bizDate = getBusinessDate();
            const now = getISTDate().toISOString();

            // Record duty end in duty_logs
            const { error } = await (supabase
                .from('duty_logs' as any) as any)
                .upsert({
                    user_id: user.id,
                    outlet_id: user.profile.outlet_id,
                    date: bizDate,
                    duty_end: now
                }, {
                    onConflict: 'user_id,date'
                });

            if (error) throw error;

            // Success feedback
            alert('✅ Duty ended successfully. See you tomorrow at 7 AM!');

            // Sign out user
            await signOut();

        } catch (error) {
            console.error('Error ending duty:', error);
            alert('❌ Failed to end duty. Please try again.');
            setEndingDuty(false);
        }
    };

    return (
        <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10 transition-colors">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 -ml-2 text-gray-600 dark:text-slate-400 lg:hidden hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white truncate">{title}</h1>
            </div>

            <div className="flex items-center gap-3 lg:gap-6">
                {/* IST Digital Clock */}
                <div className="hidden md:flex flex-col items-end leading-tight mr-2">
                    <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{dateStr}</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-base font-mono font-black text-gray-700 dark:text-slate-200 tabular-nums">
                            {timeStr.split(' ')[0]}
                        </span>
                        <div className="h-3 w-px bg-gray-200 dark:bg-slate-800" />
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                            {timeStr.split(' ')[1]}
                        </span>
                    </div>
                </div>

                {/* Status Badge */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${isOffline ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                    }`}>
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${isOffline ? 'bg-gray-400' : 'bg-green-400'}`}></span>
                    {isOffline ? 'Offline' : 'Online'}
                </span>

                {/* Theme Toggle */}
                <button
                    onClick={toggleDarkMode}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-95"
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Duty End Button (Staff Only) */}
                {isStaff && (
                    <button
                        onClick={handleDutyEnd}
                        disabled={endingDuty}
                        className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">{endingDuty ? 'Ending...' : 'Duty End'}</span>
                    </button>
                )}

            </div>
        </header>
    );
}
