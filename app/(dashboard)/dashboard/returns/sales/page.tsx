'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { User, Search, ArrowRight, RefreshCcw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SalesReturnPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const isPurchase = false; // Fixed for Sales Return

    // Workflow State
    const [step, setStep] = useState<1 | 2>(1);
    const [fetching, setFetching] = useState(false);

    // Data State
    const [billNumber, setBillNumber] = useState('');
    const [originalTransaction, setOriginalTransaction] = useState<any>(null);
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerName, setCustomerName] = useState('');

    // Return Details State
    const [returnAmount, setReturnAmount] = useState('');
    const [returnReason, setReturnReason] = useState('');
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

    // Auto-fill payment amount logic
    useEffect(() => {
        const total = parseFloat(returnAmount) || 0;
        if (paymentModes.length === 1 && total > 0) {
            const mode = paymentModes[0];
            setPaymentAmounts(prev => ({ ...prev, [mode]: total.toFixed(2) }));
            setAutoCalculated(new Set([mode]));
        } else if (paymentModes.length > 1 && total > 0) {
            setPaymentAmounts(prev => {
                const updated = { ...prev };
                const distributable = paymentModes.filter(m => autoCalculated.has(m) || !prev[m] || parseFloat(prev[m]) === 0);

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
                    setAutoCalculated(nextAutoCalculated);
                }
                return updated;
            });
        }
    }, [paymentModes, returnAmount]);

    const handleSearchBill = async () => {
        if (!billNumber.trim()) {
            alert('Please enter a bill number');
            return;
        }
        setFetching(true);
        try {
            // Sales Return -> Look for original 'income' (Sale)
            const { data, error } = await (supabase as any)
                .from('transactions')
                .select('*')
                .eq('outlet_id', user?.profile?.outlet_id)
                .eq('entry_number', billNumber.trim())
                .eq('transaction_type', 'income')
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                alert(`❌ No sales record found with Bill Number: ${billNumber}`);
                return;
            }

            console.log('Found transaction:', data);
            setOriginalTransaction(data);

            // Populate Form
            setCustomerPhone(data.customer_phone || '');
            const match = data.description?.match(/Sale to (.*?) \(/);
            if (match && match[1]) {
                setCustomerName(match[1]);
            } else {
                setCustomerName('Unknown Customer');
            }

            setReturnAmount(data.amount?.toString() || '');

            // Parse payment modes
            if (data.payment_modes) {
                const modes = data.payment_modes.split(',').map((m: string) => m.trim());
                setPaymentModes(modes);
            }

            setStep(2);

        } catch (e: any) {
            console.error('Fetch error:', e);
            alert('Failed to fetch bill details');
        } finally {
            setFetching(false);
        }
    };

    const handlePaymentModeChange = (mode: string) => {
        if (isLocked) return;
        setPaymentModes(prev => {
            const isRemoving = prev.includes(mode);
            const newModes = isRemoving
                ? prev.filter(m => m !== mode)
                : [...prev, mode];

            if (isRemoving) {
                const newAmounts = { ...paymentAmounts };
                delete newAmounts[mode];
                setPaymentAmounts(newAmounts);
                setAutoCalculated(prev => {
                    const next = new Set(prev);
                    next.delete(mode);
                    return next;
                });
            }
            return newModes;
        });
    };

    const handlePaymentAmountChange = (mode: string, value: string) => {
        const enteredAmount = parseFloat(value) || 0;
        const totalReturn = parseFloat(returnAmount) || 0;

        setAutoCalculated(prev => {
            const next = new Set(prev);
            next.delete(mode);
            return next;
        });

        setPaymentAmounts(prev => {
            const updated = { ...prev, [mode]: value };

            const distributableModes = paymentModes.filter(m => {
                if (m === mode) return false;
                return autoCalculated.has(m) || !prev[m] || parseFloat(prev[m]) === 0;
            });

            if (distributableModes.length > 0) {
                const manualSum = paymentModes.reduce((sum, m) => {
                    if (m === mode) return sum + enteredAmount;
                    if (distributableModes.includes(m)) return sum;
                    return sum + (parseFloat(prev[m]) || 0);
                }, 0);

                const remaining = Math.max(0, totalReturn - manualSum);
                const perMode = (remaining / distributableModes.length).toFixed(2);

                const nextAutoCalculated = new Set(autoCalculated);
                nextAutoCalculated.delete(mode);

                distributableModes.forEach(m => {
                    updated[m] = perMode;
                    nextAutoCalculated.add(m);
                });

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

        const amount = parseFloat(returnAmount);
        if (!amount || amount <= 0) {
            alert('Please enter a valid return amount');
            return;
        }

        // Validate reason
        if (!returnReason.trim()) {
            alert('Please enter a reason for the return (Mandatory)');
            return;
        }

        // Validate total split if multiple modes
        if (paymentModes.length > 1) {
            const totalPayment = calculateTotalPayment();
            if (Math.abs(totalPayment - amount) > 0.01) {
                alert(`Payment breakdown (₹${totalPayment.toFixed(2)}) must equal return amount (₹${amount.toFixed(2)})`);
                return;
            }
        }

        if (!user?.profile?.outlet_id) {
            alert('No outlet assigned to your account');
            return;
        }

        setSubmitting(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            // Get/Create Daily Record
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
                        status: 'open',
                        particulars: 'Day Opening',
                        amount: 0,
                        category: 'system'
                    })
                    .select('id')
                    .single();

                if (recordError) throw recordError;
                dailyRecordId = newRecord.id;
            }

            // Create Return Transaction
            const { data, error } = await (supabase as any)
                .from('transactions')
                .insert({
                    daily_record_id: dailyRecordId,
                    outlet_id: user.profile.outlet_id,
                    entry_number: `RET-${billNumber}`,
                    type: 'expense', // Sales Return is an Expense for the shop (money out)
                    category: 'sales_return',
                    description: `Sales return from ${customerName} (Original Bill: ${billNumber}) | Reason: ${returnReason.trim()}`,
                    amount: amount,
                    payment_modes: paymentModes.join(','),
                    customer_phone: customerPhone.trim(),
                    created_by: user.id
                })
                .select()
                .single();

            if (error) throw error;

            alert(`✅ Sales return processed successfully!\nAmount: ₹${amount}`);

            // Reset
            setStep(1);
            setBillNumber('');
            setReturnAmount('');
            setReturnReason('');
            setPaymentModes([]);
            setPaymentAmounts({});
            setOriginalTransaction(null);

        } catch (e: any) {
            console.error('Submit error:', e);
            alert(`❌ Failed to submit: ${e?.message || 'Unknown error'}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <TopBar title="Sales Return" />

            <div className="p-6 max-w-3xl mx-auto w-full">
                {isLocked && (
                    <div className="mb-6 bg-red-600 text-white px-6 py-4 rounded-xl flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl">🔒</span>
                            <div>
                                <p className="font-bold text-lg">Business Day Locked</p>
                                <p className="text-sm text-red-100">Entries disabled.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 1: Bill Lookup */}
                {step === 1 && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 p-8 text-center transition-all">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Find Original Sale
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                            Enter the Bill / Entry Number from the original sales transaction (e.g., invoice number used when selling to customer).
                        </p>

                        <div className="flex gap-3 max-w-md mx-auto">
                            <input
                                type="text"
                                value={billNumber}
                                onChange={(e) => setBillNumber(e.target.value.replace(/\D/g, ''))}
                                placeholder="Enter Bill Number (e.g., 458723)"
                                className="flex-1 px-4 py-3 text-lg border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950"
                                autoFocus
                            />
                            <button
                                onClick={handleSearchBill}
                                disabled={fetching || !billNumber}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {fetching ? 'Searching...' : 'Continue'}
                                {!fetching && <ArrowRight className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Return Details */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Original Transaction Card */}
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-6 flex justify-between items-center">
                            <div>
                                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1 uppercase tracking-wide">
                                    Original Sale
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    ₹{parseFloat(originalTransaction?.amount || 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                    <span>Bill: <strong>{originalTransaction?.entry_number}</strong></span>
                                    <span>•</span>
                                    <span>{new Date(originalTransaction?.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {customerName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-slate-400">
                                    {customerPhone}
                                </div>
                                <button
                                    onClick={() => { setStep(1); setBillNumber(''); setOriginalTransaction(null); }}
                                    className="text-sm text-blue-600 hover:underline mt-2 flex items-center justify-end gap-1"
                                >
                                    <RefreshCcw className="w-3 h-3" /> Change Bill
                                </button>
                            </div>
                        </div>

                        {/* Return Form */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-orange-500" />
                                Return Details
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
                                        Refund Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={returnAmount}
                                        onChange={(e) => setReturnAmount(e.target.value)}
                                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                        className="w-full px-4 py-3 text-xl font-bold border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-950"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
                                        Reason for Return <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={returnReason}
                                        onChange={(e) => setReturnReason(e.target.value)}
                                        placeholder="Why did the customer return this product?"
                                        rows={3}
                                        className="w-full px-4 py-3 border dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-950"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-3">
                                        Refund Mode (Mirroring Original)
                                    </label>
                                    <div className="flex flex-wrap gap-4 mb-4">
                                        {['Cash', 'UPI', 'Card', 'Credit'].map((mode) => (
                                            <label key={mode} className={`
                                                flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all
                                                ${paymentModes.includes(mode)
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                                                    : 'bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50'}
                                            `}>
                                                <input
                                                    type="checkbox"
                                                    checked={paymentModes.includes(mode)}
                                                    onChange={() => handlePaymentModeChange(mode)}
                                                    className="hidden"
                                                />
                                                {paymentModes.includes(mode) && <CheckCircle2 className="w-4 h-4" />}
                                                <span className="font-medium">{mode}</span>
                                            </label>
                                        ))}
                                    </div>

                                    {/* Split Payment Breakdown */}
                                    {paymentModes.length > 1 && (
                                        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border dark:border-slate-800 space-y-3">
                                            {paymentModes.map(mode => (
                                                <div key={mode} className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300 w-24">{mode}</span>
                                                    <input
                                                        type="number"
                                                        value={paymentAmounts[mode] || ''}
                                                        onChange={(e) => handlePaymentAmountChange(mode, e.target.value)}
                                                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                                        className="w-32 px-3 py-1.5 border dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-right"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            ))}
                                            <div className="border-t dark:border-slate-700 pt-2 flex justify-between items-center text-sm font-bold">
                                                <span>Total Refund:</span>
                                                <span className={Math.abs(calculateTotalPayment() - parseFloat(returnAmount || '0')) < 0.01 ? 'text-green-600' : 'text-red-500'}>
                                                    ₹{calculateTotalPayment().toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full mt-8 bg-gray-900 dark:bg-blue-600 text-white py-4 rounded-xl hover:bg-gray-800 dark:hover:bg-blue-500 transition-colors font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Processing Return...' : 'Confirm Sales Return'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
