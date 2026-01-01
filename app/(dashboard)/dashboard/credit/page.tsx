'use client';

import React, { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { User, Search } from 'lucide-react';

export default function CreditReceivedPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();

    // Form state
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerExists, setCustomerExists] = useState(false);
    const [customerSuggestions, setCustomerSuggestions] = useState<Array<{ phone: string; name: string; id: string }>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [fetchingCustomer, setFetchingCustomer] = useState(false);
    const [entryNumber, setEntryNumber] = useState('');
    const [cashAmount, setCashAmount] = useState('');
    const [upiAmount, setUpiAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const searchCustomers = async (phone: string) => {
        setFetchingCustomer(true);
        try {
            const { data, error } = await (supabase as any)
                .from('customers')
                .select('phone, name, id')
                .or(`phone.ilike.${phone}%,name.ilike.%${phone}%`)
                .eq('is_active', true)
                .limit(10);

            if (data && !error) {
                setCustomerSuggestions(data);
                setShowSuggestions(data.length > 0);
                if (phone.length === 10) {
                    const exactMatch = data.find((c: any) => c.phone === phone);
                    if (exactMatch) {
                        setCustomerName(exactMatch.name);
                        setCustomerExists(true);
                        setShowSuggestions(false);
                    }
                }
            }
        } catch (e) {
            console.error('Search error:', e);
        } finally {
            setFetchingCustomer(false);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!customerPhone.trim()) {
            alert('Please enter customer phone number');
            return;
        }
        if (!/^\d{10}$/.test(customerPhone.trim())) {
            alert('Please enter a valid 10-digit phone number');
            return;
        }
        if (!customerName.trim()) {
            alert('Please enter customer name');
            return;
        }
        if (!entryNumber.trim()) {
            alert('Please enter entry number');
            return;
        }

        const cash = parseFloat(cashAmount) || 0;
        const upi = parseFloat(upiAmount) || 0;
        const totalAmount = cash + upi;

        if (totalAmount <= 0) {
            alert('Please enter at least one payment amount');
            return;
        }

        if (!user?.profile?.outlet_id) {
            alert('No outlet assigned to your account');
            return;
        }

        setSubmitting(true);
        try {
            // Get or create today's daily_record
            const today = new Date().toISOString().split('T')[0];

            let dailyRecordId: string;
            const { data: existingRecord } = await (supabase as any)
                .from('daily_records')
                .select('id')
                .eq('outlet_id', user.profile.outlet_id)
                .eq('date', today)
                .single();

            if (existingRecord) {
                dailyRecordId = existingRecord.id;
            } else {
                const { data: newRecord, error: recordError } = await (supabase as any)
                    .from('daily_records')
                    .insert({
                        outlet_id: user.profile.outlet_id,
                        date: today,
                        opening_cash: 0,
                        opening_upi: 0,
                        status: 'open'
                    })
                    .select('id')
                    .single();

                if (recordError) throw recordError;
                dailyRecordId = newRecord.id;
            }

            // Determine payment modes
            const paymentModes = [];
            if (cash > 0) paymentModes.push('Cash');
            if (upi > 0) paymentModes.push('UPI');

            // Create transaction
            const { data, error } = await (supabase as any)
                .from('transactions')
                .insert({
                    daily_record_id: dailyRecordId,
                    outlet_id: user.profile.outlet_id,
                    entry_number: entryNumber.trim(),
                    transaction_type: 'income',
                    category: 'credit_received',
                    description: `Credit received from ${customerName.trim()} (${customerPhone})`,
                    amount: totalAmount,
                    payment_modes: paymentModes.join(','),
                    customer_phone: customerPhone.trim(),
                    created_by: user.id
                })
                .select()
                .single();

            if (error) throw error;

            // Success
            alert(`✅ Credit receipt submitted successfully!\nCustomer: ${customerName}\nAmount: ₹${totalAmount.toFixed(2)}`);

            // Reset form
            setCustomerPhone('');
            setCustomerName('');
            setEntryNumber('');
            setCashAmount('');
            setUpiAmount('');
        } catch (e: any) {
            console.error('Submit error:', e);
            alert(`❌ Failed to submit: ${e?.message || 'Unknown error'}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <TopBar title="Credit Received" />
            <div className="p-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Credit Amount Received</h2>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Payment Details</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Phone <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="10-digit phone"
                                        value={customerPhone}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCustomerPhone(val);
                                            if (val.length >= 3) searchCustomers(val);
                                            else { setShowSuggestions(false); setCustomerExists(false); }
                                        }}
                                        maxLength={10}
                                        className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {fetchingCustomer && (
                                        <div className="absolute right-3 top-2.5">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        </div>
                                    )}
                                </div>
                                {showSuggestions && customerSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-auto text-sm">
                                        {customerSuggestions.map((c, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    setCustomerPhone(c.phone);
                                                    setCustomerName(c.name);
                                                    setCustomerExists(true);
                                                    setShowSuggestions(false);
                                                }}
                                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                            >
                                                <div className="font-medium">{c.name}</div>
                                                <div className="text-xs text-gray-500">{c.phone}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder={customerExists ? "Auto-filled" : "Enter name"}
                                    value={customerName}
                                    onChange={(e) => !customerExists && setCustomerName(e.target.value)}
                                    disabled={customerExists}
                                    className={cn(
                                        "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                                        customerExists ? "bg-gray-100 cursor-not-allowed" : "bg-gray-50"
                                    )}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Entry Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., CR-001"
                                    value={entryNumber}
                                    onChange={(e) => setEntryNumber(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cash Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={cashAmount}
                                    onChange={(e) => setCashAmount(e.target.value)}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    UPI Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={upiAmount}
                                    onChange={(e) => setUpiAmount(e.target.value)}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Submit Receipt'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
