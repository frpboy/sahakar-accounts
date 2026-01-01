'use client';

import React, { useState } from 'react';
import { useApp } from '@/components/providers/app-provider';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Share2, LogOut, Menu, X } from 'lucide-react';

export function TopBar({ title }: { title: string }) {
    const { isOffline, isMobileMenuOpen, setIsMobileMenuOpen } = useApp();
    const { user, signOut } = useAuth();
    const [endingDuty, setEndingDuty] = useState(false);

    const isStaff = user?.profile?.role === 'outlet_staff';
    const supabase = createClientBrowser();

    const handleDutyEnd = async () => {
        if (!user?.id || !user?.profile?.outlet_id) return;

        const confirmed = confirm(
            '⚠️ End Duty?\n\n' +
            'You will be logged out and cannot login again until tomorrow.\n\n' +
            'Are you sure you want to end your duty for today?'
        );

        if (!confirmed) return;

        setEndingDuty(true);

        try {
            const today = new Date().toISOString().split('T')[0];
            const now = new Date().toISOString();

            // Record duty end in duty_logs
            const { error } = await (supabase
                .from('duty_logs' as any) as any)
                .upsert({
                    user_id: user.id,
                    outlet_id: user.profile.outlet_id,
                    date: today,
                    duty_end: now
                }, {
                    onConflict: 'user_id,date'
                });

            if (error) throw error;

            // Sign out user
            await signOut();

        } catch (error) {
            console.error('Error ending duty:', error);
            alert('❌ Failed to end duty. Please try again.');
            setEndingDuty(false);
        }
    };

    return (
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 -ml-2 text-gray-600 lg:hidden hover:bg-gray-100 rounded-md transition-colors"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <h1 className="text-lg lg:text-xl font-bold text-gray-900 truncate">{title}</h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Status Badge */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOffline ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                    }`}>
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${isOffline ? 'bg-gray-400' : 'bg-green-400'}`}></span>
                    {isOffline ? 'Offline' : 'Online'}
                </span>

                {/* Duty End Button (Staff Only) */}
                {isStaff && (
                    <button
                        onClick={handleDutyEnd}
                        disabled={endingDuty}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <LogOut className="w-4 h-4" />
                        {endingDuty ? 'Ending...' : 'Duty End'}
                    </button>
                )}

                <button className="p-2 text-gray-400 hover:text-gray-500">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
