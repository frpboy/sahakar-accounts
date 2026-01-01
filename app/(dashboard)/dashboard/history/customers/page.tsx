'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Search, Eye, User, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

export default function CustomerHistoryPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadHistory() {
            if (!user?.profile?.outlet_id) return;
            setLoading(true);
            try {
                const { data, error } = await (supabase as any)
                    .from('customers')
                    .select('*')
                    .eq('outlet_id', user.profile.outlet_id)
                    .order('created_at', { ascending: false })
                    .limit(200);

                if (error) throw error;
                setCustomers(data || []);
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
        return customers.filter(c =>
            (c.name?.toLowerCase() || '').includes(q) ||
            (c.phone?.toLowerCase() || '').includes(q) ||
            (c.internal_customer_id?.toLowerCase() || '').includes(q) ||
            (c.customer_code?.toLowerCase() || '').includes(q)
        );
    }, [customers, search]);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <TopBar title="Customer History / Registry" />

            <div className="p-6 space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by ID, Name, or Phone..."
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
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Join Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Professional ID</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Customer Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Balance</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">Loading customer registry...</td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">No customers found</td>
                                    </tr>
                                ) : (
                                    filtered.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(c.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900">
                                                {c.internal_customer_id || c.customer_code || '---'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {c.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {c.phone || 'No Phone'}
                                                {c.email && <div className="text-[10px] text-gray-400">{c.email}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-900">
                                                ₹{parseFloat(c.outstanding_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                                    c.is_active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                                                )}>
                                                    {c.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button title="View Full Profile" className="text-gray-400 hover:text-blue-600 transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
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
