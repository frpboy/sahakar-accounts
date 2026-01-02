'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Clock } from 'lucide-react';
import { RecentTransactions } from '@/components/history/recent-transactions';

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
    useEffect(() => {
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

    // Auto-generate Voucher Number on mount
    useEffect(() => {
        if (!voucherNumber && user?.profile?.outlet_id) {
            // Generate format: OUTLET-VCH-YYYYMMDD-HHMMSS
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            // Get outlet prefix from localStorage or default
            const outletPrefix = localStorage.getItem('outlet_prefix') || 'SAH';
            const generatedVoucher = `${outletPrefix}-VCH-${year}${month}${day}-${hours}${minutes}${seconds}`;
            setVoucherNumber(generatedVoucher);
        }
    }, [user, voucherNumber]);

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

        if (!user?.profile?.outlet_id) {
            alert('No outlet assigned');
            return;
        }

        setSubmitting(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            // Get Daily Record
            let dailyRecordId: string;
            const { data: record } = await supabase
                .from('daily_records')
                .select('id')
                .eq('outlet_id', user.profile.outlet_id)
                .eq('date', today)
                .single();

            if (record) {
                dailyRecordId = record.id;
            } else {
                const { data: newRec, error: recErr } = await (supabase as any)
                    .from('daily_records')
                    .insert({
                        outlet_id: user.profile.outlet_id,
                        date: today,
                        particulars: 'Shift Opening',
                        amount: 0,
                        category: 'opening_balance',
                        opening_cash: 0,
                        opening_upi: 0,
                        status: 'open'
                    })
                    .select('id')
                    .single();
                if (recErr) throw recErr;
                dailyRecordId = newRec.id;
            }

            const modes = [];
            if (cash > 0) modes.push('Cash');
            if (upi > 0) modes.push('UPI');
            if (credit > 0) modes.push('Credit');

            const { error } = await (supabase as any)
                .from('transactions')
                .insert({
                    daily_record_id: dailyRecordId,
                    outlet_id: user.profile.outlet_id,
                    entry_number: voucherNumber || invoiceNumber,
                    type: 'expense',
                    category: 'purchase',
                    description: `Purchase from ${particulars} (VCH: ${voucherNumber || 'N/A'}, INV: ${invoiceNumber || 'N/A'})`,
                    amount: totalAmount,
                    payment_modes: modes.join(','),
                    created_by: user.id
                });

            if (error) throw error;

            alert('✅ Purchase entry saved!');
            setParticulars('');
            setVoucherNumber('');
            setInvoiceNumber('');
            setCashAmount('');
            setUpiAmount('');
            setCreditAmount('');
            setSelectedModes([]);

        } catch (e: any) {
            console.error('Submit error:', e);
            alert(`❌ Error: ${e.message}`);
        } finally {
            setSubmitting(false);
        }
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
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <TopBar title="Purchase Entry" />
            <div className="p-6">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                        {isLocked && (
                            <div className="mb-6 bg-red-600 text-white px-6 py-4 rounded-xl flex items-center justify-between shadow-lg">
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

                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Purchases/Expenses</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Particulars <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Enter purchase details"
                                        value={particulars}
                                        onChange={(e) => setParticulars(e.target.value)}
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Voucher Number</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., VCH-001"
                                            value={voucherNumber}
                                            onChange={(e) => setVoucherNumber(e.target.value)}
                                            disabled={isLocked}
                                            className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Invoice Number</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., INV-001"
                                            value={invoiceNumber}
                                            onChange={(e) => setInvoiceNumber(e.target.value)}
                                            disabled={isLocked}
                                            className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Provide at least one of Voucher or Invoice No.</p>
                                    </div>
                                </div>

                                {/* Payment Modes Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-2">Select Payment Mode(s) <span className="text-red-500">*</span></label>
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
                                                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{mode}</span>
                                            </label>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {selectedModes.includes('Cash') && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Cash Amount (₹)</label>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={cashAmount}
                                                    onChange={(e) => setCashAmount(e.target.value)}
                                                    step="0.01"
                                                    min="0"
                                                    disabled={isLocked}
                                                    className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )}
                                        {selectedModes.includes('UPI') && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">UPI Amount (₹)</label>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={upiAmount}
                                                    onChange={(e) => setUpiAmount(e.target.value)}
                                                    step="0.01"
                                                    min="0"
                                                    disabled={isLocked}
                                                    className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )}
                                        {selectedModes.includes('Credit') && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Credit Amount (₹)</label>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={creditAmount}
                                                    onChange={(e) => setCreditAmount(e.target.value)}
                                                    step="0.01"
                                                    min="0"
                                                    disabled={isLocked}
                                                    className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {!isLocked && (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="w-full bg-gray-900 dark:bg-blue-600 text-white py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-blue-500 transition-colors font-medium mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Purchase'}
                                    </button>
                                )}
                                {isLocked && (
                                    <div className="w-full bg-gray-100 dark:bg-slate-900/50 text-gray-400 py-3 rounded-lg font-bold text-center border border-dashed mt-4 text-sm">
                                        Day Locked - Submissions Disabled
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-96 space-y-6">
                        <RecentTransactions
                            outletId={user?.profile?.outlet_id || ''}
                            category="purchase"
                            title="Recent Purchases"
                        />

                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 transition-colors">
                            <h4 className="text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Policy Reminder
                            </h4>
                            <div className="space-y-2 text-[10px] text-blue-700 dark:text-blue-400">
                                <p>• <strong>Staff</strong>: Edit own entries only, until Shift End.</p>
                                <p>• <strong>Managers</strong>: 30-day editing window.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
