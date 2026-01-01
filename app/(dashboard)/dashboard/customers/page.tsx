'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Plus, X, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';

export default function CustomersPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<Array<{ id: string; name: string; phone?: string | null; created_at?: string | null }>>([]);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [referredBy, setReferredBy] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let mounted = true;
        async function load() {
            if (!user) return;
            setLoading(true);
            setError(null);
            try {
                let query = (supabase as any)
                    .from('customers')
                    .select('id,name,phone,created_at,outlet_id,referred_by')
                    .order('created_at', { ascending: false });

                const role = user.profile.role;
                if (role === 'outlet_manager' && user.profile.outlet_id) {
                    query = query.eq('outlet_id', user.profile.outlet_id);
                } else if (role === 'outlet_staff') {
                    query = query.eq('referred_by', user.id);
                }

                const { data, error } = await query.limit(200);
                if (error) throw error;
                if (!mounted) return;
                setRows((data || []).map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    phone: c.phone,
                    created_at: c.created_at,
                })));
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.message || 'Failed to load customers');
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [supabase, user]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(r =>
            r.name?.toLowerCase().includes(q) ||
            (r.phone || '').toLowerCase().includes(q)
        );
    }, [rows, search]);

    const handleAddCustomer = async () => {
        if (!customerName.trim()) {
            alert('Please enter customer name');
            return;
        }
        if (!customerPhone.trim()) {
            alert('Please enter phone number');
            return;
        }
        if (!user?.profile?.outlet_id) {
            alert('No outlet assigned to your account');
            return;
        }

        setSubmitting(true);
        try {
            const { data, error } = await (supabase as any)
                .from('customers')
                .insert({
                    name: customerName.trim(),
                    phone: customerPhone.trim(),
                    referred_by: referredBy.trim() || null,
                    outlet_id: user.profile.outlet_id,
                    created_by: user.id
                })
                .select()
                .single();

            if (error) throw error;

            // Add to local state
            setRows(prev => [{
                id: data.id,
                name: data.name,
                phone: data.phone,
                created_at: data.created_at
            }, ...prev]);

            // Reset form
            setCustomerName('');
            setCustomerPhone('');
            setReferredBy('');
            setIsModalOpen(false);
        } catch (e: any) {
            alert(e?.message || 'Failed to add customer');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <TopBar title="Customers" />
            <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Customer
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden border">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Phone
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                                        Loading customers...
                                    </td>
                                </tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                                        {error || 'No customers found'}
                                    </td>
                                </tr>
                            )}
                            {!loading && filtered.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {customer.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {customer.phone || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN') : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Add New Customer</h3>
                                <p className="text-sm text-gray-500">Enter customer details to add to the system</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter full name"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="10-digit phone number"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Referred By
                                </label>
                                <input
                                    type="text"
                                    placeholder="Staff name"
                                    value={referredBy}
                                    onChange={(e) => setReferredBy(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                disabled={submitting}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCustomer}
                                disabled={submitting}
                                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 font-medium disabled:opacity-50"
                            >
                                {submitting ? 'Adding...' : 'Add Customer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
