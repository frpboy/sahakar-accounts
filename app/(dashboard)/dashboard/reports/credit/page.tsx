'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { useQuery } from '@tanstack/react-query';
import { Download, AlertTriangle, Phone, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CreditReportPage() {
    const supabase = createClientBrowser();
    const { user } = useAuth();
    const isAdmin = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'warning' | 'critical'>('all');

    // Fetch customers with outstanding balance
    const { data: customers, isLoading } = useQuery({
        queryKey: ['credit-report', user?.profile?.outlet_id],
        queryFn: async () => {
            let query = (supabase as any)
                .from('customers')
                .select('*')
                .gt('outstanding_balance', 0);

            // For managers, filter by outlet
            if (!isAdmin && user?.profile?.outlet_id) {
                // Join with profiles to get added_by user's outlet
                const { data, error } = await (supabase as any)
                    .from('customers')
                    .select(`
                        *,
                        profiles!customers_added_by_fkey(outlet_id)
                    `)
                    .gt('outstanding_balance', 0);

                if (error) throw error;
                return (data || []).filter((c: any) => c.profiles?.outlet_id === user.profile.outlet_id);
            }

            const { data, error } = await query.order('outstanding_balance', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: !!user
    });

    // Calculate utilization and status
    const enrichedCustomers = customers?.map(c => {
        const utilization = c.credit_limit > 0 ? (c.outstanding_balance / c.credit_limit) * 100 : 0;
        let status: 'safe' | 'warning' | 'critical' = 'safe';
        if (utilization >= 100) status = 'critical';
        else if (utilization >= 80) status = 'warning';

        return { ...c, utilization, status };
    }) || [];

    // Filter customers
    const filteredCustomers = enrichedCustomers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Summary stats
    const totalOutstanding = enrichedCustomers.reduce((sum, c) => sum + c.outstanding_balance, 0);
    const criticalCount = enrichedCustomers.filter(c => c.status === 'critical').length;
    const warningCount = enrichedCustomers.filter(c => c.status === 'warning').length;

    const handleExport = (format: 'excel' | 'pdf') => {
        const data = filteredCustomers.map(c => ({
            Name: c.name,
            Phone: c.phone,
            OutstandingBalance: c.outstanding_balance,
            CreditLimit: c.credit_limit,
            Utilization: `${c.utilization.toFixed(1)}%`,
            Status: c.status.toUpperCase()
        }));

        const today = new Date().toISOString().split('T')[0];

        if (format === 'excel') {
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Credit Report');
            XLSX.writeFile(wb, `Credit_Report_${today}.xlsx`);
        } else {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text('Credit Report - Outstanding Balances', 14, 20);
            doc.setFontSize(10);
            doc.text(`Date: ${today}`, 14, 28);
            doc.text(`Total Outstanding: ₹${totalOutstanding.toLocaleString('en-IN')}`, 14, 34);

            autoTable(doc, {
                startY: 40,
                head: [['Customer', 'Phone', 'Outstanding', 'Limit', 'Utilization', 'Status']],
                body: data.map(c => [
                    c.Name,
                    c.Phone,
                    `₹${c.OutstandingBalance.toLocaleString('en-IN')}`,
                    `₹${c.CreditLimit.toLocaleString('en-IN')}`,
                    c.Utilization,
                    c.Status
                ]),
            });

            doc.save(`Credit_Report_${today}.pdf`);
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'critical') {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    🔴 Critical
                </span>
            );
        } else if (status === 'warning') {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    🟡 Warning
                </span>
            );
        }
        return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                🟢 Safe
            </span>
        );
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <TopBar title="Credit Report" />

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Outstanding</div>
                            <div className="text-2xl font-bold mt-2">₹{totalOutstanding.toLocaleString('en-IN')}</div>
                            <div className="text-sm text-gray-500 mt-1">{enrichedCustomers.length} customers</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-red-200 dark:border-red-900/50">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Critical ({'>'}100%)</div>
                            <div className="text-2xl font-bold mt-2 text-red-600">{criticalCount}</div>
                            <div className="text-sm text-red-500 mt-1">Limit exceeded</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-orange-200 dark:border-orange-900/50">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Warning (80-100%)</div>
                            <div className="text-2xl font-bold mt-2 text-orange-600">{warningCount}</div>
                            <div className="text-sm text-orange-500 mt-1">Approaching limit</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-green-200 dark:border-green-900/50">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Safe ({'<'}80%)</div>
                            <div className="text-2xl font-bold mt-2 text-green-600">
                                {enrichedCustomers.length - criticalCount - warningCount}
                            </div>
                            <div className="text-sm text-green-500 mt-1">Under control</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium mb-2">Search Customer</label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Name or phone..."
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                            <div className="min-w-[150px]">
                                <label className="block text-sm font-medium mb-2">Status Filter</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as any)}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                >
                                    <option value="all">All Status</option>
                                    <option value="critical">Critical</option>
                                    <option value="warning">Warning</option>
                                    <option value="safe">Safe</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleExport('excel')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Excel
                                </button>
                                <button
                                    onClick={() => handleExport('pdf')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800 border-b dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phone</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Outstanding</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Credit Limit</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Utilization</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                                        </tr>
                                    ) : filteredCustomers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                                No customers with outstanding credit found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCustomers.map(c => (
                                            <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                                <td className="px-6 py-4 whitespace-nowrap font-medium">{c.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm flex items-center gap-2">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    {c.phone}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                                                    ₹{c.outstanding_balance.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500">
                                                    ₹{c.credit_limit.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className={`font-medium ${c.utilization >= 100 ? 'text-red-600' :
                                                        c.utilization >= 80 ? 'text-orange-600' :
                                                            'text-green-600'
                                                        }`}>
                                                        {c.utilization.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {getStatusBadge(c.status)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
