'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ShoppingCart, FileText, CheckCircle2, History, PlusCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { db } from '@/lib/offline-db';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function StaffDashboard() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const [todaySales, setTodaySales] = useState(0);
    const [draftsCount, setDraftsCount] = useState(0);
    const [dayStatus, setDayStatus] = useState<'open' | 'submitted' | 'locked' | 'none'>('none');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!user?.profile.outlet_id) return;
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            try {
                // Today's personal sales count
                const { count } = await supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('created_by', user.id)
                    .eq('category', 'sales')
                    .gte('created_at', todayStr);
                setTodaySales(count || 0);

                // Personal drafts
                const dCount = await db.drafts
                    .where('outlet_id').equals(user.profile.outlet_id)
                    .and(item => item.created_by === user.id)
                    .count();
                setDraftsCount(dCount);

                // Current day status
                const { data: record } = await supabase
                    .from('daily_records')
                    .select('status')
                    .eq('outlet_id', user.profile.outlet_id)
                    .eq('date', todayStr)
                    .single();
                setDayStatus(record?.status || 'open');

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
            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Today's Sales</p>
                        <h3 className="text-3xl font-black text-gray-900">{todaySales}</h3>
                        <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" /> Recorded by you
                        </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <ShoppingCart className="w-8 h-8 text-gray-400" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Local Drafts</p>
                        <h3 className={cn("text-3xl font-black", draftsCount > 0 ? "text-orange-600" : "text-gray-900")}>
                            {draftsCount}
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-1">Pending sync to server</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between overflow-hidden relative">
                    <div className="z-10">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Business Day</p>
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-3 h-3 rounded-full animate-pulse",
                                dayStatus === 'open' ? "bg-green-500" : "bg-red-500"
                            )} />
                            <h3 className="text-xl font-bold text-gray-900 capitalize">{dayStatus}</h3>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Current status for today</p>
                    </div>
                    <div className={cn(
                        "absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10",
                        dayStatus === 'open' ? "bg-green-500" : "bg-red-500"
                    )} />
                </div>
            </div>

            {/* Quick Actions Grid */}
            <section>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-blue-500" /> Quick Actions
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.label}
                            href={action.href}
                            className="group bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center text-center gap-3"
                        >
                            <div className={cn("p-3 rounded-xl text-white shadow-lg shadow-gray-100 group-hover:scale-110 transition-transform", action.color)}>
                                {action.icon}
                            </div>
                            <span className="text-sm font-bold text-gray-700">{action.label}</span>
                            {action.count !== undefined && action.count > 0 && (
                                <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                    {action.count}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            </section>

            {/* Recent Tasks/History Links */}
            <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black mb-2">Review Your History</h2>
                        <p className="text-gray-400 max-w-md">Check your previous sales, returns, and customer registrations for today.</p>
                    </div>
                    <Link
                        href="/dashboard/history/sales"
                        className="flex items-center gap-2 px-6 py-4 bg-white text-gray-900 rounded-2xl font-black hover:bg-blue-50 transition-colors"
                    >
                        View All History
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
            </div>
        </div>
    );
}
