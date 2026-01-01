'use client';

import React, { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';

export default function NewSalesPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();

    // Form state
    const [customerPhone, setCustomerPhone] = useState('');
    const [billNumber, setBillNumber] = useState('');
    const [salesValue, setSalesValue] = useState('');
    const [paymentModes, setPaymentModes] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const handlePaymentModeToggle = (mode: string) => {
        setPaymentModes(prev =>
            prev.includes(mode)
                ? prev.filter(m => m !== mode)
                : [...prev, mode]
        );
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
        if (!billNumber.trim()) {
            alert('Please enter bill/entry number');
            return;
        }
        const amount = parseFloat(salesValue);
        if (!amount || amount <= 0) {
            alert('Please enter a valid sales amount');
            return;
        }
        if (paymentModes.length === 0) {
            alert('Please select at least one payment mode');
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
                // Create new daily record
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

            // Create transaction
            const { data, error } = await (supabase as any)
                .from('transactions')
                .insert({
                    daily_record_id: dailyRecordId,
                    outlet_id: user.profile.outlet_id,
                    entry_number: billNumber.trim(),
                    transaction_type: 'income',
                    category: 'sales',
                    description: `Sale to ${customerPhone}`,
                    amount: amount,
                    payment_modes: paymentModes.join(','),
                    customer_phone: customerPhone.trim(),
                    created_by: user.id
                })
                .select()
                .single();

            if (error) throw error;

            // Success
            alert(`✅ Sales entry submitted successfully!\nBill: ${billNumber}\nAmount: ₹${amount}`);

            // Reset form
            setCustomerPhone('');
            setBillNumber('');
            setSalesValue('');
            setPaymentModes([]);
        } catch (e: any) {
            console.error('Submit error:', e);
            alert(`❌ Failed to submit: ${e?.message || 'Unknown error'}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <TopBar title="New Sales Entry" />
            <div className="p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Step 1: Customer Details */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">1</span>
                            Customer Details
                        </h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Customer Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter 10-digit phone number"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                maxLength={10}
                                className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Step 2: Sale Details */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">2</span>
                            Sale Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Entry / Bill Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., INV-001"
                                    value={billNumber}
                                    onChange={(e) => setBillNumber(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sales Value (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={salesValue}
                                    onChange={(e) => setSalesValue(e.target.value)}
                                    step="0.01"
                                    min="0"
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Payment Modes */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">3</span>
                            Payment Modes
                        </h2>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Payment Mode(s) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-6">
                            {['Cash', 'UPI', 'Card', 'Credit'].map((mode) => (
                                <label key={mode} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={paymentModes.includes(mode)}
                                        onChange={() => handlePaymentModeToggle(mode)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700">{mode}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Submitting...' : 'Submit Entry'}
                    </button>
                </div>
            </div>
        </div>
    );
}
