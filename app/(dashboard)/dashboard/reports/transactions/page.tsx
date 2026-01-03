'use client';

import React, { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { useQuery } from '@tanstack/react-query';
import { Download, Filter, Search, BarChart3 } from 'lucide-react';

export default function TransactionReportPage() {
    const supabase = createClientBrowser();
    const { user } = useAuth();

    const isAdmin = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');

    // Filters
    const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [txType, setTxType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Transactions
    const { data: transactions, isLoading } = useQuery({
        queryKey: ['transactions-report', dateFrom, dateTo, txType],
        queryFn: async () => {

            let query: any = supabase
                .from('transactions')
                .select('*, outlet:outlets(name), created_by_user:users(full_name)')
                .gte('created_at', `${dateFrom}T00:00:00`)
                .lte('created_at', `${dateTo}T23:59:59`)
                .order('created_at', { ascending: false });

            // Apply account restrictions
            if (!isAdmin && user?.profile?.outlet_id) {
                query = query.eq('outlet_id', user.profile.outlet_id);
            }

            if (txType !== 'all') {
                query = query.eq('type', txType);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
    });

    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        if (!searchTerm) return transactions;
        return (transactions as any[]).filter(t =>
            t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.entry_number?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [transactions, searchTerm]);

    const totalIncome = (filteredTransactions as any[]).filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpense = (filteredTransactions as any[]).filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <TopBar title="Transaction Report" />

            <div className="p-6 max-w-7xl mx-auto w-full space-y-6">

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">From Model</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                        <select
                            value={txType}
                            onChange={e => setTxType(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2 text-sm w-32"
                        >
                            <option value="all">All</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search description, bill number..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm">
                        <div className="text-sm text-gray-500 mb-1">Total Transactions</div>
                        <div className="text-2xl font-bold">{filteredTransactions.length}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm">
                        <div className="text-sm text-gray-500 mb-1">Total Income</div>
                        <div className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm">
                        <div className="text-sm text-gray-500 mb-1">Total Expense</div>
                        <div className="text-2xl font-bold text-red-600">₹{totalExpense.toLocaleString()}</div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Ref ID</th>
                                    <th className="px-6 py-4">Description</th>
                                    {isAdmin && <th className="px-6 py-4">Outlet</th>}
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Mode</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading data...</td>
                                    </tr>
                                ) : filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No transactions found matching filters.</td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-gray-900 dark:text-white font-medium">{new Date(tx.created_at).toLocaleDateString()}</div>
                                                <div className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">{tx.entry_number || '-'}</td>
                                            <td className="px-6 py-4 max-w-xs truncate" title={tx.description}>
                                                {tx.description}
                                            </td>
                                            {isAdmin && <td className="px-6 py-4 text-gray-500">{tx.outlet?.name || 'N/A'}</td>}
                                            <td className="px-6 py-4">
                                                <span className="capitalize px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
                                                    {(tx.category || 'general').replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">{tx.payment_modes || '-'}</td>
                                            <td className={`px-6 py-4 text-right font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {tx.type === 'income' ? '+' : '-'}₹{tx.amount?.toLocaleString()}
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
    );
}
