'use client';

import React, { useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { useQuery } from '@tanstack/react-query';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

export default function AnalyticsPage() {
    const supabase = createClientBrowser();
    const { user } = useAuth();

    // Date Range (Last 30 days by default)
    const [dateRange, setDateRange] = useState('30');

    const isAdmin = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');

    // Fetch transactions
    const { data: transactions, isLoading } = useQuery({
        queryKey: ['analytics-data', dateRange],
        queryFn: async () => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - parseInt(dateRange));

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            if (error) throw error;
            return data;
        }
    });

    // Process Data for Charts
    const processedData = React.useMemo(() => {
        if (!transactions) return { dailyStats: [], modeStats: [] };

        const daily: Record<string, { date: string, income: number, expense: number }> = {};
        const modes: Record<string, number> = {};

        (transactions as any[]).forEach((t: any) => {
            const date = new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

            if (!daily[date]) {
                daily[date] = { date, income: 0, expense: 0 };
            }

            if (t.type === 'income') {
                daily[date].income += t.amount || 0;
            } else {
                daily[date].expense += t.amount || 0;
            }

            // Payment modes
            if (t.type === 'income' && t.payment_mode) {
                const txModes = t.payment_mode.split(',').map((m: string) => m.trim());
                txModes.forEach((m: string) => {
                    modes[m] = (modes[m] || 0) + (t.amount || 0) / txModes.length; // distribute amount if split
                });
            }
        });

        // Convert to arrays
        const dailyStats = Object.values(daily).sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime() // Rough sort, might need better date parsing if 'day month' format
        );
        // Correct sorting by date object
        // Re-parsing date for sort might be tricky with just '02 Jan', so let's rely on the original iteration order if possible or better keys.
        // Let's use ISO key for sorting then display label

        // Revised sort approach:
        // We'll iterate by date range to ensure all days are present (even empty ones) and sorted.
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

        return { dailyStats: finalDailyStats, modeStats };
    }, [transactions, dateRange]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (!isAdmin && !isLoading) {
        return (
            <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
                <TopBar title="Access Denied" />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-2">
                            <BarChart barchart className="w-8 h-8" />
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
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 3 Months</option>
                    </select>
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
            </div>
        </div>
    );
}
