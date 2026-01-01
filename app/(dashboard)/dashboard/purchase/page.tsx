'use client';

import React, { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';

export default function PurchasePage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();

    // Form state
    const [particulars, setParticulars] = useState('');
    const [voucherNumber, setVoucherNumber] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [cashAmount, setCashAmount] = useState('');
    const [upiAmount, setUpiAmount] = useState('');
    const [creditAmount, setCreditAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        // Validation
        if (!particulars.trim()) {
            alert('Please enter purchase particulars');
            return;
        }
        if (!voucherNumber.trim()) {
            alert('Please enter voucher number');
            return;
        }
        if (!invoiceNumber.trim()) {
            alert('Please enter invoice number');
            return;
        }

        const cash = parseFloat(cashAmount) || 0;
        const upi = parseFloat(upiAmount) || 0;
        const credit = parseFloat(creditAmount) || 0;
        const totalAmount = cash + upi + credit;

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
            if (credit > 0) paymentModes.push('Credit');

            // Create transaction
            const { data, error } = await (supabase as any)
                .from('transactions')
                .insert({
                    daily_record_id: dailyRecordId,
                    outlet_id: user.profile.outlet_id,
                    entry_number: voucherNumber.trim(),
                    transaction_type: 'expense',
                    category: 'purchase',
                    description: `Purchase: ${particulars.trim()} (Invoice: ${invoiceNumber})`,
                    amount: totalAmount,
                    payment_modes: paymentModes.join(','),
                    created_by: user.id
                })
                .select()
                .single();

            if (error) throw error;

            // Success
            alert(`✅ Purchase entry submitted successfully!\nVoucher: ${voucherNumber}\nAmount: ₹${totalAmount.toFixed(2)}`);

            // Reset form
            setParticulars('');
            setVoucherNumber('');
            setInvoiceNumber('');
            setCashAmount('');
            setUpiAmount('');
            setCreditAmount('');
        } catch (e: any) {
            console.error('Submit error:', e);
            alert(`❌ Failed to submit: ${e?.message || 'Unknown error'}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <TopBar title="Purchase Entry" />
            <div className="p-6">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Purchase Details</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Particulars <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter purchase details"
                                    value={particulars}
                                    onChange={(e) => setParticulars(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Voucher Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., VCH-001"
                                        value={voucherNumber}
                                        onChange={(e) => setVoucherNumber(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Invoice Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., INV-001"
                                        value={invoiceNumber}
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Credit Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(e.target.value)}
                                        step="0.01"
                                        min="0"
                                        className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : 'Submit Purchase'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
