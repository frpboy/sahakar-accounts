'use client';

import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { createClientBrowser } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer?: any;
    onSuccess?: () => void;
}

export function CustomerModal({ isOpen, onClose, customer, onSuccess }: CustomerModalProps) {
    const supabase = createClientBrowser();
    const { user } = useAuth();

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

    // Staff selection
    const [staffList, setStaffList] = useState<Array<{ id: string; name: string; outlet?: { name: string } }>>([]);

    // Load customer data when editing
    useEffect(() => {
        if (customer) {
            setCustomerName(customer.name || '');
            setCustomerPhone(customer.phone || '');
            setEmail(customer.email || '');
            setAddress(customer.address || '');
            setNotes(customer.notes || '');
            setCreditLimit(customer.credit_limit?.toString() || '10000');
            setOutstandingBalance(customer.outstanding_balance?.toString() || '0');
            setIsActive(customer.is_active !== false);
            setReferredBy(customer.referred_by || '');
        } else {
            // Reset form for new customer
            setCustomerName('');
            setCustomerPhone('');
            setEmail('');
            setAddress('');
            setNotes('');
            setCreditLimit('10000');
            setOutstandingBalance('0');
            setIsActive(true);
            setReferredBy('');
        }
    }, [customer, isOpen]);

    // Load staff list
    useEffect(() => {
        if (!isOpen) return;

        async function loadStaff() {
            const { data } = await supabase
                .from('users')
                .select('id, name, outlet:outlets(name)')
                .in('role', ['outlet_staff', 'outlet_manager']);

            setStaffList((data as any) || []);
        }
        loadStaff();
    }, [isOpen, supabase]);

    const handleSubmit = async () => {
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

            if (customer) {
                const { error: updateError } = await (supabase as any)
                    .from('customers')
                    .update(insertData)
                    .eq('id', customer.id);

                if (updateError) throw updateError;
                alert('✅ Customer updated successfully');
            } else {
                const { error } = await (supabase as any)
                    .from('customers')
                    .insert(insertData);

                if (error) throw error;
                alert('✅ Customer added successfully');
            }

            onSuccess?.();
            onClose();
        } catch (e: any) {
            alert(e?.message || 'Failed to save customer');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border dark:border-slate-800">
                <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-950">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {customer ? 'Edit Customer' : 'Add New Customer'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Customer Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter full name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="10-digit phone number"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    {customer && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100 dark:border-slate-800">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                                    Sahakar ID
                                </label>
                                <div className="text-sm font-mono text-gray-600 dark:text-slate-300">
                                    {customer.internal_customer_id || 'Generating...'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                                    ERP Code
                                </label>
                                <div className="text-sm font-mono text-gray-600 dark:text-slate-300">
                                    {customer.customer_code || 'N/A'}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="customer@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Referred By
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={referredBy}
                                    onChange={(e) => setReferredBy(e.target.value)}
                                    placeholder="Search staff..."
                                    className="w-full pl-9 pr-4 py-2 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm uppercase"
                                />
                            </div>

                            {/* Staff Search Results Dropdown */}
                            {referredBy && !staffList.find(s => s.name === referredBy) && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {staffList
                                        .filter(s => s.name.toLowerCase().includes(referredBy.toLowerCase()))
                                        .map(staff => (
                                            <button
                                                key={staff.id}
                                                type="button"
                                                onClick={() => setReferredBy(staff.name)}
                                                className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-800 focus:bg-blue-50 dark:focus:bg-slate-800 focus:outline-none border-b dark:border-slate-800 last:border-0"
                                            >
                                                <div className="font-medium text-sm text-gray-900 dark:text-white">{staff.name}</div>
                                                {staff.outlet && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{staff.outlet.name}</div>
                                                )}
                                            </button>
                                        ))}
                                    {staffList.filter(s => s.name.toLowerCase().includes(referredBy.toLowerCase())).length === 0 && (
                                        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No staff found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Address
                        </label>
                        <textarea
                            placeholder="Enter full address"
                            rows={2}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Credit Limit (₹)
                            </label>
                            <input
                                type="number"
                                value={creditLimit}
                                onChange={(e) => setCreditLimit(e.target.value)}
                                className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Outstanding Balance (₹)
                            </label>
                            <input
                                type="number"
                                value={outstandingBalance}
                                onChange={(e) => setOutstandingBalance(e.target.value)}
                                className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notes
                        </label>
                        <textarea
                            placeholder="Any internal notes..."
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Active Customer
                        </label>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-950 flex justify-end gap-3 border-t dark:border-slate-800">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-4 py-2 bg-gray-900 dark:bg-blue-600 text-white rounded-md hover:bg-gray-800 dark:hover:bg-blue-500 font-medium disabled:opacity-50"
                    >
                        {submitting ? (customer ? 'Saving...' : 'Adding...') : (customer ? 'Save Changes' : 'Add Customer')}
                    </button>
                </div>
            </div>
        </div>
    );
}
