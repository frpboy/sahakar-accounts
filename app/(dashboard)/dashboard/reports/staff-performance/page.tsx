'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, Award } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function StaffPerformancePage() {
    const supabase = createClientBrowser();
    const { user } = useAuth();
    const isAdmin = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');

    const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

    // Fetch staff performance data
    const { data: staffData, isLoading } = useQuery({
        queryKey: ['staff-performance', dateFrom, dateTo, user?.profile?.outlet_id],
        queryFn: async () => {
            // Get all staff in the outlet(s)
            let staffQuery = (supabase as any)
                .from('profiles')
                .select('id, full_name, role, outlet_id, outlets(name)');

            if (!isAdmin && user?.profile?.outlet_id) {
                staffQuery = staffQuery.eq('outlet_id', user.profile.outlet_id);
            }

            const { data: staff, error: staffError } = await staffQuery;
            if (staffError) throw staffError;

            // Get transactions for each staff member
            const staffPerformance = await Promise.all(
                (staff || []).map(async (s: any) => {
                    let txQuery = (supabase as any)
                        .from('transactions')
                        .select('amount, type')
                        .eq('created_by', s.id)
                        .gte('created_at', dateFrom)
                        .lte('created_at', dateTo);

                    const { data: transactions } = await txQuery;

                    const totalTransactions = transactions?.length || 0;
                    const totalRevenue = transactions?.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
                    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

                    return {
                        ...s,
                        totalTransactions,
                        totalRevenue,
                        avgTransaction
                    };
                })
            );

            return staffPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue);
        },
        enabled: !!user
    });

    const handleExport = (format: 'excel' | 'pdf') => {
        const data = staffData?.map((s, idx) => ({
            Rank: idx + 1,
            Name: s.full_name,
            Role: s.role,
            Outlet: s.outlets?.name || 'Unknown',
            Transactions: s.totalTransactions,
            TotalRevenue: s.totalRevenue,
            AvgTransaction: s.avgTransaction
        })) || [];

        if (format === 'excel') {
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Staff Performance');
            XLSX.writeFile(wb, `Staff_Performance_${dateFrom}_${dateTo}.xlsx`);
        } else {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text('Staff Performance Report', 14, 20);
            doc.setFontSize(10);
            doc.text(`Period: ${dateFrom} to ${dateTo}`, 14, 28);

            autoTable(doc, {
                startY: 35,
                head: [['Rank', 'Name', 'Role', 'Transactions', 'Revenue', 'Avg']],
                body: data.map(s => [
                    s.Rank,
                    s.Name,
                    s.Role,
                    s.Transactions,
                    `₹${s.TotalRevenue.toLocaleString('en-IN')}`,
                    `₹${s.AvgTransaction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                ]),
            });

            doc.save(`Staff_Performance_${dateFrom}_${dateTo}.pdf`);
        }
    };

    const topPerformer = staffData?.[0];

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <TopBar title="Staff Performance" />

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Staff</div>
                            <div className="text-2xl font-bold mt-2">{staffData?.length || 0}</div>
                            <div className="text-sm text-gray-500 mt-1">Active members</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-blue-200 dark:border-blue-900/50">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</div>
                            <div className="text-2xl font-bold mt-2 text-blue-600">
                                {staffData?.reduce((sum, s) => sum + s.totalTransactions, 0) || 0}
                            </div>
                            <div className="text-sm text-blue-500 mt-1">Combined output</div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-6 shadow-sm border border-yellow-200 dark:border-yellow-900/50">
                            <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                                <Award className="w-4 h-4" />
                                Top Performer
                            </div>
                            <div className="text-xl font-bold mt-2">{topPerformer?.full_name || '-'}</div>
                            <div className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                                ₹{(topPerformer?.totalRevenue || 0).toLocaleString('en-IN')} revenue
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium mb-2">From Date</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium mb-2">To Date</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                />
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
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rank</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Staff Member</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                                        {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Outlet</th>}
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Transactions</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Revenue</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg Transaction</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={isAdmin ? 7 : 6} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                                        </tr>
                                    ) : staffData?.length === 0 ? (
                                        <tr>
                                            <td colSpan={isAdmin ? 7 : 6} className="px-6 py-8 text-center text-gray-400">
                                                No staff data found for this period
                                            </td>
                                        </tr>
                                    ) : (
                                        staffData?.map((staff, idx) => (
                                            <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {idx === 0 && <Award className="w-5 h-5 text-yellow-500 inline" />}
                                                    {idx > 0 && <span className="font-medium text-gray-500">#{idx + 1}</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-medium">{staff.full_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                                                    {staff.role?.replace('_', ' ')}
                                                </td>
                                                {isAdmin && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {staff.outlets?.name || '-'}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {staff.totalTransactions}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-green-600">
                                                    ₹{staff.totalRevenue.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-blue-600">
                                                    ₹{staff.avgTransaction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
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
