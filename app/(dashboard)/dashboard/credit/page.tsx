'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { User, Search, Clock } from 'lucide-react';
import { RecentTransactions } from '@/components/history/recent-transactions';

export default function CreditReceivedPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreditPageContent />
        </Suspense>
    );
}

function CreditPageContent() {
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');
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

    // Auto-generate Entry Number on mount (if not editing)
    React.useEffect(() => {
        if (!entryNumber && !editId && user?.profile?.outlet_id) {
            // Generate format: OUTLET-CR-YYYYMMDD-HHMMSS  
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            // Get outlet prefix from localStorage or default
            const outletPrefix = localStorage.getItem('outlet_prefix') || 'SAH';
            const generatedEntry = `${outletPrefix}-CR-${year}${month}${day}-${hours}${minutes}${seconds}`;
            setEntryNumber(generatedEntry);
        }
    }, [user, entryNumber, editId]);
    // Load transaction if editing
    React.useEffect(() => {
        async function loadTransaction() {
            if (!editId || !user) return;
            try {
                const { data: tx, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('id', editId)
                    .single();

                if (error) throw error;
                if (tx) {
                    const trans = tx as any;
                    setCustomerPhone(trans.customer_phone || '');
                    setEntryNumber(trans.entry_number || '');
                    // Handle split cash/upi - assume total goes to first if unknown, 
                    // or parse from payment_modes/metadata if we had it.
                    // For now, let's just set UPI amount as total if UPI is in modes, else Cash.
                    const modes = trans.payment_modes?.split(',') || [];
                    if (modes.includes('UPI')) setUpiAmount(trans.amount.toString());
                    else setCashAmount(trans.amount.toString());

                    // Trigger name search
                    if (trans.customer_phone) {
                        // We can manually search here or rely on the effect if we add one for phone
                    }
                }
            } catch (e) {
                console.error('Load edit error:', e);
            }
        }
        loadTransaction();
    }, [editId, user, supabase]);

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
        if (isLocked) {
            alert('❌ This business day is locked. New entries are not allowed.');
            return;
        }
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
            if (editId) {
                // Update existing transaction
                const paymentModes = [];
                if (cash > 0) paymentModes.push('Cash');
                if (upi > 0) paymentModes.push('UPI');

                const { error: updateError } = await (supabase as any)
                    .from('transactions')
                    .update({
                        entry_number: entryNumber.trim(),
                        amount: totalAmount,
                        payment_modes: paymentModes.join(','),
                        customer_phone: customerPhone.trim(),
                        description: `Updated Credit received from ${customerName.trim()} (${customerPhone})`,
                    })
                    .eq('id', editId);

                if (updateError) throw updateError;
                alert('✅ Credit receipt updated successfully!');
                window.location.href = '/dashboard/history/credit';
                return;
            }

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
                    type: 'income',
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
                {isLocked && (
                    <div className="max-w-3xl mx-auto mb-6 bg-red-600 text-white px-6 py-4 rounded-xl flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <span className="text-2xl">🔒</span>
                            </div>
                            <div>
                                <p className="font-bold text-lg">Business Day Locked</p>
                                <p className="text-sm text-red-100">This day has been locked by HO. New entries are disabled.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors shadow-sm"
                        >
                            Refresh
                        </button>
                    </div>
                )}
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">Credit Amount Received</h2>

                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border dark:border-slate-800 p-6 transition-colors">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">Payment Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
                                        Customer Search (Phone/Name) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-2.5 text-gray-400">
                                            <Search className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Start typing phone or name..."
                                            value={customerPhone}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setCustomerPhone(val);
                                                if (val.length >= 2) searchCustomers(val);
                                                else { setShowSuggestions(false); setCustomerExists(false); }
                                            }}
                                            disabled={isLocked}
                                            className="w-full pl-10 pr-10 py-2 border dark:border-slate-800 rounded-md bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors"
                                        />
                                        {fetchingCustomer && (
                                            <div className="absolute right-3 top-2.5">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                                            </div>
                                        )}
                                        {showSuggestions && customerSuggestions.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg shadow-xl max-h-60 overflow-auto text-sm ring-1 ring-black ring-opacity-5">
                                                {customerSuggestions.map((c, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => {
                                                            setCustomerPhone(c.phone);
                                                            setCustomerName(c.name);
                                                            setCustomerExists(true);
                                                            setShowSuggestions(false);
                                                        }}
                                                        className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer border-b dark:border-slate-800 last:border-b-0 flex justify-between items-center group"
                                                    >
                                                        <div>
                                                            <div className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{c.name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-slate-400">{c.phone}</div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase">Select</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">Found an existing customer? Select them from the list.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
                                        Customer Name {customerExists ? '(Existing)' : '(New)'} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-2.5 text-gray-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={customerExists ? "Verified Customer" : customerPhone.length === 10 ? "Enter Name for New Customer" : "Enter 10-digit phone first"}
                                            value={customerName}
                                            onChange={(e) => !customerExists && setCustomerName(e.target.value)}
                                            disabled={customerExists || isLocked || (!customerExists && customerPhone.length !== 10)}
                                            className={"w-full pl-10 pr-3 py-2 border dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors " +
                                                ((customerExists || isLocked || (!customerExists && customerPhone.length !== 10))
                                                    ? "bg-blue-50/50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300 font-bold border-blue-200 dark:border-blue-900/40 cursor-not-allowed"
                                                    : "bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white")}
                                        />
                                        {customerExists && (
                                            <button
                                                onClick={() => { setCustomerExists(false); setCustomerName(''); }}
                                                className="absolute right-3 top-2.5 text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline"
                                            >
                                                Change
                                            </button>
                                        )}
                                    </div>
                                    {!customerExists && (
                                        <p className="text-[10px] text-orange-600 font-bold mt-1">Creating a new customer record.</p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
                                        Entry Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., CR-001"
                                        value={entryNumber}
                                        onChange={(e) => setEntryNumber(e.target.value)}
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 border dark:border-slate-800 rounded-md bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
                                        Cash Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={cashAmount}
                                        onChange={(e) => setCashAmount(e.target.value)}
                                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                        step="0.01"
                                        min="0"
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 border dark:border-slate-800 rounded-md bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
                                        UPI Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={upiAmount}
                                        onChange={(e) => setUpiAmount(e.target.value)}
                                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                        step="0.01"
                                        min="0"
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 border dark:border-slate-800 rounded-md bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors"
                                    />
                                </div>
                            </div>

                            {!isLocked && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full bg-gray-900 dark:bg-blue-600 text-white py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-blue-500 transition-colors font-medium mt-8 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Receipt'}
                                </button>
                            )}
                            {isLocked && (
                                <div className="w-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 py-3 rounded-lg font-bold text-center border border-dashed dark:border-slate-700 mt-8 text-sm">
                                    Day Locked - Submissions Disabled
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Recent Transactions */}
                    <div className="w-full lg:w-96 space-y-6">
                        <RecentTransactions
                            outletId={user?.profile?.outlet_id || ''}
                            category="credit_received"
                            title="Recent Credit Receipts"
                        />

                        {/* Quick Permission Reference */}
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
