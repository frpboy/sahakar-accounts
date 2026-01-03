'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Clock } from 'lucide-react';
import { RecentTransactions } from '@/components/history/recent-transactions';

export default function ExpensesPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();

    // Form state
    const [particulars, setParticulars] = useState('');
    const [voucherNumber, setVoucherNumber] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');

    // New Fields
    const [totalExpenseAmount, setTotalExpenseAmount] = useState(''); // Main Amount
    const [otherCharges, setOtherCharges] = useState('');
    const [remarks, setRemarks] = useState('');

    // Payment Modes
    const [paymentModes, setPaymentModes] = useState<string[]>([]);
    const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
    const [autoCalculated, setAutoCalculated] = useState<Set<string>>(new Set());

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
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const generatedVoucher = `EXP-${year}${month}${day}-${hours}${minutes}${seconds}`;
            setVoucherNumber(generatedVoucher);
        }
    }, [user, voucherNumber]);

    // Auto-fill payment amount logic
    useEffect(() => {
        const total = parseFloat(totalExpenseAmount) || 0;

        // If 1 mode, it takes full amount
        if (paymentModes.length === 1 && total > 0) {
            const mode = paymentModes[0];
            setPaymentAmounts(prev => ({ ...prev, [mode]: total.toFixed(2) }));
            setAutoCalculated(new Set([mode]));
        }
        // If >1 mode, distribute
        else if (paymentModes.length > 1 && total > 0) {
            setPaymentAmounts(prev => {
                const updated = { ...prev };
                let distributable = paymentModes.filter(m => autoCalculated.has(m) || !prev[m] || parseFloat(prev[m]) === 0);
                if (distributable.length === 0) distributable = [...paymentModes]; // Reset if all manual

                if (distributable.length > 0) {
                    const manualSum = paymentModes.reduce((sum, m) => {
                        if (distributable.includes(m)) return sum;
                        return sum + (parseFloat(prev[m]) || 0);
                    }, 0);

                    const remaining = Math.max(0, total - manualSum);
                    const perMode = (remaining / distributable.length).toFixed(2);
                    const nextAutoCalculated = new Set(autoCalculated);

                    distributable.forEach(m => {
                        updated[m] = perMode;
                        nextAutoCalculated.add(m);
                    });

                    // Adjust rounding error
                    let currentTotal = paymentModes.reduce((sum, m) => sum + (parseFloat(updated[m]) || 0), 0);
                    let diff = total - currentTotal;
                    if (Math.abs(diff) > 0.001 && distributable.length > 0) {
                        const lastItem = distributable[distributable.length - 1];
                        const newVal = (parseFloat(updated[lastItem]) + diff).toFixed(2);
                        if (parseFloat(newVal) >= 0) updated[lastItem] = newVal;
                    }
                    setAutoCalculated(nextAutoCalculated);
                }
                return updated;
            });
        }
    }, [paymentModes, totalExpenseAmount]);

    const handlePaymentModeChange = (mode: string) => {
        if (isLocked) return;
        setPaymentModes(prev => {
            const isRemoving = prev.includes(mode);
            const newModes = isRemoving ? prev.filter(m => m !== mode) : [...prev, mode];

            if (isRemoving) {
                const newAmounts = { ...paymentAmounts };
                delete newAmounts[mode];
                setPaymentAmounts(newAmounts);
                setAutoCalculated(prevSet => {
                    const next = new Set(prevSet);
                    next.delete(mode);
                    return next;
                });
            }
            return newModes;
        });
    };

    const handleAmountChange = (mode: string, value: string) => {
        const enteredAmount = parseFloat(value) || 0;
        const total = parseFloat(totalExpenseAmount) || 0;

        setAutoCalculated(prev => {
            const next = new Set(prev);
            next.delete(mode);
            return next;
        });

        setPaymentAmounts(prev => {
            const updated = { ...prev, [mode]: value };
            if (paymentModes.length < 2) return updated;

            let distributable = paymentModes.filter(m => {
                if (m === mode) return false;
                return autoCalculated.has(m) || !prev[m] || parseFloat(prev[m]) === 0;
            });

            if (distributable.length === 0) {
                const otherModes = paymentModes.filter(m => m !== mode);
                if (otherModes.length > 0) distributable = [otherModes[otherModes.length - 1]];
            }

            if (distributable.length > 0) {
                const manualSum = paymentModes.reduce((sum, m) => {
                    if (m === mode) return sum + enteredAmount;
                    if (distributable.includes(m)) return sum;
                    return sum + (parseFloat(prev[m]) || 0);
                }, 0);

                const remaining = Math.max(0, total - manualSum);
                const perMode = (remaining / distributable.length).toFixed(2);

                const nextAutoCalculated = new Set(autoCalculated);
                nextAutoCalculated.delete(mode);

                distributable.forEach(m => {
                    updated[m] = perMode;
                    nextAutoCalculated.add(m);
                });

                let currentTotal = paymentModes.reduce((sum, m) => sum + (parseFloat(updated[m]) || 0), 0);
                let diff = total - currentTotal;
                if (Math.abs(diff) > 0.001) {
                    const lastVictim = distributable[distributable.length - 1];
                    const newVal = (parseFloat(updated[lastVictim]) + diff).toFixed(2);
                    if (parseFloat(newVal) >= 0) updated[lastVictim] = newVal;
                }
                setAutoCalculated(nextAutoCalculated);
            }
            return updated;
        });
    };

    const calculateTotalPayment = () => {
        return Object.values(paymentAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    };


    const handleSubmit = async () => {
        if (isLocked) {
            alert('❌ This business day is locked. New entries are not allowed.');
            return;
        }
        if (!particulars.trim()) {
            alert('Please enter expense particulars');
            return;
        }

        const total = parseFloat(totalExpenseAmount) || 0;
        if (total <= 0) {
            alert('Please enter a valid expense amount');
            return;
        }

        if (paymentModes.length === 0) {
            alert('Please select at least one payment mode');
            return;
        }

        const paymentTotal = calculateTotalPayment();
        if (Math.abs(paymentTotal - total) > 0.01) {
            alert(`Payment breakdown (${paymentTotal.toFixed(2)}) must match Total Amount (${total.toFixed(2)})`);
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

            // Prepare Payload
            const baseDescription = `Expense: ${particulars}`;
            let finalDescription = baseDescription;
            if (voucherNumber) finalDescription += ` (VCH: ${voucherNumber})`;

            const payload: any = {
                daily_record_id: dailyRecordId,
                outlet_id: user.profile.outlet_id,
                entry_number: voucherNumber || invoiceNumber,
                type: 'expense',
                category: 'expense',
                description: finalDescription,
                amount: total,
                payment_modes: paymentModes.join(','),
                created_by: user.id,
                // New Columns
                other_charges: otherCharges ? parseFloat(otherCharges) : 0,
                remarks: remarks || null
            };

            // Attempt Insert
            let { error } = await (supabase as any)
                .from('transactions')
                .insert(payload);

            // Fallback if columns missing
            if (error && (error.code === '42703' || error.message?.includes('column'))) {
                console.warn('Fallback: Inserting expense without new columns (appending to description)...');

                // Append missing data to description
                if (otherCharges) finalDescription += ` | Other Charges: ${otherCharges}`;
                if (remarks) finalDescription += ` | Remarks: ${remarks}`;

                const fallbackPayload = { ...payload };
                delete fallbackPayload.other_charges;
                delete fallbackPayload.remarks;
                fallbackPayload.description = finalDescription;

                const retry = await (supabase as any)
                    .from('transactions')
                    .insert(fallbackPayload);
                error = retry.error;

                if (!error) {
                    alert('⚠️ Warning: Saved, but DB migration missing. Data appended to description.');
                }
            }

            if (error) throw error;

            alert('✅ Expense entry saved!');

            // Reset
            setParticulars('');
            setTotalExpenseAmount('');
            setOtherCharges('');
            setRemarks('');
            setVoucherNumber(''); // Triggers auto-gen
            setInvoiceNumber('');
            setPaymentModes([]);
            setPaymentAmounts({});
            setAutoCalculated(new Set());

        } catch (e: any) {
            console.error('Submit error:', e);
            alert(`❌ Error: ${e.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <TopBar title="Expenses Entry" />
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
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Operational Expenses</h2>

                            <div className="space-y-6">
                                {/* Particulars & Voucher */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Particulars <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Enter expense details (e.g., Tea, Travel)"
                                            value={particulars}
                                            onChange={(e) => setParticulars(e.target.value.toUpperCase())}
                                            disabled={isLocked}
                                            className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Voucher Number</label>
                                        <input
                                            type="text"
                                            placeholder="Auto-generated"
                                            value={voucherNumber}
                                            onChange={(e) => setVoucherNumber(e.target.value.toUpperCase())}
                                            disabled={isLocked}
                                            className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-500 uppercase"
                                        />
                                    </div>
                                </div>

                                {/* Amount & Charges */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-dashed">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 dark:text-slate-200 mb-1">Total Amount (₹) <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={totalExpenseAmount}
                                            onChange={(e) => setTotalExpenseAmount(e.target.value)}
                                            disabled={isLocked}
                                            className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 font-bold text-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Other Charges (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 10 (Tips)"
                                            value={otherCharges}
                                            onChange={(e) => setOtherCharges(e.target.value)}
                                            disabled={isLocked}
                                            className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                                        />
                                    </div>
                                </div>

                                {/* Remarks */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Remarks (Optional)</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Add any additional notes..."
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Payment Modes Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-2">Select Payment Mode(s) <span className="text-red-500">*</span></label>
                                    <div className="flex gap-4 mb-4">
                                        {['Cash', 'UPI', 'Credit'].map((mode) => (
                                            <label key={mode} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={paymentModes.includes(mode)}
                                                    onChange={() => handlePaymentModeChange(mode)}
                                                    disabled={isLocked}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{mode}</span>
                                            </label>
                                        ))}
                                    </div>

                                    {/* Dynamic Payment Inputs */}
                                    {paymentModes.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 dark:bg-slate-800 p-4 rounded-lg">
                                            {paymentModes.map(mode => (
                                                <div key={mode}>
                                                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">{mode} Amount</label>
                                                    <input
                                                        type="number"
                                                        value={paymentAmounts[mode] || ''}
                                                        onChange={(e) => handleAmountChange(mode, e.target.value)}
                                                        className="w-full px-2 py-1 border rounded font-medium"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            ))}
                                            <div className="md:col-span-3 flex justify-between border-t pt-2 mt-2 text-sm font-bold">
                                                <span>Total Allocated: {calculateTotalPayment().toFixed(2)}</span>
                                                <span className={Math.abs(calculateTotalPayment() - (parseFloat(totalExpenseAmount) || 0)) > 0.01 ? "text-red-500" : "text-green-600"}>
                                                    Required: {totalExpenseAmount || '0.00'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {!isLocked && (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="w-full bg-gray-900 dark:bg-blue-600 text-white py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-blue-500 transition-colors font-medium mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Expense'}
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
                            category="expense"
                            title="Recent Expenses"
                        />
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 transition-colors">
                            <h4 className="text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Policy Reminder
                            </h4>
                            <div className="space-y-2 text-[10px] text-blue-700 dark:text-blue-400">
                                <p>• <strong>Staff</strong>: Enter operational expenses here.</p>
                                <p>• <strong>Managers</strong>: Verify receipts for all entries.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
