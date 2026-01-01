'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { ReportFilters } from '@/components/dashboard/reports/report-filters';
import { ReportTable } from '@/components/dashboard/reports/report-table';
import { createClientBrowser } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';
import { ShoppingCart, IndianRupee, Download, TrendingUp, Filter, FileSpreadsheet, FileText } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/metrics/metric-card';
import { exportUtils } from '@/lib/export-utils';

export default function SalesReportPage() {
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
        totalRevenue: 0,
        transactionCount: 0,
        avgOrderValue: 0,
        cashTotal: 0,
        upiTotal: 0,
    });

    const isHO = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Load outlets if HO
            if (isHO && outlets.length === 0) {
                const { data: oData } = await (supabase as any).from('outlets').select('*');
                setOutlets(oData || []);
            }

            // 2. Query transactions
            let query = (supabase as any)
                .from('transactions')
                .select('*, users(name), outlets(name)')
                .eq('type', 'income')
                .eq('category', 'sales')
                .gte('created_at', `${dateRange.from}T00:00:00`)
                .lte('created_at', `${dateRange.to}T23:59:59`)
                .order('created_at', { ascending: false });

            // Apply outlet filter
            if (outletId !== 'all') {
                query = query.eq('outlet_id', outletId);
            } else if (!isHO && user?.profile?.outlet_id) {
                query = query.eq('outlet_id', user.profile.outlet_id);
            }

            const { data, error } = await query;
            if (error) throw error;

            const txs = data || [];
            setTransactions(txs);

            // 3. Calculate Stats
            const total = txs.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
            const cash = txs.reduce((sum: number, t: any) => sum + Number(t.cash_amount || 0), 0);
            const upi = txs.reduce((sum: number, t: any) => sum + Number(t.upi_amount || 0), 0);

            setStats({
                totalRevenue: total,
                transactionCount: txs.length,
                avgOrderValue: txs.length > 0 ? total / txs.length : 0,
                cashTotal: cash,
                upiTotal: upi
            });

        } catch (err) {
            console.error('Error loading sales report:', err);
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
            'Time': new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            'Outlet': t.outlets?.name || 'Unknown',
            'Bill No': t.bill_number || '-',
            'Customer': t.customer_name || 'Walk-in',
            'Amount': t.amount,
            'Payment Mode': t.payment_mode,
            'Staff': t.users?.name || 'System'
        }));
    };

    const handleExportExcel = () => {
        exportUtils.toExcel(prepareExportData(), {
            filename: `Sales_Report_${dateRange.from}_to_${dateRange.to}`,
            title: 'Sales Report'
        });
    };

    const handleExportPDF = () => {
        const data = transactions.map(t => [
            new Date(t.created_at).toLocaleDateString(),
            t.outlets?.name || '-',
            t.bill_number || '-',
            t.customer_name || 'Walk-in',
            `Rs. ${Number(t.amount).toLocaleString()}`,
            t.payment_mode,
            t.users?.name || '-'
        ]);

        exportUtils.toPDF(
            ['Date', 'Outlet', 'Bill No', 'Customer', 'Amount', 'Mode', 'Staff'],
            data,
            {
                filename: `Sales_Report_${dateRange.from}_to_${dateRange.to}`,
                title: 'Sahakar Accounts - Sales Report',
                subtitle: `Period: ${dateRange.from} to ${dateRange.to} | Outlet: ${outletId === 'all' ? 'All' : transactions[0]?.outlets?.name || outletId}`
            }
        );
    };

    const columns = [
        {
            header: 'Date & Time',
            accessor: (t: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{new Date(t.created_at).toLocaleDateString()}</span>
                    <span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )
        },
        {
            header: 'Bill / Customer',
            accessor: (t: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-blue-600">{t.bill_number || 'N/A'}</span>
                    <span className="text-xs text-gray-600">{t.customer_name || 'Walk-in'}</span>
                </div>
            )
        },
        {
            header: 'Outlet',
            accessor: (t: any) => t.outlets?.name || 'Unknown',
            className: isHO ? '' : 'hidden'
        },
        {
            header: 'Amount',
            accessor: (t: any) => (
                <div className="flex flex-col items-end">
                    <span className="font-bold text-gray-900">₹{Number(t.amount).toLocaleString()}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 mt-1">
                        {t.payment_mode}
                    </span>
                </div>
            ),
            className: 'text-right'
        },
        {
            header: 'Staff',
            accessor: (t: any) => t.users?.name || 'System'
        }
    ];

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
            <TopBar title="Sales Report" />

            <main className="p-4 lg:p-6 space-y-6">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Sales"
                        value={`₹${stats.totalRevenue.toLocaleString()}`}
                        icon={<IndianRupee className="w-5 h-5 text-green-600" />}
                        subtitle={`${stats.transactionCount} transactions`}
                    />
                    <MetricCard
                        title="Avg. Bill Value"
                        value={`₹${Math.round(stats.avgOrderValue).toLocaleString()}`}
                        icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
                    />
                    <MetricCard
                        title="Cash Collected"
                        value={`₹${stats.cashTotal.toLocaleString()}`}
                        icon={<IndianRupee className="w-5 h-5 text-green-500" />}
                    />
                    <MetricCard
                        title="UPI Collected"
                        value={`₹${stats.upiTotal.toLocaleString()}`}
                        icon={<IndianRupee className="w-5 h-5 text-purple-600" />}
                    />
                </div>

                {/* Filters */}
                <ReportFilters
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    outletId={outletId}
                    setOutletId={setOutletId}
                    isAdmin={isHO}
                    outlets={outlets}
                    onFilter={loadData}
                />

                {/* Report Table */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-blue-600" />
                            Transaction Details
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-all shadow-sm"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Excel
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-all shadow-sm"
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
                        emptyMessage="No sales found for the selected period."
                    />
                </div>
            </main>
        </div>
    );
}
