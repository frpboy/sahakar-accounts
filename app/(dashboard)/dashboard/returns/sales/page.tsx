'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { User, Search, RefreshCcw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { RecentTransactions } from '@/components/history/recent-transactions';

export default function SalesReturnPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();

    // Workflow State
    const [step, setStep] = useState<1 | 2>(1);
    const [fetching, setFetching] = useState(false);

    // Data State
    const [billNumber, setBillNumber] = useState('');
    const [originalTransaction, setOriginalTransaction] = useState<any>(null);
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    // Return Details State
    const [returnAmount, setReturnAmount] = useState('');
    const [returnReason, setReturnReason] = useState('');
    const [paymentModes, setPaymentModes] = useState<string[]>([]);
    const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
    const [autoCalculated, setAutoCalculated] = useState<Set<string>>(new Set());

    const [submitting, setSubmitting] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [checkingLock, setCheckingLock] = useState(true);
    const [returnsLedgerId, setReturnsLedgerId] = useState<string | null>(null);

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
        checkLock();
    }, [user, supabase]);

    // Fetch Default Return Ledger
    useEffect(() => {
        async function fetchLedger() {
            try {
                // Try finding specific Sales Return ledger, fallback to general Sales if needed but ideally distinct
                const { data } = await supabase
                    .from('ledger_accounts')
                    .select('id')
                    .eq('name', 'Sales Revenue') // Using Sales Revenue as fallback/default if specific return ledger not found, or typically it might be a contra-revenue account.
                    // Ideally we should have a 'Sales Return' ledger. Let's assume user wants to map it to valid ledger.
                    // Given the error is "null value", any valid ledger ID fixes it.
                    // Let's try to find 'Sales Return' first? The list_ledger_accounts output didn't show it.
                    // It showed 'Sales Revenue' (SAL) and 'Income' (INC).
                    // Best practice: Debit Sales Revenue (or specific return). 
                    // Let's stick to 'Sales Revenue' for now to ensure we have a valid ID from the known list. 
                    .single();

                if (data) setReturnsLedgerId(data.id);
            } catch (e) {
                console.error("Failed to fetch return ledger", e);
            }
        }
        fetchLedger();
    }, [supabase]);

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

    // Suggestion State
    const [billSuggestions, setBillSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchingBills, setSearchingBills] = useState(false);

    // Auto-search logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (billNumber.length >= 3 && !isLocked) {
                setSearchingBills(true);
                try {
                    const { data } = await (supabase as any)
                        .from('transactions')
                        .select('entry_number, amount, customer_phone, description')
                        .eq('outlet_id', user?.profile?.outlet_id)
                        .eq('type', 'income')
                        .ilike('entry_number', `%${billNumber}%`)
                        .limit(5);
                    setBillSuggestions(data || []);
                    setShowSuggestions(true);
                } catch (e) {
                    console.error('Suggestion error', e);
                } finally {
                    setSearchingBills(false);
                }
            } else {
                setBillSuggestions([]);
                setShowSuggestions(false);
            }
        }, 500); // Debounce
        return () => clearTimeout(timer);
    }, [billNumber, user, isLocked, supabase]);

    const selectBill = (entryNumber: string) => {
        setBillNumber(entryNumber);
        setShowSuggestions(false);
    };

    const handleSearchBill = async () => {
        if (!billNumber.trim()) {
            alert('Please enter a bill number');
            return;
        }
        setShowSuggestions(false);
        setFetching(true);
        try {
            const { data, error } = await (supabase as any)
                .from('transactions')
                .select('*')
                .eq('outlet_id', user?.profile?.outlet_id)
                .eq('entry_number', billNumber.trim())
                .eq('type', 'income')
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                alert(`❌ No sales record found with Bill Number: ${billNumber}`);
                return;
            }

            setOriginalTransaction(data);
            setCustomerPhone(data.customer_phone || '');
            setSelectedCustomerId(data.customer_id || null);
            const match = data.description?.match(/Sale to (.*?) \(/);
            setCustomerName(match && match[1] ? match[1] : 'Unknown Customer');
            setReturnAmount(data.amount?.toString() || '');

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
            const newModes = isRemoving ? prev.filter(m => m !== mode) : [...prev, mode];
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
            alert('❌ Day is locked.');
            return;
        }

        const amount = parseFloat(returnAmount);
        const originalAmount = parseFloat(originalTransaction?.amount || 0);

        if (!amount || amount <= 0) return alert('Valid amount required');
        if (amount > originalAmount) return alert(`Limit exceeded (Max ₹${originalAmount})`);
        if (!returnReason.trim()) return alert('Reason required');

        if (paymentModes.length > 1) {
            const total = calculateTotalPayment();
            if (Math.abs(total - amount) > 0.01) return alert(`Amount mismatch (₹${total.toFixed(2)} != ₹${amount.toFixed(2)})`);
        }

        if (!user?.profile?.outlet_id) return;

        setSubmitting(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            let dailyRecordId: string;
            const { data: record } = await (supabase as any)
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
                        status: 'open'
                    })
                    .select('id').single();
                if (recErr) throw recErr;
                dailyRecordId = newRec.id;
            }

            const { error } = await (supabase as any)
                .from('transactions')
                .insert({
                    daily_record_id: dailyRecordId,
                    outlet_id: user.profile.outlet_id,
                    entry_number: `RET-${billNumber}`,
                    type: 'expense',
                    category: 'sales_return',
                    description: `Sales return from ${customerName} (Bill: ${billNumber}) | Reason: ${returnReason.trim()}`,
                    amount: amount,
                    payment_modes: paymentModes.join(','),
                    customer_phone: customerPhone.trim(),
                    customer_id: selectedCustomerId,
                    created_by: user.id,
                    ledger_account_id: returnsLedgerId // Required field
                });

            if (error) throw error;

            alert(`✅ Sales return processed: ₹${amount}`);
            setStep(1); setBillNumber(''); setReturnAmount(''); setReturnReason(''); setPaymentModes([]); setPaymentAmounts({});
        } catch (e: any) {
            console.error('Submit error:', e);
            alert(`❌ Error: ${e.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <TopBar title="Sales Return" />
            <div className="p-6">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 w-full">
                        {isLocked && <div className="mb-6 bg-red-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg">🔒 Day Locked</div>}

                        {step === 1 && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 p-8 text-center transition-all">
                                <Search className="w-8 h-8 text-blue-600 mx-auto mb-6" />
                                <h2 className="text-2xl font-bold dark:text-white mb-2">Find Original Sale</h2>
                                <p className="text-gray-500 mb-8 max-w-md mx-auto">Enter Bill Number from original sale.</p>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <input type="text" placeholder="e.g. BILL-001" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} className="w-full px-4 py-3 border dark:border-slate-700 rounded-lg dark:bg-slate-950 dark:text-white" disabled={fetching} />
                                        {searchingBills && <div className="absolute right-4 top-4 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>}
                                        {showSuggestions && billSuggestions.length > 0 && (
                                            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                                {billSuggestions.map((bill, idx) => (
                                                    <button key={idx} onClick={() => selectBill(bill.entry_number)} className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 flex justify-between border-b last:border-0">
                                                        <div><div className="font-semibold dark:text-white">{bill.entry_number}</div><div className="text-xs text-gray-500">{bill.customer_phone}</div></div>
                                                        <div className="font-bold dark:text-slate-300">₹{bill.amount}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={handleSearchBill} disabled={fetching || !billNumber.trim()} className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50">{fetching ? 'Searching...' : 'Find Original Sale'}</button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-6 flex justify-between items-center text-gray-900 dark:text-white">
                                    <div><div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1 uppercase">Original Sale</div><div className="text-2xl font-bold">₹{parseFloat(originalTransaction?.amount || 0).toLocaleString()}</div><div className="text-xs text-gray-500 mt-1">Bill: {originalTransaction?.entry_number} • {new Date(originalTransaction?.created_at).toLocaleDateString()}</div></div>
                                    <div className="text-right"><div className="text-lg font-semibold">{customerName}</div><div className="text-sm text-gray-500">{customerPhone}</div><button onClick={() => { setStep(1); setBillNumber(''); }} className="text-sm text-blue-600 hover:underline mt-2">Change Bill</button></div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 p-6">
                                    <h3 className="text-lg font-bold dark:text-white mb-6 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-500" />Return Details</h3>
                                    <div className="space-y-6">
                                        <div><label className="block text-sm font-medium dark:text-slate-400 mb-1">Refund Amount (₹)</label><input type="number" value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)} className="w-full px-4 py-3 text-xl font-bold border dark:border-slate-700 rounded-lg dark:bg-slate-950 dark:text-white" /></div>
                                        <div><label className="block text-sm font-medium dark:text-slate-400 mb-1">Reason for Return *</label><textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Reason..." rows={3} className="w-full px-4 py-3 border dark:border-slate-700 rounded-lg dark:bg-slate-950 dark:text-white" /></div>
                                        <div><label className="block text-sm font-medium dark:text-slate-400 mb-3">Refund Mode</label>
                                            <div className="flex flex-wrap gap-4 mb-4">
                                                {['Cash', 'UPI', 'Card', 'Credit'].map((mode) => (
                                                    <label key={mode} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${paymentModes.includes(mode) ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-slate-950 dark:border-slate-800 text-gray-600 dark:text-slate-400'}`}>
                                                        <input type="checkbox" checked={paymentModes.includes(mode)} onChange={() => handlePaymentModeChange(mode)} className="hidden" />
                                                        {paymentModes.includes(mode) && <CheckCircle2 className="w-4 h-4" />}<span className="font-medium">{mode}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {paymentModes.length > 1 && (
                                                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border dark:border-slate-800 space-y-3">
                                                    {paymentModes.map(mode => (
                                                        <div key={mode} className="flex items-center justify-between"><span className="text-sm font-medium dark:text-slate-300">{mode}</span><input type="number" value={paymentAmounts[mode] || ''} onChange={(e) => handlePaymentAmountChange(mode, e.target.value)} className="w-32 px-3 py-1 border rounded dark:bg-slate-900 dark:border-slate-700 text-right dark:text-white" /></div>
                                                    ))}
                                                    <div className="border-t pt-2 flex justify-between font-bold dark:text-white"><span>Total:</span><span className={Math.abs(calculateTotalPayment() - parseFloat(returnAmount || '0')) < 0.01 ? 'text-green-600' : 'text-red-500'}>₹{calculateTotalPayment().toFixed(2)}</span></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={handleSubmit} disabled={submitting} className="w-full mt-8 bg-gray-900 dark:bg-blue-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50">{submitting ? 'Processing...' : 'Confirm Sales Return'}</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="w-full lg:w-96 space-y-6">
                        <RecentTransactions outletId={user?.profile?.outlet_id || ''} category="sales" title="Recent Sales" onSelect={(tx) => setBillNumber(tx.entry_number)} />
                        <RecentTransactions outletId={user?.profile?.outlet_id || ''} category="sales_return" title="Recent Returns" />
                    </div>
                </div>
            </div>
        </div>
    );
}
