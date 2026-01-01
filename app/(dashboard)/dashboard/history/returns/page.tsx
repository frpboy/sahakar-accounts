'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Search, Filter, Eye, Edit2, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

export default function ReturnsHistoryPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [transactions, setTransactions] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadHistory() {
            if (!user?.profile?.outlet_id) return;
            setLoading(true);
            try {
                const { data, error } = await (supabase as any)
                    .from('transactions')
                    .select(`
                        id,
                        created_at,
                        internal_entry_id,
                        entry_number,
                        amount,
                        payment_modes,
                        category,
                        description,
                        status,
                        daily_records(status)
                    `)
                    .eq('outlet_id', user.profile.outlet_id)
                    .eq('category', 'returns')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) throw error;
                setTransactions(data || []);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        loadHistory();
    }, [supabase, user]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return transactions.filter(t =>
            (t.internal_entry_id?.toLowerCase() || '').includes(q) ||
            (t.entry_number?.toLowerCase() || '').includes(q) ||
            (t.description?.toLowerCase() || '').includes(q) ||
            (t.customer_phone?.toLowerCase() || '').includes(q)
        );
    }, [transactions, search]);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <TopBar title="Sales Returns History" />

            <div className="p-6 space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by Sahakar ID (e.g. HP-TVL-...), Return ID, or Customer..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Internal ID</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Return No</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Details</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Amount</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">Loading returns history...</td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">No transactions found</td>
                                    </tr>
                                ) : (
                                    filtered.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(t.created_at).toLocaleDateString()}
                                                <div className="text-[10px] text-gray-400">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900">
                                                {t.internal_entry_id || '---'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {t.entry_number || '---'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div className="font-medium">{t.description}</div>
                                                <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{t.payment_modes}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-900 text-red-600">
                                                ₹{parseFloat(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                                    t.daily_records?.status === 'locked' ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                                                )}>
                                                    {t.daily_records?.status === 'locked' ? 'Locked' : 'Editable'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex gap-3">
                                                    <button title="View" className="text-gray-400 hover:text-blue-600 transition-colors">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
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
