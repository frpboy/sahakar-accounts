'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { MetricCard } from '@/components/dashboard/metrics/metric-card';
import { SalesTrendChart } from '@/components/dashboard/charts/sales-trend-chart';
import { Building2, IndianRupee, AlertTriangle, TrendingUp, Download } from 'lucide-react';

export function HOAccountantDashboard() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();

    const [totalRevenue, setTotalRevenue] = useState(0);
    const [outletCount, setOutletCount] = useState(0);
    const [totalCredits, setTotalCredits] = useState(0);
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [anomaliesCount, setAnomaliesCount] = useState(0);
    const [outlets, setOutlets] = useState<any[]>([]);
    const [salesTrendData, setSalesTrendData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHOData();
        const interval = setInterval(loadHOData, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const loadHOData = async () => {
        const today = new Date().toISOString().split('T')[0];
        const monthStart = new Date().toISOString().substring(0, 7) + '-01';

        try {
            // Get all outlets
            const { data: outletsData } = await supabase
                .from('outlets')
                .select('*');

            setOutlets(outletsData || []);
            setOutletCount(outletsData?.length || 0);

            // Today's total revenue across all outlets
            const { data: todaySales } = await supabase
                .from('transactions')
                .select('amount')
                .eq('type', 'income')
                .eq('category', 'sales')
                .gte('created_at', today);

            const todayTotal = todaySales?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
            setTotalRevenue(todayTotal);

            // Monthly revenue
            const { data: monthSales } = await supabase
                .from('transactions')
                .select('amount')
                .eq('type', 'income')
                .eq('category', 'sales')
                .gte('created_at', monthStart);

            const monthTotal = monthSales?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
            setMonthlyRevenue(monthTotal);

            // Total credits
            const { data: credits } = await supabase
                .from('transactions')
                .select('amount')
                .eq('payment_mode', 'Credit' as any);

            const creditsTotal = credits?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
            setTotalCredits(creditsTotal);

            // Anomalies count (placeholder - table not created yet)
            setAnomaliesCount(0);

            // Sales trend (last 7 days, all outlets)
            const trendData = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(Date.now() - i * 86400000);
                const dateStr = date.toISOString().split('T')[0];
                const nextDateStr = new Date(date.getTime() + 86400000).toISOString().split('T')[0];

                const { data: daySales } = await supabase
                    .from('transactions')
                    .select('amount')
                    .eq('type', 'income')
                    .eq('category', 'sales')
                    .gte('created_at', dateStr)
                    .lt('created_at', nextDateStr);

                const dayTotal = daySales?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
                trendData.push({ date: dateStr, sales: dayTotal });
            }
            setSalesTrendData(trendData);

        } catch (error) {
            console.error('Error loading HO data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">HO Accountant Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Consolidated view across all outlets</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    <Download className="h-4 w-4" />
                    Export Consolidated
                </button>
            </div>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <MetricCard
                    title="Total Revenue (Today)"
                    value={`₹${totalRevenue.toLocaleString()}`}
                    subtitle="All outlets"
                    icon={<IndianRupee className="h-5 w-5 text-green-600" />}
                />
                <MetricCard
                    title="Active Outlets"
                    value={outletCount.toString()}
                    subtitle="Operational"
                    icon={<Building2 className="h-5 w-5 text-blue-600" />}
                />
                <MetricCard
                    title="Credits Outstanding"
                    value={`₹${totalCredits.toLocaleString()}`}
                    subtitle="All outlets"
                    icon={<IndianRupee className="h-5 w-5 text-orange-600" />}
                />
                <MetricCard
                    title="MTD Revenue"
                    value={`₹${monthlyRevenue.toLocaleString()}`}
                    subtitle="This month"
                    icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
                />
                <MetricCard
                    title="Anomalies"
                    value={anomaliesCount.toString()}
                    subtitle="Needs review"
                    trend={anomaliesCount > 0 ? 'down' : 'neutral'}
                    icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
                />
            </div>

            {/* Sales Trend */}
            <SalesTrendChart
                data={salesTrendData}
                title="Consolidated Sales Trend (Last 7 Days)"
            />

            {/* Outlet Comparison Table */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Outlet Performance</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outlet</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Today's Revenue</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">MTD Revenue</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credits</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {outlets.map((outlet) => (
                                <tr key={outlet.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{outlet.name}</td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-900">₹--</td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-900">₹--</td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-900">₹--</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
