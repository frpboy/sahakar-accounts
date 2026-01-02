'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { ReportFilters } from '@/components/dashboard/reports/report-filters';
import { createClientBrowser } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';
import { Building2, TrendingUp, BarChart3, Users, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/metrics/metric-card';
import { SalesTrendChart } from '@/components/dashboard/charts/sales-trend-chart';
import { exportUtils } from '@/lib/export-utils';
import { cn } from '@/lib/utils';

export default function OutletPerformancePage() {
    const supabase = createClientBrowser();
    const { user } = useAuth();

    // Filters
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date().toISOString().substring(0, 7) + '-01';

    const [dateRange, setDateRange] = useState({ from: firstDayOfMonth, to: today });
    const [outletId, setOutletId] = useState('all');
    const [outlets, setOutlets] = useState<any[]>([]);

    // Data
    const [performanceData, setPerformanceData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isHO = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Load outlets
            const { data: oData } = await (supabase as any).from('outlets').select('*');
            const activeOutlets = oData || [];
            setOutlets(activeOutlets);

            // 2. Query transactions for all outlets in range
            let query = (supabase as any)
                .from('transactions')
                .select('outlet_id, amount, type, category')
                .eq('type', 'income')
                .eq('category', 'sales')
                .gte('created_at', `${dateRange.from}T00:00:00`)
                .lte('created_at', `${dateRange.to}T23:59:59`);

            if (outletId !== 'all') {
                query = query.eq('outlet_id', outletId);
            } else if (!isHO && user?.profile?.outlet_id) {
                query = query.eq('outlet_id', user.profile.outlet_id);
                setOutletId(user.profile.outlet_id);
            }

            const { data: txs, error } = await query;
            if (error) throw error;

            // 3. Process performance stats
            const stats = activeOutlets.map((outlet: any) => {
                const outletTxs = txs?.filter((t: any) => t.outlet_id === outlet.id) || [];
                const total = outletTxs.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
                return {
                    id: outlet.id,
                    name: outlet.name,
                    totalRevenue: total,
                    count: outletTxs.length,
                    avg: outletTxs.length > 0 ? total / outletTxs.length : 0,
                    type: outlet.type
                };
            }).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

            // If a specific outlet is selected, filter the stats
            if (outletId !== 'all') {
                setPerformanceData(stats.filter((s: any) => s.id === outletId));
            } else {
                setPerformanceData(stats);
            }

        } catch (err) {
            console.error('Error loading performance data:', err);
        } finally {
            setLoading(false);
        }
    }, [dateRange, outletId, isHO, user, supabase]);

    const handleExportExcel = () => {
        const data = performanceData.map((o, idx) => ({
            'Rank': idx + 1,
            'Outlet Name': o.name,
            'Type': o.type,
            'Total Revenue': o.totalRevenue,
            'Transaction Count': o.count,
            'Avg Bill Value': Math.round(o.avg)
        }));

        exportUtils.toExcel(data, {
            filename: `Outlet_Performance_${dateRange.from}_to_${dateRange.to}`,
            title: 'Outlet Performance'
        });
    };

    const handleExportPDF = () => {
        const totalOverall = performanceData.reduce((sum, o) => sum + o.totalRevenue, 0);
        const data = performanceData.map((o, idx) => [
            `#${idx + 1}`,
            o.name,
            o.type,
            `Rs. ${o.totalRevenue.toLocaleString()}`,
            `${totalOverall > 0 ? (o.totalRevenue / totalOverall * 100).toFixed(1) : 0}%`,
            o.count.toString()
        ]);

        exportUtils.toPDF(
            ['Rank', 'Outlet', 'Type', 'Revenue', 'Share %', 'Orders'],
            data,
            {
                filename: `Outlet_Performance_${dateRange.from}_to_${dateRange.to}`,
                title: 'Sahakar Accounts - Outlet Performance',
                subtitle: `Period: ${dateRange.from} to ${dateRange.to} | Total Revenue: Rs. ${totalOverall.toLocaleString()}`
            }
        );
    };

    useEffect(() => {
        if (user) loadData();
    }, [user, loadData]);

    if (!isHO && !loading) {
        return (
            <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
                <TopBar title="Access Denied" />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-2">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">HO Exclusive Report</h2>
                        <p className="text-gray-600 max-w-sm mx-auto">
                            The Outlet Performance comparison report is only accessible to Head Office accounts and Administrators.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
            <TopBar title="Outlet Performance" />

            <main className="p-4 lg:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Performance Comparison</h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Analyze revenue across different locations</p>
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

                <ReportFilters
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    outletId={outletId}
                    setOutletId={setOutletId}
                    isAdmin={isHO}
                    outlets={outlets}
                    onFilter={loadData}
                />

                {/* Performance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {performanceData.map((outlet) => (
                        <div key={outlet.id} className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-5 border-b dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        <span className="font-bold text-gray-900 dark:text-white">{outlet.name}</span>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold uppercase">
                                        {outlet.type}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5 space-y-4 flex-1">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 dark:text-slate-400 uppercase font-bold tracking-wider">Total Revenue</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">₹{outlet.totalRevenue.toLocaleString()}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Invoices</p>
                                        <p className="font-bold text-gray-700 dark:text-slate-300">{outlet.count}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Avg. Bill</p>
                                        <p className="font-bold text-gray-700 dark:text-slate-300">₹{Math.round(outlet.avg).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800/20 border-t dark:border-slate-800">
                                <button
                                    onClick={() => window.location.href = `/dashboard/reports/analytics?outletId=${outlet.id}`}
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors uppercase"
                                >
                                    View Analytics →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Comparison Table */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                        <h3 className="font-bold text-gray-900 dark:text-white">Performance League Table</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 dark:bg-slate-800/30 border-b dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Rank</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Outlet</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Revenue</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Share %</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Efficiency</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {performanceData.map((outlet, idx) => {
                                    const totalRev = performanceData.reduce((sum, o) => sum + o.totalRevenue, 0);
                                    const share = totalRev > 0 ? (outlet.totalRevenue / totalRev * 100).toFixed(1) : 0;

                                    return (
                                        <tr key={outlet.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                                    idx === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                        idx === 1 ? "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300" :
                                                            idx === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                                                "bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 border dark:border-slate-700"
                                                )}>
                                                    #{idx + 1}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{outlet.name}</td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">₹{outlet.totalRevenue.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-sm text-gray-600 dark:text-slate-400">{share}%</span>
                                                    <div className="w-16 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500"
                                                            style={{ width: `${share}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase">
                                                    High
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
