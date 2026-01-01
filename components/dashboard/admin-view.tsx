'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Store, TrendingUp, Users, Award, Download, Lock, FileSpreadsheet, FileText } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { createClientBrowser } from '@/lib/supabase-client';
import { exportUtils } from '@/lib/export-utils';

type OutletPerf = { name: string; sales: number };
type GrowthPoint = { month: string; total: number };
type Referrer = { name: string; count: number };

export function AdminDashboard() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [outletCount, setOutletCount] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [todayTotalSales, setTodayTotalSales] = useState(0);
    const [outletPerformance, setOutletPerformance] = useState<OutletPerf[]>([]);
    const [customerGrowth, setCustomerGrowth] = useState<GrowthPoint[]>([]);
    const [topReferrers, setTopReferrers] = useState<Referrer[]>([]);
    const [unlockedDaysCount, setUnlockedDaysCount] = useState(0);

    useEffect(() => {
        let mounted = true;
        async function load() {
            const role = user?.profile.role;
            if (!role || !['superadmin', 'master_admin', 'ho_accountant'].includes(role)) {
                setOutletCount(0);
                setTotalRevenue(0);
                setTotalCustomers(0);
                setOutletPerformance([]);
                setCustomerGrowth([]);
                setTopReferrers([]);
                return;
            }
            try {
                const res = await fetch('/api/outlets', { cache: 'no-store' });
                const outlets = res.ok ? await res.json() : [];
                setOutletCount((outlets || []).length);

                const now = new Date();
                const yyyy = now.getFullYear();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const monthStr = `${yyyy}-${mm}`;

                const perf: OutletPerf[] = [];
                let revenueSum = 0;
                for (const o of (outlets || [])) {
                    const r = await fetch(`/api/reports/cash-flow?outletId=${encodeURIComponent(o.id)}&month=${monthStr}`, { cache: 'no-store' });
                    const cf = r.ok ? await r.json() : [];
                    const outletTotal = (cf || []).reduce((s: number, d: any) => s + Number(d.cash_in || 0) + Number(d.upi_in || 0), 0);
                    perf.push({ name: o.name, sales: outletTotal });
                    revenueSum += outletTotal;
                }
                if (!mounted) return;
                setOutletPerformance(perf);
                setTotalRevenue(revenueSum);

                // Fetch customer growth data
                const growthRes = await fetch('/api/reports/customer-growth?months=6', { cache: 'no-store' });
                if (growthRes.ok) {
                    const growthData = await growthRes.json();
                    const formatted = growthData.labels.map((label: string, idx: number) => ({
                        month: label,
                        total: growthData.values[idx]
                    }));
                    setCustomerGrowth(formatted);
                    setTotalCustomers(growthData.total);
                } else {
                    setCustomerGrowth([]);
                }

                // Fetch top referrers
                const referrersRes = await fetch('/api/reports/top-referrers?limit=5', { cache: 'no-store' });
                if (referrersRes.ok) {
                    const referrersData = await referrersRes.json();
                    setTopReferrers(referrersData.referrers || []);
                } else {
                    setTopReferrers([]);
                }

                // Fetch Today's Total Sales across all outlets
                const { count: txToday } = await (supabase as any)
                    .from('transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('category', 'sales')
                    .gte('created_at', now.toISOString().split('T')[0]);
                setTodayTotalSales(txToday || 0);

                // Fetch Unlocked Days Count across all outlets
                const { count: unlockedCount } = await (supabase as any)
                    .from('daily_records')
                    .select('*', { count: 'exact', head: true })
                    .neq('status', 'locked');
                setUnlockedDaysCount(unlockedCount || 0);

            } catch {
                if (!mounted) return;
                setOutletCount(0);
                setTotalRevenue(0);
                setTotalCustomers(0);
                setOutletPerformance([]);
                setCustomerGrowth([]);
                setTopReferrers([]);
            }
        }
        load();
        return () => { mounted = false; };
    }, [user]);

    const handleExportCustomers = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('customers')
                .select('name, phone, email, internal_customer_id, customer_code, created_at');

            if (error) throw error;
            if (!data || data.length === 0) {
                alert('No customers to export');
                return;
            }

            exportUtils.toExcel(data, {
                filename: `Customers_Export_${new Date().toISOString().split('T')[0]}`,
                title: 'Customer Database'
            });
        } catch (e: any) {
            alert(`Export failed: ${e.message}`);
        }
    };

    const handleExportSales = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('transactions')
                .select('internal_entry_id, category, amount, payment_mode, created_at')
                .eq('category', 'sales');

            if (error) throw error;
            if (!data || data.length === 0) {
                alert('No sales to export');
                return;
            }

            exportUtils.toExcel(data, {
                filename: `Sales_Export_${new Date().toISOString().split('T')[0]}`,
                title: 'Total Sales Export'
            });
        } catch (e: any) {
            alert(`Export failed: ${e.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Outlets</span>
                        <Store className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{outletCount}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Active stores</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Today's Total Sales</span>
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{todayTotalSales}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Real-time count</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Customers</span>
                        <Users className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalCustomers.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Last 6 months</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Unlocked Days</span>
                        <Lock className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className={cn("text-2xl font-bold", unlockedDaysCount > 0 ? "text-orange-600 dark:text-orange-400" : "text-gray-900 dark:text-white")}>
                        {unlockedDaysCount}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Pending audit closure</div>
                </div>
            </div>

            {outletCount === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                    <Store className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-blue-900">No Outlets Configured</h3>
                    <p className="text-blue-700 max-w-md mx-auto mt-2">
                        It looks like there are no outlets in the system yet. Start by creating an outlet to begin tracking sales and inventory.
                    </p>
                    <a href="/dashboard/outlets" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Configure Outlets
                    </a>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-800 shadow-sm transition-colors">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Data Export</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Export customer and sales data</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCustomers}
                        className="flex items-center px-3 py-2 border dark:border-slate-800 rounded-md text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600 dark:text-green-500" /> Export Customers
                    </button>
                    <button
                        onClick={handleExportSales}
                        className="flex items-center px-3 py-2 border dark:border-slate-800 rounded-md text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-500" /> Export Sales
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border dark:border-slate-800 shadow-sm transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Outlet-wise Sales Performance</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">This month</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={outletPerformance}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${Number(value) / 1000}K`} tick={{ fill: '#64748B' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#F1F5F9' }}
                                itemStyle={{ color: '#F1F5F9' }}
                                formatter={(value) => [`₹${Math.round(Number(value))}`, 'Sales']}
                                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                            />
                            <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border dark:border-slate-800 shadow-sm transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Customer Growth Trend</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">Last 6 months</p>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={customerGrowth}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#F1F5F9' }}
                                    itemStyle={{ color: '#F1F5F9' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }}
                                    name="New Customers"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border dark:border-slate-800 shadow-sm transition-colors">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Referrers</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">All-time leaderboard</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {topReferrers.length === 0 ? (
                            <div className="text-sm text-gray-500 dark:text-slate-400 text-center py-8">No referral data yet</div>
                        ) : (
                            topReferrers.map((referrer, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                                            idx === 1 ? 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300' :
                                                idx === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' :
                                                    'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-white">{referrer.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{referrer.count} referrals</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
