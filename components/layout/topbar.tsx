'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/providers/app-provider';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { LogOut, Menu, X, Sun, Moon, ArrowLeft } from 'lucide-react';
import { getISTDate, getBusinessDate, formatISTClock } from '@/lib/ist-utils';
import { useRouter, usePathname } from 'next/navigation';

export function TopBar({ title }: { title: string }) {
    const { isOffline, isMobileMenuOpen, setIsMobileMenuOpen, isDarkMode, toggleDarkMode } = useApp();
    const { user, signOut } = useAuth();
    const [endingDuty, setEndingDuty] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [mounted, setMounted] = useState(false);

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    const isStaff = user?.profile?.role === 'outlet_staff';
    const supabase = createClientBrowser();

    // Live Clock Effect
    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);



    const [rank, setRank] = useState<number | null>(null);

    // Fetch Outlet Rank (MTD)
    useEffect(() => {
        if (!user?.profile?.outlet_id || !user?.profile?.role.includes('outlet')) return;

        const fetchRank = async () => {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // Get Sales for all outlets this month
            const { data: txs } = await supabase
                .from('transactions')
                .select('outlet_id, amount')
                .eq('type', 'income')
                .eq('category', 'sales')
                .gte('created_at', firstDay);

            if (!txs) return;

            // Group by outlet
            const revenueByOutlet: Record<string, number> = {};
            txs.forEach((t: any) => {
                const amt = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount || 0);
                revenueByOutlet[t.outlet_id] = (revenueByOutlet[t.outlet_id] || 0) + amt;
            });

            // Sort and find rank
            const sortedOutlets = Object.keys(revenueByOutlet).sort((a, b) => revenueByOutlet[b] - revenueByOutlet[a]);
            const myRank = sortedOutlets.indexOf(user.profile.outlet_id) + 1;

            // If my outlet has 0 sales but others have sales, I might not be in the keys if I have 0 txs.
            // If I am not in keys, rank is Last or check active outlets count.
            // For simplicity, if > 0 sales, show rank.
            if (myRank > 0) setRank(myRank);
            else if (sortedOutlets.length > 0) setRank(sortedOutlets.length + 1); // Assume last if no sales
        };

        fetchRank();
    }, [user, supabase]);

    const { dateStr, timeStr } = formatISTClock(currentTime);

    const handleDutyEnd = async () => {
        if (!user?.id || !user?.profile?.outlet_id) return;

        setEndingDuty(true);

        try {
            const bizDate = getBusinessDate();

            // 1. Fetch Today's Daily Record for Tally Validation
            const { data: record, error: fetchError } = await (supabase
                .from('daily_records')
                .select('opening_cash, opening_upi, total_income, total_expense, physical_cash, physical_upi, tally_comment')
                .eq('outlet_id', user.profile.outlet_id)
                .eq('date', bizDate)
                .maybeSingle() as any);

            if (fetchError) throw fetchError;

            if (!record) {
                alert('⚠️ No daily record found for today. Please ensure you have started your shift correctly.');
                setEndingDuty(false);
                return;
            }

            // 2. Validation Logic
            const totalExpected = (record.opening_cash || 0) + (record.opening_upi || 0) + (record.total_income || 0) - (record.total_expense || 0);
            const totalPhysical = (record.physical_cash || 0) + (record.physical_upi || 0);
            const difference = totalPhysical - totalExpected;

            // Check if tally was even entered (if total income > 0 and physical is still 0, it's suspicious)
            if (totalExpected > 0 && totalPhysical === 0) {
                const proceed = confirm('⚠️ Your physical tally is currently ₹0.00 while expected is ₹' + totalExpected.toLocaleString() + '.\n\nDid you forget to enter your physical cash/UPI in the Dashboard summary?');
                if (!proceed) {
                    setEndingDuty(false);
                    return;
                }
            }

            // Mismatch Validation
            if (Math.abs(difference) > 0.01 && !record.tally_comment?.trim()) {
                alert('❌ Tally Mismatch: There is a difference of ₹' + difference.toLocaleString() + '.\n\nYou MUST provide a comment in the "Daily Summary" section explaining this mismatch before ending your duty.');
                setEndingDuty(false);
                return;
            }

            // 3. Final Confirmation
            const confirmed = confirm(
                '⚠️ End Duty?\n\n' +
                'Tally Status: ' + (Math.abs(difference) < 0.01 ? '✅ Matched' : '⚠️ Mis-matched (Comment provided)') + '\n' +
                'You will be logged out and locked out until 7:00 AM IST tomorrow.\n\n' +
                'Are you sure you want to end your duty for today?'
            );

            if (!confirmed) {
                setEndingDuty(false);
                return;
            }

            const now = getISTDate().toISOString();

            // 4. Record duty end
            const { error: logError } = await (supabase
                .from('duty_logs' as any) as any)
                .upsert({
                    user_id: user.id,
                    outlet_id: user.profile.outlet_id,
                    date: bizDate,
                    duty_end: now
                }, {
                    onConflict: 'user_id,date'
                });

            if (logError) throw logError;

            // 5. Success
            alert('✅ Duty ended successfully. See you tomorrow at 7 AM!');
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
                {pathname !== '/dashboard' && (
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden lg:flex"
                        title="Go Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}

                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 -ml-2 text-gray-600 dark:text-slate-400 lg:hidden hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-md" />
                <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white truncate">{title}</h1>
            </div>

            <div className="flex items-center gap-3 lg:gap-6">
                {/* IST Digital Clock */}
                <div className="hidden md:flex flex-col items-end leading-tight mr-2">
                    <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{dateStr}</span>
                    <div className="flex items-center gap-1.5">
                        {mounted ? (
                            <>
                                <span className="text-base font-mono font-black text-gray-700 dark:text-slate-200 tabular-nums">
                                    {timeStr.split(' ')[0]}
                                </span>
                                <div className="h-3 w-px bg-gray-200 dark:bg-slate-800" />
                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                                    {timeStr.split(' ')[1]}
                                </span>
                            </>
                        ) : (
                            <span className="text-sm text-gray-400">...</span>
                        )}
                    </div>
                </div>

                {/* Rank Badge */}
                {rank && (
                    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-full shadow-sm">
                        <span className="text-sm">🏆</span>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                            Rank #{rank}
                        </span>
                    </div>
                )}

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
