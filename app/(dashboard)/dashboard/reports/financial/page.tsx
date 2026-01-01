'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TopBar } from '@/components/layout/topbar';
import { ReportFilters } from '@/components/dashboard/reports/report-filters';
import { ReportTable } from '@/components/dashboard/reports/report-table';
import { createClientBrowser } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';
import { IndianRupee, PieChart, TrendingDown, TrendingUp, Filter, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/metrics/metric-card';
import { exportUtils } from '@/lib/export-utils';

export default function FinancialReportPage() {
    const supabase = createClientBrowser();
    const { user } = useAuth();

    // Filters
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date().toISOString().substring(0, 7) + '-01';

    const [dateRange, setDateRange] = useState({ from: firstDayOfMonth, to: today });
    const [outletId, setOutletId] = useState('all');
    const [outlets, setOutlets] = useState<any[]>([]);

    // Data
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0,
        cashInHand: 0,
    });

    const isHO = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (isHO && outlets.length === 0) {
                const { data: oData } = await (supabase as any).from('outlets').select('*');
                setOutlets(oData || []);
            }

            let query = (supabase as any)
                .from('transactions')
                .select('*, outlets(name)')
                .gte('created_at', `${dateRange.from}T00:00:00`)
                .lte('created_at', `${dateRange.to}T23:59:59`)
                .order('created_at', { ascending: false });

            if (outletId !== 'all') {
                query = query.eq('outlet_id', outletId);
            } else if (!isHO && user?.profile?.outlet_id) {
                query = query.eq('outlet_id', user.profile.outlet_id);
            }

            const { data, error } = await query;
            if (error) throw error;

            const txs = data || [];
            setTransactions(txs);

            // Calculate Stats
            const income = txs.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + Number(t.amount), 0);
            const expense = txs.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + Number(t.amount), 0);
            const cash = txs.reduce((sum: number, t: any) => {
                const amt = Number(t.cash_amount || 0);
                return t.type === 'income' ? sum + amt : sum - amt;
            }, 0);

            setStats({
                totalIncome: income,
                totalExpense: expense,
                netProfit: income - expense,
                cashInHand: cash
            });

        } catch (err) {
            console.error('Error loading financial report:', err);
        } finally {
            setLoading(false);
        }
    }, [dateRange, outletId, isHO, user, supabase, outlets.length]);

    useEffect(() => {
        if (user) loadData();
    }, [user, loadData]);

    const prepareExportData = () => {
        return transactions.map(t => ({
            'Date': new Date(t.created_at).toLocaleDateString(),
            'Outlet': t.outlets?.name || 'Unknown',
            'Type': t.type,
            'Category': t.category,
            'Description': t.description || '-',
            'Amount': t.amount,
            'Payment Mode': t.payment_mode
        }));
    };

    const handleExportExcel = () => {
        exportUtils.toExcel(prepareExportData(), {
            filename: `Financial_Report_${dateRange.from}_to_${dateRange.to}`,
            title: 'Financial Report'
        });
    };

    const handleExportPDF = () => {
        const data = transactions.map(t => [
            new Date(t.created_at).toLocaleDateString(),
            t.outlets?.name || '-',
            t.type,
            t.category?.replace('_', ' '),
            `Rs. ${Number(t.amount).toLocaleString()}`,
            t.payment_mode
        ]);

        exportUtils.toPDF(
            ['Date', 'Outlet', 'Type', 'Category', 'Amount', 'Mode'],
            data,
            {
                filename: `Financial_Report_${dateRange.from}_to_${dateRange.to}`,
                title: 'Sahakar Accounts - Financial Report',
                subtitle: `Period: ${dateRange.from} to ${dateRange.to} | User: ${user?.profile?.name}`
            }
        );
    };

    const columns = [
        {
            header: 'Date',
            accessor: (t: any) => new Date(t.created_at).toLocaleDateString()
        },
        {
            header: 'Category / Desc',
            accessor: (t: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 capitalize">{t.category?.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-500 truncate max-w-[200px]">{t.description || '-'}</span>
                </div>
            )
        },
        {
            header: 'Type',
            accessor: (t: any) => (
                <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-tight",
                    t.type === 'income'
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                )}>
                    {t.type}
                </span>
            )
        },
        {
            header: 'Amount',
            accessor: (t: any) => (
                <span className={cn(
                    "font-bold",
                    t.type === 'income' ? "text-green-600" : "text-red-600"
                )}>
                    {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString()}
                </span>
            ),
            className: 'text-right'
        },
        {
            header: 'Outlet',
            accessor: (t: any) => t.outlets?.name || 'Unknown',
            className: isHO ? '' : 'hidden'
        }
    ];

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
            <TopBar title="Financial Report" />

            <main className="p-4 lg:p-6 space-y-6">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Income"
                        value={`₹${stats.totalIncome.toLocaleString()}`}
                        icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                        subtitle={`${transactions.filter(t => t.type === 'income').length} entries`}
                    />
                    <MetricCard
                        title="Total Expense"
                        value={`₹${stats.totalExpense.toLocaleString()}`}
                        icon={<TrendingDown className="w-5 h-5 text-red-600" />}
                        subtitle={`${transactions.filter(t => t.type === 'expense').length} entries`}
                    />
                    <MetricCard
                        title="Net Difference"
                        value={`₹${stats.netProfit.toLocaleString()}`}
                        icon={<IndianRupee className={cn("w-5 h-5", stats.netProfit >= 0 ? "text-blue-600" : "text-orange-600")} />}
                        subtitle="Income minus Expense"
                    />
                    <MetricCard
                        title="Estimated Cash"
                        value={`₹${stats.cashInHand.toLocaleString()}`}
                        icon={<IndianRupee className="w-5 h-5 text-amber-600" />}
                        subtitle="Net cash change"
                    />
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

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-blue-600" />
                            Financial Ledger
                        </h2>
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

                    <ReportTable
                        columns={columns}
                        data={transactions}
                        loading={loading}
                        emptyMessage="No financial records found."
                    />
                </div>
            </main>
        </div>
    );
}
