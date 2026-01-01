'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Plus, X, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { generateCustomerId } from '@/lib/customer-id-generator';

export default function CustomersPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<Array<{ id: string; name: string; phone?: string | null; customer_code?: string | null; internal_customer_id?: string | null; created_at?: string | null }>>([]);
    const [error, setError] = useState<string | null>(null);
    const [idPrefix, setIdPrefix] = useState('HP-TVL-C');

    // Form state
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [creditLimit, setCreditLimit] = useState('10000');
    const [outstandingBalance, setOutstandingBalance] = useState('0');
    const [isActive, setIsActive] = useState(true);
    const [referredBy, setReferredBy] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [staffList, setStaffList] = useState<Array<{ id: string; name: string }>>([]);
    const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

    useEffect(() => {
        let mounted = true;
        async function load() {
            if (!user) return;
            setLoading(true);
            setError(null);
            try {
                let query = (supabase as any)
                    .from('customers')
                    .select('id,name,phone,created_at,outlet_id,referred_by,customer_code,internal_customer_id,is_active')
                    .order('created_at', { ascending: false });

                // Global Access: removed outlet_id filter

                const { data, error } = await query.limit(200);
                if (error) throw error;
                if (!mounted) return;
                setRows((data || []).map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    phone: c.phone,
                    customer_code: c.customer_code,
                    internal_customer_id: c.internal_customer_id,
                    is_active: c.is_active,
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

    useEffect(() => {
        if (!user?.profile.outlet_id) return;
        async function loadStaff() {
            const { data } = await supabase
                .from('users')
                .select('id, name')
                .eq('outlet_id', user.profile.outlet_id)
                .in('role', ['outlet_staff', 'outlet_manager']);
            setStaffList((data as any) || []);
        }
        loadStaff();
    }, [supabase, user]);

    // Construct ID prefix from outlet details
    useEffect(() => {
        if (user?.profile) {
            const profile = user.profile as any;
            const type = profile.outlet?.outlet_type || (profile.outlet?.type === 'smart_clinic' ? 'SC' : 'HP');
            const code = profile.outlet?.location_code || (profile.outlet?.name ? profile.outlet.name.split(' ').pop()?.substring(0, 3).toUpperCase() : 'TVL');
            setIdPrefix(`${type}-${code}-C`);
        }
    }, [user]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(r =>
            r.name?.toLowerCase().includes(q) ||
            (r.phone || '').toLowerCase().includes(q) ||
            (r.customer_code || '').toLowerCase().includes(q) ||
            (r.internal_customer_id || '').toLowerCase().includes(q)
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
            const insertData: any = {
                name: customerName.trim(),
                phone: customerPhone.trim(),
                email: email.trim() || null,
                address: address.trim() || null,
                notes: notes.trim() || null,
                credit_limit: parseFloat(creditLimit) || 10000,
                outstanding_balance: parseFloat(outstandingBalance) || 0,
                is_active: isActive,
                referred_by: referredBy || null,
                outlet_id: user.profile.outlet_id,
                created_by: user.id
            };

            if (editingCustomer) {
                const { error: updateError } = await (supabase as any)
                    .from('customers')
                    .update(insertData)
                    .eq('id', editingCustomer.id);

                if (updateError) throw updateError;

                setRows(prev => prev.map(r => r.id === editingCustomer.id ? {
                    ...r,
                    name: insertData.name,
                    phone: insertData.phone,
                    is_active: insertData.is_active,
                } : r));

                alert('✅ Customer updated successfully');
            } else {
                const { data, error } = await (supabase as any)
                    .from('customers')
                    .insert(insertData)
                    .select()
                    .single();

                if (error) throw error;

                setRows(prev => [{
                    id: data.id,
                    name: data.name,
                    phone: data.phone,
                    customer_code: data.customer_code,
                    internal_customer_id: data.internal_customer_id,
                    is_active: data.is_active,
                    created_at: data.created_at
                }, ...prev]);
            }

            setEditingCustomer(null);
            setIsModalOpen(false);
        } catch (e: any) {
            alert(e?.message || 'Failed to save customer');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (customer: any) => {
        setEditingCustomer(customer);
        setCustomerName(customer.name || '');
        setCustomerPhone(customer.phone || '');
        setEmail(customer.email || '');
        setAddress(customer.address || '');
        setNotes(customer.notes || '');
        setCreditLimit(customer.credit_limit?.toString() || '10000');
        setOutstandingBalance(customer.outstanding_balance?.toString() || '0');
        setIsActive(customer.is_active !== false);
        setReferredBy(customer.referred_by || '');
        setIsModalOpen(true);
    };

    const canEdit = ['store_manager', 'ho_accountant', 'master_admin', 'superadmin'].includes(user?.profile?.role || '');

    return (
        <div className="flex flex-col h-full">
            <TopBar title="Customers" />
            <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name, phone or ID..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {canEdit && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Customer
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden border">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Phone
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created Date
                                </th>
                                {canEdit && <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Edit</span>
                                </th>}
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
                                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                                        {error || 'No customers found'}
                                    </td>
                                </tr>
                            )}
                            {!loading && filtered.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 font-mono">
                                        {customer.internal_customer_id || customer.customer_code || customer.id.substring(0, 8)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {customer.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {customer.phone || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={cn(
                                            "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                                            customer.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                        )}>
                                            {customer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN') : '-'}
                                    </td>
                                    {canEdit && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEditClick(customer)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                            </h3>
                            <button onClick={() => { setIsModalOpen(false); setEditingCustomer(null); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Customer Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter full name"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Customer ID
                                    </label>
                                    <div className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-500 text-sm font-mono flex items-center justify-between cursor-help" title="Automatically generated professional ID">
                                        <span>{idPrefix}XXXXXX</span>
                                        <span className="text-[10px] bg-gray-200 px-1 rounded font-bold text-gray-400">AUTO</span>
                                    </div>
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
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="customer@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Referred By
                                    </label>
                                    <select
                                        value={referredBy}
                                        onChange={(e) => setReferredBy(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                    >
                                        <option value="">-- Select Staff --</option>
                                        {staffList.map(staff => (
                                            <option key={staff.id} value={staff.name}>{staff.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <textarea
                                    placeholder="Enter full address"
                                    rows={2}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Credit Limit (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={creditLimit}
                                        onChange={(e) => setCreditLimit(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Outstanding Balance (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={outstandingBalance}
                                        onChange={(e) => setOutstandingBalance(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    placeholder="Any internal notes..."
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                    Active Customer
                                </label>
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
                                {submitting ? (editingCustomer ? 'Saving...' : 'Adding...') : (editingCustomer ? 'Save Changes' : 'Add Customer')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
