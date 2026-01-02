'use client';

import React, { useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { useRouter, useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function AnalyticsContent() {
    const supabase = createClientBrowser();
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const outletIdParam = searchParams.get('outletId');

    // Date Range (Last 30 days by default)
    const [dateRange, setDateRange] = useState('30');

    const isAdmin = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');

    // Fetch transactions
    const { data: transactions, isLoading } = useQuery({
        queryKey: ['analytics-data', dateRange, outletIdParam],
        queryFn: async () => {
            const endDate = new Date(); // Now
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - parseInt(dateRange));
            startDate.setHours(7, 0, 0, 0); // Start at 7 AM

            let query = supabase
                .from('transactions')
                .select('amount, type, category, created_at, payment_modes, outlet_id')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            if (outletIdParam) {
                query = query.eq('outlet_id', outletIdParam);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
    });

    // Fetch new customers count
    const { data: newCustomers } = useQuery({
        queryKey: ['new-customers', dateRange, outletIdParam],
        queryFn: async () => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - parseInt(dateRange));

            const { count, error } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            if (error) throw error;
            return count || 0;
        }
    });

    // Fetch outlets
    const { data: outlets } = useQuery({
        queryKey: ['outlets-list'],
        queryFn: async () => {
            const { data } = await supabase.from('outlets').select('id, name');
            return data || [];
        }
    });

    // Process Data for Charts
    const processedData = React.useMemo(() => {
        const defaultTotal = { amount: 0, count: 0 };
        if (!transactions) return {
            dailyStats: [],
            modeStats: [],
            outletStats: [],
            totals: {
                sales: { ...defaultTotal },
                sales_return: { ...defaultTotal },
                purchase: { ...defaultTotal },
                purchase_return: { ...defaultTotal },
                credit_received: { ...defaultTotal }
            }
        };

        const daily: Record<string, { date: string, income: number, expense: number }> = {};
        const modes: Record<string, number> = {};

        // Outlet Map
        const outletMap: Record<string, { name: string, revenue: number, count: number }> = {};
        outlets?.forEach((o: any) => {
            outletMap[o.id] = { name: o.name, revenue: 0, count: 0 };
        });

        const totals = {
            sales: { amount: 0, count: 0 },
            sales_return: { amount: 0, count: 0 },
            purchase: { amount: 0, count: 0 },
            purchase_return: { amount: 0, count: 0 },
            credit_received: { amount: 0, count: 0 }
        };

        (transactions as any[]).forEach((t: any) => {
            const dateObj = new Date(t.created_at);
            dateObj.setHours(dateObj.getHours() - 7); // Adjust for 7AM business day start
            const date = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

            if (!daily[date]) {
                daily[date] = { date, income: 0, expense: 0 };
            }

            const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount || 0);

            if (t.type === 'income') {
                daily[date].income += amount;
            } else {
                daily[date].expense += amount;
            }

            // Category Totals
            if (t.category === 'sales') { totals.sales.amount += amount; totals.sales.count += 1; }
            else if (t.category === 'sales_return') { totals.sales_return.amount += amount; totals.sales_return.count += 1; }
            else if (t.category === 'purchase') { totals.purchase.amount += amount; totals.purchase.count += 1; }
            else if (t.category === 'purchase_return') { totals.purchase_return.amount += amount; totals.purchase_return.count += 1; }
            else if (t.category === 'credit_received') { totals.credit_received.amount += amount; totals.credit_received.count += 1; }

            // Outlet Stats
            if (t.category === 'sales' && t.type === 'income' && t.outlet_id) {
                if (outletMap[t.outlet_id]) {
                    outletMap[t.outlet_id].revenue += amount;
                    outletMap[t.outlet_id].count += 1;
                }
            }

            // Payment modes
            if (t.type === 'income' && t.payment_modes) {
                const txModes = t.payment_modes.split(',').map((m: string) => {
                    const clean = m.trim().toLowerCase();
                    return clean.charAt(0).toUpperCase() + clean.slice(1);
                });
                txModes.forEach((m: string) => {
                    const amt = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount || 0);
                    modes[m] = (modes[m] || 0) + amt / txModes.length;
                });
            }
        });

        // Convert to arrays
        const start = new Date();
        start.setDate(start.getDate() - parseInt(dateRange));
        const end = new Date();

        const finalDailyStats = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            if (daily[key]) {
                finalDailyStats.push(daily[key]);
            } else {
                finalDailyStats.push({ date: key, income: 0, expense: 0 });
            }
        }

        const modeStats = Object.keys(modes).map(key => ({
            name: key,
            value: parseFloat(modes[key].toFixed(2))
        }));

        const outletStats = Object.values(outletMap)
            .filter(o => o.revenue > 0 || o.count > 0)
            .sort((a, b) => b.revenue - a.revenue);

        return { dailyStats: finalDailyStats, modeStats, totals, outletStats };
    }, [transactions, dateRange, outlets]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (!isAdmin && !isLoading) {
        return (
            <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
                <TopBar title="Access Denied" />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-2">
                            <BarChart3 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">HO Exclusive Analytics</h2>
                        <p className="text-gray-600 max-w-sm mx-auto">
                            Consolidated business trends and analytics are only accessible to Head Office accounts and Administrators.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <TopBar title="Trends & Analytics" />

            <div className="p-6 max-w-7xl mx-auto w-full space-y-6">

                {/* Controls */}
                <div className="flex justify-end">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg px-4 py-2 text-sm font-medium"
                    >
                        <option value="0">Today</option>
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 3 Months</option>
                    </select>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">New Sales</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">₹{processedData.totals.sales.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">{processedData.totals.sales.count} entries</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Sales Return</p>
                        <p className="text-xl font-bold text-red-600">₹{processedData.totals.sales_return.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">{processedData.totals.sales_return.count} entries</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Purchase</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">₹{processedData.totals.purchase.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">{processedData.totals.purchase.count} entries</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Purchase Return</p>
                        <p className="text-xl font-bold text-green-600">₹{processedData.totals.purchase_return.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">{processedData.totals.purchase_return.count} entries</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Credit Received</p>
                        <p className="text-xl font-bold text-blue-600">₹{processedData.totals.credit_received.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">{processedData.totals.credit_received.count} entries</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">New Customers</p>
                        <p className="text-xl font-bold text-purple-600">{newCustomers || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">Registrations</p>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Income vs Expense Trend */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border dark:border-slate-800 shadow-sm lg:col-span-2">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-6">Income vs Expense Trend</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={processedData.dailyStats}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ff7f7f" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ff7f7f" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => '₹' + value} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px #00000020' }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="income" stroke="#82ca9d" fillOpacity={1} fill="url(#colorIncome)" name="Income" />
                                    <Area type="monotone" dataKey="expense" stroke="#ff7f7f" fillOpacity={1} fill="url(#colorExpense)" name="Expense" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Sales Volume Bar */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-6">Daily Sales Volume</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={processedData.dailyStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => '₹' + value} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="income" fill="#8884d8" radius={[4, 4, 0, 0]} name="Sales" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Payment Modes Pie */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-6">Payment Mode Distribution</h3>
                        <div className="h-[300px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={processedData.modeStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {processedData.modeStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* Outlet Performance Charts */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-6">Outlet Performance Comparison</h3>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={processedData.outletStats} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />

                                    <XAxis type="number" xAxisId="revenue" orientation="top" stroke="#3b82f6" fontSize={12} tickFormatter={(value) => '₹' + value} />
                                    <XAxis type="number" xAxisId="count" orientation="bottom" stroke="#10b981" fontSize={12} />

                                    <YAxis dataKey="name" type="category" width={150} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />

                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Legend verticalAlign="top" height={36} />

                                    <Bar dataKey="revenue" xAxisId="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Revenue" barSize={20} />
                                    <Bar dataKey="count" xAxisId="count" fill="#10b981" radius={[0, 4, 4, 0]} name="Transactions" barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <Suspense fallback={<div className="p-6">Loading analytics...</div>}>
            <AnalyticsContent />
        </Suspense>
    );
}
