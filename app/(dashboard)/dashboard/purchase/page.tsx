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
    const [isLocked, setIsLocked] = useState(false);
    const [checkingLock, setCheckingLock] = useState(true);

    // Check for Locked Day status
    React.useEffect(() => {
        async function checkLock() {
            if (!user?.profile?.outlet_id) return;
            setCheckingLock(true);
            try {
                const today = new Date().toISOString().split('T')[0];
                const { data } = await supabase
                    .from('daily_records')
                    .select('status')
                    .eq('outlet_id', user.profile.outlet_id)
                    .eq('date', today)
                    .single();

                if (data && data.status === 'locked') {
                    setIsLocked(true);
                } else {
                    setIsLocked(false);
                }
            } catch (e) {
                console.error('Lock check error:', e);
            } finally {
                setCheckingLock(false);
            }
        }
        checkLock();
    }, [user, supabase]);

    const handleSubmit = async () => {
        if (isLocked) {
            alert('❌ This business day is locked. New entries are not allowed.');
            return;
        }
        // Validation
        if (!particulars.trim()) {
            alert('Please enter purchase particulars');
            return;
        }
        // Relaxed validation: at least one of Voucher or Invoice required
        if (!voucherNumber.trim() && !invoiceNumber.trim()) {
            alert('Please enter either Voucher Number OR Invoice Number');
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

        // ... (rest of validation) ...
    };

    // Payment Mode Selection Logic
    const [selectedModes, setSelectedModes] = useState<string[]>([]);

    const toggleMode = (mode: string) => {
        if (isLocked) return;
        setSelectedModes(prev =>
            prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
        );
    };

    return (
        <div className="flex flex-col h-full">
            <TopBar title="Purchase Entry" />
            <div className="p-6">
                {isLocked && (
                    // ... (locked UI) ...
                    <div className="max-w-3xl mx-auto mb-6 bg-red-600 text-white px-6 py-4 rounded-xl flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-2 rounded-lg"><span className="text-2xl">🔒</span></div>
                            <div>
                                <p className="font-bold text-lg">Business Day Locked</p>
                                <p className="text-sm text-red-100">This day has been locked by HO. New entries are disabled.</p>
                            </div>
                        </div>
                        <button onClick={() => window.location.reload()} className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors shadow-sm">Refresh</button>
                    </div>
                )}
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Purchases/Expenses</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Particulars <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Enter purchase details"
                                    value={particulars}
                                    onChange={(e) => setParticulars(e.target.value)}
                                    disabled={isLocked}
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., VCH-001"
                                        value={voucherNumber}
                                        onChange={(e) => setVoucherNumber(e.target.value)}
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., INV-001"
                                        value={invoiceNumber}
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Provide at least one of Voucher or Invoice No.</p>
                                </div>
                            </div>

                            {/* Payment Modes Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Payment Mode(s) <span className="text-red-500">*</span></label>
                                <div className="flex gap-4 mb-4">
                                    {['Cash', 'UPI', 'Credit'].map((mode) => (
                                        <label key={mode} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedModes.includes(mode)}
                                                onChange={() => toggleMode(mode)}
                                                disabled={isLocked}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">{mode}</span>
                                        </label>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {selectedModes.includes('Cash') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cash Amount (₹)</label>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={cashAmount}
                                                onChange={(e) => setCashAmount(e.target.value)}
                                                step="0.01"
                                                min="0"
                                                disabled={isLocked}
                                                className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}
                                    {selectedModes.includes('UPI') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">UPI Amount (₹)</label>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={upiAmount}
                                                onChange={(e) => setUpiAmount(e.target.value)}
                                                step="0.01"
                                                min="0"
                                                disabled={isLocked}
                                                className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}
                                    {selectedModes.includes('Credit') && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Amount (₹)</label>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={creditAmount}
                                                onChange={(e) => setCreditAmount(e.target.value)}
                                                step="0.01"
                                                min="0"
                                                disabled={isLocked}
                                                className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isLocked && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Purchase'}
                                </button>
                            )}
                            {isLocked && (
                                <div className="w-full bg-gray-100 text-gray-400 py-3 rounded-lg font-bold text-center border border-dashed mt-4 text-sm">
                                    Day Locked - Submissions Disabled
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
