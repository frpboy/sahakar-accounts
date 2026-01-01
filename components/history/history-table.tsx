'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, Edit2, Calendar, Lock, Unlock, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { TransactionDrawer } from './transaction-drawer';

interface HistoryTableProps {
    title: string;
    data: any[];
    loading?: boolean;
    searchTerm?: string;
    onSearchChange?: (val: string) => void;
    onViewRow?: (row: any) => void;
    onEditRow?: (row: any) => void;
    emptyMessage?: string;
    category?: 'sales' | 'returns' | 'purchase' | 'credit';
}

export function HistoryTable({
    title,
    data,
    loading = false,
    searchTerm = '',
    onSearchChange,
    onViewRow,
    onEditRow,
    emptyMessage = 'No transactions found',
    category = 'sales'
}: HistoryTableProps) {
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: '',
        end: ''
    });
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleViewDetails = (row: any) => {
        setSelectedRow(row);
        setIsDrawerOpen(true);
        onViewRow?.(row);
    };

    // Deep filtering logic
    const filteredData = useMemo(() => {
        let result = data;

        // Search filter
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            result = result.filter(t =>
                (t.internal_entry_id?.toLowerCase() || '').includes(q) ||
                (t.entry_number?.toLowerCase() || '').includes(q) ||
                (t.description?.toLowerCase() || '').includes(q) ||
                (t.customer_phone?.toLowerCase() || '').includes(q)
            );
        }

        // Date range filter
        if (dateRange.start) {
            result = result.filter(t => new Date(t.created_at) >= new Date(dateRange.start));
        }
        if (dateRange.end) {
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59, 999);
            result = result.filter(t => new Date(t.created_at) <= end);
        }

        return result;
    }, [data, searchTerm, dateRange]);

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm transition-colors">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search IDs, Bills, Customers..."
                        className="w-full pl-10 pr-4 py-2 border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 dark:bg-slate-950 dark:text-white transition-colors"
                        value={searchTerm}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border dark:border-slate-800 text-sm transition-colors">
                        <Calendar className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                        <input
                            type="date"
                            className="bg-transparent border-none focus:ring-0 text-xs p-0 text-gray-900 dark:text-slate-200 dark:[color-scheme:dark]"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                        <span className="text-gray-300 dark:text-slate-600">to</span>
                        <input
                            type="date"
                            className="bg-transparent border-none focus:ring-0 text-xs p-0 text-gray-900 dark:text-slate-200 dark:[color-scheme:dark]"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                        {(dateRange.start || dateRange.end) && (
                            <button
                                onClick={() => setDateRange({ start: '', end: '' })}
                                className="ml-1 text-red-500 hover:text-red-700 font-bold"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            const headers = ['Date', 'Internal ID', 'Reference', 'Description', 'Amount', 'Payment Mode', 'Status'];
                            const csvData = filteredData.map(t => [
                                format(new Date(t.created_at), 'yyyy-MM-dd HH:mm'),
                                t.internal_entry_id,
                                t.entry_number,
                                t.description?.replace(/,/g, ';'),
                                t.amount,
                                t.payment_modes?.replace(/,/g, ';'),
                                t.daily_records?.status || 'open'
                            ]);

                            const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement("a");
                            const url = URL.createObjectURL(blob);
                            link.setAttribute("href", url);
                            link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-blue-500 transition-colors shadow-sm active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-950 border-b dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Internal ID</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Reference</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Amount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-4"><div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Filter className="w-8 h-8 opacity-20" />
                                            <p>{emptyMessage}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((t) => (
                                    <tr
                                        key={t.id}
                                        className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                        onClick={() => handleViewDetails(t)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                                            <div className="font-medium text-gray-900 dark:text-white">{format(new Date(t.created_at), 'dd MMM yyyy')}</div>
                                            <div className="text-[10px] text-gray-400 dark:text-slate-500">{format(new Date(t.created_at), 'hh:mm a')}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-mono font-bold text-gray-900 dark:text-slate-200 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded border border-gray-100 dark:border-slate-700">
                                                {t.internal_entry_id || '---'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-300">
                                            {t.entry_number || '---'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                                            <div className="font-medium line-clamp-1">{t.description}</div>
                                            <div className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-tighter flex items-center gap-2">
                                                {t.payment_modes?.split(',').map((m: string) => (
                                                    <span key={m} className="bg-gray-100 dark:bg-slate-800 px-1 rounded border dark:border-slate-700">{m}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-900 dark:text-white">
                                            ₹{parseFloat(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {t.daily_records?.status === 'locked' ? (
                                                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase border border-red-100 dark:border-red-900/30">
                                                        <Lock className="w-3 h-3" /> Locked
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase border border-green-100 dark:border-green-900/30">
                                                        <Unlock className="w-3 h-3" /> Open
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleViewDetails(t); }}
                                                    title="View Details"
                                                    className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {t.daily_records?.status !== 'locked' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onEditRow?.(t); }}
                                                        title="Edit Entry"
                                                        className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Placeholder */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-slate-950 border-t dark:border-slate-800 flex items-center justify-between transition-colors">
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                        Showing <span className="font-bold text-gray-700 dark:text-slate-300">{filteredData.length}</span> entries
                    </p>
                    <div className="flex gap-2">
                        <button disabled className="p-1 border dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-gray-300 dark:text-slate-700 cursor-not-allowed">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button disabled className="p-1 border dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-gray-300 dark:text-slate-700 cursor-not-allowed">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <TransactionDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                transaction={selectedRow}
            />
        </div>
    );
}
