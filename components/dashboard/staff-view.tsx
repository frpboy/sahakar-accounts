'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ShoppingCart, FileText, CheckCircle2, History, PlusCircle, ArrowRight, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { db } from '@/lib/offline-db';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

export function StaffDashboard() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const [todaySales, setTodaySales] = useState(0);
    const [todaySalesValue, setTodaySalesValue] = useState(0);
    const [draftsCount, setDraftsCount] = useState(0);
    const [dayStatus, setDayStatus] = useState<'open' | 'submitted' | 'locked' | 'none' | 'draft'>('none');
    const [todayActivity, setTodayActivity] = useState<any[]>([]);
    const [lastEntryTime, setLastEntryTime] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!user?.profile.outlet_id) return;
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            try {
                // Today's personal sales count and value
                const { data: salesData } = await (supabase as any)
                    .from('transactions')
                    .select('amount')
                    .eq('created_by', user.id)
                    .eq('category', 'sales')
                    .gte('created_at', todayStr);

                setTodaySales(salesData?.length || 0);
                setTodaySalesValue(salesData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0);

                // Today's activity (all personal transactions)
                const { data: activityData } = await (supabase as any)
                    .from('transactions')
                    .select('id, created_at, internal_entry_id, category, amount, daily_records(status)')
                    .eq('created_by', user.id)
                    .gte('created_at', todayStr)
                    .order('created_at', { ascending: false })
                    .limit(10);

                setTodayActivity(activityData || []);

                // Last entry time
                if (activityData && activityData.length > 0) {
                    setLastEntryTime((activityData as any)[0].created_at);
                }

                // Personal drafts
                const dCount = await db.drafts
                    .where('outlet_id').equals(user.profile.outlet_id)
                    .and(item => item.created_by === user.id)
                    .count();
                setDraftsCount(dCount);

                // Current day status
                const { data: record } = await (supabase as any)
                    .from('daily_records')
                    .select('status')
                    .eq('outlet_id', user.profile.outlet_id)
                    .eq('date', todayStr)
                    .single();
                setDayStatus((record?.status as any) || 'open');

            } catch (error) {
                console.error('Error loading staff dashboard:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [user, supabase]);

    const quickActions = [
        { label: 'New Sale', href: '/dashboard/sales', icon: <ShoppingCart className="w-5 h-5" />, color: 'bg-blue-500' },
        { label: 'Sales Return', href: '/dashboard/returns', icon: <History className="w-5 h-5" />, color: 'bg-orange-500' },
        { label: 'Add Customer', href: '/dashboard/customers', icon: <PlusCircle className="w-5 h-5" />, color: 'bg-green-500' },
        { label: 'View Drafts', href: '/dashboard/drafts', icon: <FileText className="w-5 h-5" />, color: 'bg-indigo-500', count: draftsCount },
    ];

    return (
        <div className="space-y-8">
            {/* Draft Sync Warning */}
            {draftsCount > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-lg shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-amber-900 dark:text-amber-300">⚠️ {draftsCount} draft {draftsCount === 1 ? 'entry' : 'entries'} not synced</p>
                            <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1">These WILL NOT be saved unless submitted to the server.</p>
                            <Link
                                href="/dashboard/drafts"
                                className="inline-block mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors"
                            >
                                Review Drafts →
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Cards (Top Metrics) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 px-6 py-8 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
                    <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Today's Sales</p>
                        <h3 className="text-4xl font-black text-gray-900 dark:text-white">{todaySales}</h3>
                        <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-2 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Recorded by you
                        </p>
                    </div>
                    <div className="p-5 bg-gray-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700">
                        <ShoppingCart className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 px-6 py-8 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
                    <div>
                        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Local Drafts</p>
                        <h3 className={cn("text-4xl font-black", draftsCount > 0 ? "text-orange-600 dark:text-orange-400" : "text-gray-900 dark:text-white")}>
                            {draftsCount}
                        </h3>
                        <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-2">Pending sync to server</p>
                    </div>
                    <div className="p-5 bg-gray-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700">
                        <FileText className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 px-6 py-8 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center justify-between overflow-hidden relative transition-colors">
                    <div className="z-10">
                        <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Business Day</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={cn(
                                "w-2.5 h-2.5 rounded-full",
                                dayStatus === 'open' ? "bg-green-500" : "bg-red-500"
                            )} />
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{dayStatus}</h3>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-2">Current status for today</p>
                    </div>
                    <div className={cn(
                        "absolute -right-4 -bottom-4 w-28 h-28 rounded-full opacity-5",
                        dayStatus === 'open' ? "bg-green-500" : "bg-red-500"
                    )} />
                    <div className="p-5 bg-gray-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700 relative z-10">
                        <Clock className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-6 bg-blue-600 rounded-full" />
                    <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
                        Quick Actions
                    </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {quickActions.map((action) => (
                        <Link
                            key={action.label}
                            href={action.href}
                            className="group bg-white dark:bg-slate-900 py-10 rounded-2xl border dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-slate-950/50 hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-4 relative"
                        >
                            <div className={cn("p-4 rounded-xl text-white shadow-xl transition-transform group-hover:scale-110", action.color)}>
                                {action.icon}
                            </div>
                            <span className="text-base font-bold text-gray-800 dark:text-slate-200">{action.label}</span>
                            {action.count !== undefined && action.count > 0 && (
                                <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
                                    {action.count}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            </section>

            {/* Recent Tasks/History Links */}
            <div className="bg-[#0F172A] dark:bg-[#020617] rounded-3xl p-10 text-white relative overflow-hidden group border dark:border-slate-800 shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-black mb-3">Review Your History</h2>
                        <p className="text-slate-400 text-lg max-w-lg leading-relaxed">
                            Check your previous sales, returns, and customer registrations for today to ensure accuracy.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/history/sales"
                        className="flex items-center gap-3 px-8 py-5 bg-white text-gray-900 rounded-2xl font-black hover:bg-slate-100 transition-all hover:scale-105 shadow-lg whitespace-nowrap"
                    >
                        View All History
                        <ArrowRight className="w-6 h-6" />
                    </Link>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl opacity-50" />
            </div>
        </div>
    );
}
