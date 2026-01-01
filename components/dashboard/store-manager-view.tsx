'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Users, CreditCard, TrendingUp, FileText, Lock, Clock } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { db } from '@/lib/offline-db';
import { cn } from '@/lib/utils';

type TrendPoint = { day: string; value: number };
type PaymentSlice = { name: string; value: number; color: string };

export function StoreManagerDashboard() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const [newCustomers, setNewCustomers] = useState(0);
    const [creditOutstanding, setCreditOutstanding] = useState(0);
    const [creditCount, setCreditCount] = useState(0);
    const [todaySalesCount, setTodaySalesCount] = useState(0);
    const [lastLockedDay, setLastLockedDay] = useState<string | null>(null);
    const [draftsCount, setDraftsCount] = useState(0);
    const [unlockedDays, setUnlockedDays] = useState<any[]>([]);
    const [staffPerformance, setStaffPerformance] = useState<any[]>([]);
    const [weekTotal, setWeekTotal] = useState(0);
    const [avgTx, setAvgTx] = useState(0);
    const [salesTrendData, setSalesTrendData] = useState<TrendPoint[]>([]);
    const [paymentData, setPaymentData] = useState<PaymentSlice[]>([
        { name: 'UPI', value: 0, color: '#3B82F6' },
        { name: 'Cash', value: 0, color: '#10B981' },
        { name: 'Card', value: 0, color: '#8B5CF6' },
        { name: 'Credit', value: 0, color: '#F59E0B' },
    ]);

    useEffect(() => {
        let mounted = true;
        async function load() {
            if (!user?.profile.outlet_id) return;
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const monthStr = `${yyyy}-${mm}`;

            try {
                const res = await fetch(`/api/reports/cash-flow?outletId=${encodeURIComponent(user.profile.outlet_id)}&month=${monthStr}`, { cache: 'no-store' });
                const cf = res.ok ? await res.json() : [];
                const last7 = (cf || []).slice(-7);
                const trend: TrendPoint[] = last7.map((d: any) => {
                    const date = new Date(d.date);
                    const day = date.toLocaleDateString('en-IN', { weekday: 'short' });
                    const value = Number(d.cash_in || 0) + Number(d.upi_in || 0);
                    return { day, value };
                });
                const weekSum = trend.reduce((s, p) => s + p.value, 0);

                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                const isoStart = startDate.toISOString().split('T')[0];
                const isoEnd = now.toISOString().split('T')[0];

                const { data: records } = await (supabase as any)
                    .from('daily_records')
                    .select('id,date')
                    .eq('outlet_id', user.profile.outlet_id)
                    .gte('date', isoStart)
                    .lte('date', isoEnd)
                    .order('date', { ascending: true });
                const recordIds = (records || []).map((r: any) => r.id);

                const { data: txs } = await (supabase as any)
                    .from('transactions')
                    .select('amount,type,payment_mode')
                    .in('daily_record_id', recordIds);
                const list = (txs || []) as Array<{ amount: number; type: 'income' | 'expense'; payment_mode?: 'cash' | 'upi' | 'card' | 'credit' }>;
                const incomes = list.filter(t => t.type === 'income');
                const avg = incomes.length ? incomes.reduce((s, t) => s + Number(t.amount || 0), 0) / incomes.length : 0;
                const groups: Record<string, number> = { upi: 0, cash: 0, card: 0, credit: 0 };
                for (const t of incomes) {
                    const mode = (t.payment_mode || 'cash') as keyof typeof groups;
                    if (groups[mode] !== undefined) groups[mode] += Number(t.amount || 0);
                }

                const { data: cust } = await (supabase as any)
                    .from('customers')
                    .select('id,created_at')
                    .eq('outlet_id', user.profile.outlet_id)
                    .gte('created_at', isoStart)
                    .lte('created_at', isoEnd);

                // Fetch credit outstanding
                const creditRes = await fetch(`/api/reports/credit-outstanding?outletId=${encodeURIComponent(user.profile.outlet_id)}`, { cache: 'no-store' });
                if (creditRes.ok) {
                    const creditData = await creditRes.json();
                    setCreditOutstanding(creditData.total || 0);
                    setCreditCount(creditData.count || 0);
                } else {
                    setCreditOutstanding(0);
                    setCreditCount(0);
                }

                if (!mounted) return;
                setSalesTrendData(trend);
                setWeekTotal(weekSum);
                setAvgTx(avg);
                setPaymentData([
                    { name: 'UPI', value: groups.upi, color: '#3B82F6' },
                    { name: 'Cash', value: groups.cash, color: '#10B981' },
                    { name: 'Card', value: groups.card, color: '#8B5CF6' },
                    { name: 'Credit', value: groups.credit, color: '#F59E0B' },
                ]);
                setNewCustomers((cust || []).length);

                // Fetch Today's Sales Count
                const { count: txCount } = await (supabase as any)
                    .from('transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('outlet_id', user.profile.outlet_id)
                    .eq('category', 'sales')
                    .gte('created_at', now.toISOString().split('T')[0]);
                setTodaySalesCount(txCount || 0);

                // Fetch Last Locked Day
                const { data: lastLocked } = await (supabase as any)
                    .from('daily_records')
                    .select('date')
                    .eq('outlet_id', user.profile.outlet_id)
                    .eq('status', 'locked')
                    .order('date', { ascending: false })
                    .limit(1);
                if (lastLocked?.[0]) {
                    setLastLockedDay(new Date(lastLocked[0].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
                }

                // Fetch Drafts Count (Local)
                const dCount = await db.drafts.where('outlet_id').equals(user.profile.outlet_id).count();
                setDraftsCount(dCount);

                // Fetch Pending Action Days (Submitted but not locked, or completely open)
                const { data: pendingDays } = await (supabase as any)
                    .from('daily_records')
                    .select('*')
                    .eq('outlet_id', user.profile.outlet_id)
                    .neq('status', 'locked')
                    .order('date', { ascending: false });
                setUnlockedDays(pendingDays || []);

                // Fetch Staff Performance (Last 30 days transactions)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const { data: staffTx } = await (supabase as any)
                    .from('transactions')
                    .select('profiles(full_name)')
                    .eq('outlet_id', user.profile.outlet_id)
                    .gte('created_at', thirtyDaysAgo.toISOString());

                const stats: Record<string, number> = {};
                (staffTx || []).forEach((t: any) => {
                    const name = t.profiles?.full_name || 'System';
                    stats[name] = (stats[name] || 0) + 1;
                });
                const sortedStaff = Object.entries(stats)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);
                setStaffPerformance(sortedStaff);

            } catch {
                if (!mounted) return;
                setSalesTrendData([]);
                setWeekTotal(0);
                setAvgTx(0);
                setCreditOutstanding(0);
                setCreditCount(0);
                setPaymentData([
                    { name: 'UPI', value: 0, color: '#3B82F6' },
                    { name: 'Cash', value: 0, color: '#10B981' },
                    { name: 'Card', value: 0, color: '#8B5CF6' },
                    { name: 'Credit', value: 0, color: '#F59E0B' },
                ]);
                setNewCustomers(0);
            }
        }
        load();
        return () => { mounted = false; };
    }, [supabase, user]);

    if (!user?.profile.outlet_id) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border shadow-sm">
                <ShoppingCart className="w-16 h-16 text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">No Outlet Assigned</h2>
                <p className="text-gray-500 mt-2 max-w-sm text-center">
                    Your account hasn't been mapped to a specific outlet yet. Please contact your administrator to assign you to a store.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                    <div className="text-xs text-center text-gray-400 font-mono">User ID: {user?.id}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-500">Today's Sales</span>
                        <ShoppingCart className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{todaySalesCount}</div>
                    <div className="text-xs text-gray-500 mt-1">Pending sync: {draftsCount} drafting</div>
                </div>
                <div className="bg-white p-6 rounded-lg border shadow-sm border-l-4 border-l-red-500">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-500">Pending Locks</span>
                        <Clock className="w-4 h-4 text-red-500" />
                    </div>
                    <div className={cn("text-2xl font-bold", unlockedDays.length > 0 ? "text-red-600" : "text-gray-900")}>
                        {unlockedDays.length}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Days requiring closure</div>
                </div>
            </div>

            {unlockedDays.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                            <Lock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-900">Pending Business Closures</p>
                            <p className="text-xs text-amber-700">You have {unlockedDays.length} days that need to be locked for audit.</p>
                        </div>
                    </div>
                    <a href="/dashboard/daily-entry" className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700">
                        Go to Daily Entries
                    </a>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Daily Sales Trend</h3>
                <p className="text-sm text-gray-500 mb-6">Last 7 days performance</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesTrendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${Number(value) / 1000}K`} />
                            <Tooltip formatter={(value) => [`₹${Math.round(Number(value))}`, 'Sales']} />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                dot={{ r: 4, fill: "#3B82F6", strokeWidth: 2, stroke: "#fff" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Payment Mode Split</h3>
                    <p className="text-sm text-gray-500 mb-4">This week</p>
                    <div className="flex items-center">
                        <div className="h-48 w-48 flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentData}
                                        innerRadius={40}
                                        outerRadius={60}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {paymentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="ml-6 space-y-2">
                            {paymentData.map((item, idx) => (
                                <div key={idx} className="flex items-center">
                                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                                    <span className="text-sm text-gray-600">{item.name}</span>
                                    <span className="text-sm font-semibold ml-auto pl-4">₹{Math.round(item.value).toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Staff Performance</h3>
                    <p className="text-sm text-gray-500 mb-4">Transactions managed (Last 30 days)</p>
                    <div className="space-y-3">
                        {staffPerformance.length === 0 ? (
                            <div className="text-sm text-gray-500 text-center py-8 italic">No transaction data recorded</div>
                        ) : (
                            staffPerformance.map((staff, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                                            {idx + 1}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{staff.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-500">{staff.count} tx</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
