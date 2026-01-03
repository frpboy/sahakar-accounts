'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { MetricCard } from '@/components/dashboard/metrics/metric-card';
import { SalesTrendChart } from '@/components/dashboard/charts/sales-trend-chart';
import { Building2, IndianRupee, AlertTriangle, TrendingUp, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportUtils } from '@/lib/export-utils';
import { cn } from '@/lib/utils';

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
                .eq('payment_modes', 'Credit' as any);

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

            // Get today's daily records for all outlets
            const { data: dailyData } = await supabase
                .from('daily_records')
                .select('outlet_id, opening_cash, opening_upi, total_income, total_expense, physical_cash, physical_upi, tally_comment, status')
                .eq('date', today);

            // Merge outlet data with their today's record
            const mergedOutlets = outletsData?.map(o => {
                const record = (dailyData as any[])?.find(r => r.outlet_id === o.id);
                const expected = record ? (Number(record.opening_cash) || 0) + (Number(record.opening_upi) || 0) + (Number(record.total_income) || 0) - (Number(record.total_expense) || 0) : 0;
                const physical = record ? (Number(record.physical_cash) || 0) + (Number(record.physical_upi) || 0) : 0;
                return {
                    ...o,
                    todayRecord: record,
                    expected,
                    physical,
                    difference: physical - expected
                };
            }) || [];
            setOutlets(mergedOutlets);

        } catch (error) {
            console.error('Error loading HO data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        const data = outlets.map(o => ({
            'Outlet Name': o.name,
            'Location': o.location || '-',
            'Status': 'Active'
        }));

        exportUtils.toExcel(data, {
            filename: `Consolidated_Report_${new Date().toISOString().split('T')[0]}`,
            title: 'HO Consolidated Report'
        });
    };

    const handleExportPDF = () => {
        const data = outlets.map(o => [
            o.name,
            'Rs. 0', // Placeholder as not fully loaded in this view's table
            'Rs. 0',
            'Active'
        ]);

        exportUtils.toPDF(
            ['Outlet', 'Today Rev', 'MTD Rev', 'Status'],
            data,
            {
                filename: `HO_Consolidated_${new Date().toISOString().split('T')[0]}`,
                title: 'Sahakar Accounts - HO Consolidated Report',
                subtitle: `Period: ${new Date().toLocaleDateString()} | Total Revenue: Rs. ${totalRevenue.toLocaleString()}`
            }
        );
    };

    if (loading) {
        return <div className="p-6 text-center dark:text-slate-400">Loading HO Dashboard...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HO Accountant Dashboard</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Consolidated view across all outlets</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/10 transition-all shadow-sm"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-all shadow-sm"
                    >
                        <FileText className="w-4 h-4" />
                        PDF
                    </button>
                </div>
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
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border dark:border-slate-800 p-6 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Outlet Performance</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Outlet</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Expected Balance</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Physical Tally</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Difference</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Comments</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                            {outlets.map((outlet) => (
                                <tr key={outlet.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                        {outlet.name}
                                        <p className="text-[10px] text-gray-400 font-normal">{outlet.location}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-slate-300">₹{outlet.expected.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-right font-bold text-gray-900 dark:text-white">₹{outlet.physical.toLocaleString()}</td>
                                    <td className={cn(
                                        "px-6 py-4 text-sm text-right font-black",
                                        Math.abs(outlet.difference) < 0.01 ? "text-green-500" : "text-red-500"
                                    )}>
                                        {outlet.difference > 0 ? '+' : ''}{outlet.difference.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-slate-400 max-w-xs truncate italic">
                                        {outlet.todayRecord?.tally_comment || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={cn(
                                            "px-2 py-0.5 text-[10px] font-bold uppercase rounded-full",
                                            outlet.todayRecord?.status === 'locked' ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" :
                                                outlet.todayRecord?.status === 'submitted' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" :
                                                    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                        )}>
                                            {outlet.todayRecord?.status || 'open'}
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
