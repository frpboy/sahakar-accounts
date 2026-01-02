'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { OnlineBanner } from '@/components/online-banner';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { db } from '@/lib/offline-db';
import { User, Hash, Clock } from 'lucide-react';
import { detectAnomalies } from '@/lib/anomaly-engine';
import { RecentTransactions } from '@/components/history/recent-transactions';

export default function NewSalesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SalesPageContent />
        </Suspense>
    );
}

function SalesPageContent() {
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const isOnline = useOnlineStatus();

    // Form state
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerExists, setCustomerExists] = useState(false);
    const [customerSuggestions, setCustomerSuggestions] = useState<Array<{ phone: string; name: string; id: string }>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [billNumber, setBillNumber] = useState('');
    const [salesValue, setSalesValue] = useState('');
    const [paymentModes, setPaymentModes] = useState<string[]>([]);
    const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
    const [autoCalculated, setAutoCalculated] = useState<Set<string>>(new Set()); // Track auto-calculated fields
    const [submitting, setSubmitting] = useState(false);
    const [fetchingCustomer, setFetchingCustomer] = useState(false);
    const [idPrefix, setIdPrefix] = useState('HP-TVL');
    const [isLocked, setIsLocked] = useState(false);
    const [checkingLock, setCheckingLock] = useState(true);

    // Auto-search customers when typing (after 3 digits)
    useEffect(() => {
        if (customerPhone.length >= 3 && /^\d{3,10}$/.test(customerPhone)) {
            searchCustomers(customerPhone);
        } else {
            setCustomerSuggestions([]);
            setShowSuggestions(false);
            if (customerPhone.length < 10) {
                setCustomerName('');
                setCustomerExists(false);
            }
        }
    }, [customerPhone]);

    // Auto-fill payment amount when single mode selected OR total changes
    useEffect(() => {
        const total = parseFloat(salesValue) || 0;
        if (paymentModes.length === 1 && total > 0) {
            const mode = paymentModes[0];
            setPaymentAmounts(prev => ({ ...prev, [mode]: total.toFixed(2) }));
            setAutoCalculated(new Set([mode]));
        } else if (paymentModes.length > 1 && total > 0) {
            // Re-calculate auto-distributed fields if total changes
            setPaymentAmounts(prev => {
                const updated = { ...prev };
                let distributable = paymentModes.filter(m => autoCalculated.has(m) || !prev[m] || parseFloat(prev[m]) === 0);

                // If all fields are manual but total changed, we must re-distribute.
                // Strategy: Keep strict manual fields? No, user changed Total, implying re-calc needed.
                // If NO auto fields, treat ALL fields as auto-distributable to match the new total evenly.
                // Alternatively, we could just pick one victim, but for "Sales Value" change, usually implies a reset or scale.
                // Let's go with: If no auto fields, ALL become auto.
                if (distributable.length === 0) {
                    distributable = [...paymentModes];
                }

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

                    // Rounding fix for the last item
                    let currentTotal = paymentModes.reduce((sum, m) => sum + (parseFloat(updated[m]) || 0), 0);
                    let diff = total - currentTotal;

                    if (Math.abs(diff) > 0.001 && distributable.length > 0) {
                        const lastItem = distributable[distributable.length - 1];
                        const newVal = (parseFloat(updated[lastItem]) + diff).toFixed(2);
                        if (parseFloat(newVal) >= 0) {
                            updated[lastItem] = newVal;
                        }
                    }

                    setAutoCalculated(nextAutoCalculated);
                }
                return updated;
            });
        }
    }, [paymentModes, salesValue]);

    // Check for Locked Day status
    useEffect(() => {
        async function checkLock() {
            if (!user?.profile?.outlet_id) return;
            setCheckingLock(true);
            try {
                const today = new Date().toISOString().split('T')[0];
                const { data, error } = await supabase
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

    // Load transaction if editing
    useEffect(() => {
        async function loadTransaction() {
            if (!editId || !user) return;
            try {
                const { data: tx, error } = await supabase
                    .from('transactions')
                    .select('*, daily_records(date)')
                    .eq('id', editId)
                    .single();

                if (error) throw error;
                if (tx) {
                    const trans = tx as any;
                    setCustomerPhone(trans.customer_phone || '');
                    setBillNumber(trans.entry_number || '');
                    setSalesValue(trans.amount.toString());
                    const modes = trans.payment_modes?.split(',') || [];
                    setPaymentModes(modes);

                    // If the transaction is from a generic "Sale to..." description, extract customer name if possible
                    // but better to just let the phone search trigger the name.
                }
            } catch (e) {
                console.error('Load edit error:', e);
            }
        }
        loadTransaction();
    }, [editId, user, supabase]);

    // Construct ID prefix from outlet details
    useEffect(() => {
        if (user?.profile) {
            const profile = user.profile as any;
            // Always use HP for Hyperpharmacy as per request, fallback to TVL if no location code
            // Location code: Use location_code if available, else first 3 chars of name, else TVL
            let code = profile.outlet?.location_code;
            if (!code && profile.outlet?.name) {
                // Try to extract from name (e.g. "Tirunelveli Branch" -> "TIR")
                code = profile.outlet.name.trim().substring(0, 3).toUpperCase();
            }
            code = (code || 'TVL').substring(0, 4).toUpperCase(); // Max 4 chars as per request

            setIdPrefix(`HP-${code}`);
        }
    }, [user]);

    const searchCustomers = async (phone: string) => {
        setFetchingCustomer(true);
        try {
            console.log('[Debug] Searching for customers with:', phone);
            const { data, error } = await (supabase as any)
                .from('customers')
                .select('phone, name, id, customer_code, internal_customer_id')
                .or(`phone.ilike.${phone}%,name.ilike.%${phone}%,customer_code.ilike.${phone}%`)
                .eq('is_active', true)
                .limit(10);

            if (error) {
                console.error('[Debug] Customer search query error:', error);
                throw error;
            }

            console.log('[Debug] Search result:', data);

            if (data) {
                setCustomerSuggestions(data);
                setShowSuggestions(data.length > 0);

                // If exact match with 10 digits, auto-select
                if (phone.length === 10) {
                    const exactMatch = data.find((c: any) => c.phone === phone);
                    if (exactMatch) {
                        setCustomerName(exactMatch.name);
                        setCustomerExists(true);
                        setShowSuggestions(false);
                    } else {
                        setCustomerExists(false);
                        setCustomerName('');
                    }
                }
            } else {
                setCustomerSuggestions([]);
                setShowSuggestions(false);
            }
        } catch (e) {
            console.error('[Debug] Customer search exception:', e);
            setCustomerSuggestions([]);
            setShowSuggestions(false);
        } finally {
            setFetchingCustomer(false);
        }
    };

    const selectCustomer = (customer: { phone: string; name: string }) => {
        setCustomerPhone(customer.phone);
        setCustomerName(customer.name);
        setCustomerExists(true);
        setShowSuggestions(false);
        setCustomerSuggestions([]);
    };

    const handlePaymentModeChange = (mode: string) => {
        if (isLocked) return;
        setPaymentModes(prev => {
            const isRemoving = prev.includes(mode);
            const newModes = isRemoving
                ? prev.filter(m => m !== mode)
                : [...prev, mode];

            // Clean up payment amounts if mode removed
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
        const totalSales = parseFloat(salesValue) || 0;

        // This mode is now strictly manual
        setAutoCalculated(prev => {
            const next = new Set(prev);
            next.delete(mode);
            return next;
        });

        setPaymentAmounts(prev => {
            const updated = { ...prev, [mode]: value };

            if (paymentModes.length < 2) return updated;

            // Distribute remaining among all other "auto" fields
            // Eligible for auto: 
            // 1. Modes already in autoCalculated (except current)
            // 2. Modes that are currently empty (0 or '')
            let distributableModes = paymentModes.filter(m => {
                if (m === mode) return false;
                return autoCalculated.has(m) || !prev[m] || parseFloat(prev[m]) === 0;
            });

            // If no auto fields found, pick the last available mode (that isn't current) as the victim
            if (distributableModes.length === 0) {
                const otherModes = paymentModes.filter(m => m !== mode);
                if (otherModes.length > 0) {
                    distributableModes = [otherModes[otherModes.length - 1]];
                }
            }

            if (distributableModes.length > 0) {
                // Calculate total of non-victim (manual) fields
                const manualSum = paymentModes.reduce((sum, m) => {
                    if (m === mode) return sum + enteredAmount;
                    if (distributableModes.includes(m)) return sum;
                    return sum + (parseFloat(prev[m]) || 0);
                }, 0);

                const remaining = Math.max(0, totalSales - manualSum);
                // If remaining is 0, we can still set victims to 0
                // Divide remaining equally among victims
                const perMode = (remaining / distributableModes.length).toFixed(2);

                // Handle rounding issues for the last victim
                // Not strictly necessary for 2 decimals but good to be precise

                const nextAutoCalculated = new Set(autoCalculated);
                nextAutoCalculated.delete(mode);

                distributableModes.forEach((m, idx) => {
                    // For the very last item, assign exactly the remainder to avoid 0.01 issues
                    if (idx === distributableModes.length - 1) {
                        const currentDistributedSum = distributableModes.slice(0, idx).reduce((s, dm) => s + parseFloat(updated[dm] || '0'), 0);
                        // This logic is tricky inside a loop. 
                        // Simplification: just assign perMode, maybe strict diff on last.
                        // Let's stick to perMode for now, but usually one takes the rounding hit.
                    }

                    updated[m] = perMode;
                    nextAutoCalculated.add(m);
                });

                // Refined rounding fix:
                // Recalculate sum of all manual + newly distributed
                // If absolute diff < 0.05, adjust the last distributable
                let currentTotal = paymentModes.reduce((sum, m) => sum + (parseFloat(updated[m]) || 0), 0);
                let diff = totalSales - currentTotal;

                if (Math.abs(diff) > 0.001 && distributableModes.length > 0) {
                    const lastVictim = distributableModes[distributableModes.length - 1];
                    const newVal = (parseFloat(updated[lastVictim]) + diff).toFixed(2);
                    if (parseFloat(newVal) >= 0) {
                        updated[lastVictim] = newVal;
                    }
                }

                setAutoCalculated(nextAutoCalculated);
            }

            return updated;
        });
    };

    const calculateTotalPayment = () => {
        return Object.values(paymentAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    };

    const saveAsDraft = async () => {
        if (!user?.profile?.outlet_id) return;

        try {
            await db.drafts.add({
                outlet_id: user.profile.outlet_id,
                transaction_type: 'income',
                category: 'sales',
                entry_number: billNumber.trim(),
                description: `Sale to ${customerPhone}`,
                amount: parseFloat(salesValue),
                payment_modes: paymentModes.join(','),
                customer_phone: customerPhone.trim(),
                created_at: new Date().toISOString(),
                created_by: user.id,
                synced: false
            });

            alert('✅ Saved as draft! View in Drafts page.');

            // Reset form
            setCustomerPhone('');
            setBillNumber('');
            setSalesValue('');
            setPaymentModes([]);
            setPaymentAmounts({});
        } catch (e: any) {
            console.error('Draft save error:', e);
            alert(`❌ Failed to save draft: ${e?.message}`);
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

        // Validate customer name for new customers
        if (!customerExists && !customerName.trim()) {
            alert('Please enter customer name');
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

        // Multi-payment validation
        if (paymentModes.length > 1) {
            const totalPayment = calculateTotalPayment();
            if (Math.abs(totalPayment - amount) > 0.01) {
                alert(`Payment amounts (₹${totalPayment.toFixed(2)}) must equal sales value (₹${amount.toFixed(2)})`);
                return;
            }
        }

        if (!user?.profile?.outlet_id) {
            alert('No outlet assigned to your account');
            return;
        }

        // If offline, save as draft
        if (!isOnline) {
            await saveAsDraft();
            return;
        }

        setSubmitting(true);
        console.log('🚀 Starting sales submission...', {
            phone: customerPhone,
            name: customerName,
            amount,
            bill: billNumber,
            modes: paymentModes
        });

        try {
            if (editId) {
                // Update existing transaction
                const { error: updateError } = await supabase
                    .from('transactions')
                    .update({
                        entry_number: billNumber.trim(),
                        amount: amount,
                        payment_modes: paymentModes.join(','),
                        customer_phone: customerPhone.trim(),
                        description: `Updated Sale to ${customerName.trim()} (${customerPhone})`,
                    } as any)
                    .eq('id', editId);

                if (updateError) throw updateError;
                alert('✅ Transaction updated successfully!');
                window.location.href = '/dashboard/history/sales';
                return;
            }

            // Step 1: Create customer if new
            if (!customerExists) {
                console.log('📝 Creating new customer...');

                const profile = (user as any).profile;
                // Get count for ID generation
                const { count } = await (supabase as any)
                    .from('customers')
                    .select('*', { count: 'exact', head: true })
                    .eq('outlet_id', profile.outlet_id);

                const { data: newCust, error: customerError } = await (supabase as any)
                    .from('customers')
                    .insert({
                        outlet_id: profile.outlet_id,
                        phone: customerPhone.trim(),
                        name: customerName.trim(),
                        is_active: true,
                        created_by: user.id
                    })
                    .select()
                    .single();

                if (customerError) {
                    console.error('❌ Customer creation error:', customerError);
                    if (!customerError.message.includes('duplicate')) {
                        throw customerError;
                    }
                } else {
                    console.log('✅ New customer created:', newCust);
                }
            } else {
                console.log('👤 Using existing customer');
            }

            // Step 2: Get or create today's daily_record
            const today = new Date().toISOString().split('T')[0];
            console.log('📅 Getting daily record for:', today);

            const profile = (user as any).profile;
            let dailyRecordId: string;
            const { data: existingRecord, error: fetchRecordError } = await (supabase as any)
                .from('daily_records')
                .select('id')
                .eq('outlet_id', profile.outlet_id)
                .eq('date', today)
                .maybeSingle();

            if (fetchRecordError) {
                console.error('❌ Fetch daily record error:', fetchRecordError);
                throw fetchRecordError;
            }

            if (existingRecord) {
                console.log('✅ Found existing daily record:', existingRecord.id);
                dailyRecordId = existingRecord.id;
            } else {
                console.log('➕ Creating new daily record...');
                const { data: newRecord, error: recordError } = await (supabase as any)
                    .from('daily_records')
                    .insert({
                        outlet_id: profile.outlet_id,
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

                if (recordError) {
                    console.error('❌ Create daily record error:', recordError);
                    throw recordError;
                }
                dailyRecordId = newRecord.id;
                console.log('✅ Created new daily record:', dailyRecordId);
            }

            // Create transaction
            console.log('💸 Creating transaction...');
            const { data: transData, error } = await (supabase as any)
                .from('transactions')
                .insert({
                    daily_record_id: dailyRecordId,
                    outlet_id: profile.outlet_id,
                    entry_number: billNumber.trim(),
                    type: 'income',
                    category: 'sales',
                    description: `Sale to ${customerName.trim()} (${customerPhone})`,
                    amount: amount,
                    payment_modes: paymentModes.join(','),
                    customer_phone: customerPhone.trim(),
                    created_by: user.id
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Transaction error:', error);
                throw error;
            }

            console.log('✅ Transaction complete:', transData);

            // Step 4: Anomaly Detection
            const detected = detectAnomalies(transData);
            if (detected.length > 0) {
                console.log('⚠️ Anomalies detected:', detected);
                const anomaliesToInsert = detected.map(a => ({
                    ...a,
                    outlet_id: profile.outlet_id,
                    metadata: { ...a.details, transaction_id: transData.id },
                    title: a.description,
                    detected_at: new Date().toISOString()
                }));

                const { error: anomalyError } = await (supabase as any)
                    .from('anomalies')
                    .insert(anomaliesToInsert);

                if (anomalyError) {
                    console.error('❌ Failed to record anomalies:', anomalyError);
                    // Don't throw, as the transaction succeeded
                } else {
                    console.log('✅ Anomalies recorded successfully');
                }
            }

            // Success
            const customerLabel = customerExists ? 'Existing customer' : 'New customer added';
            const internalIdMsg = transData.internal_entry_id ? `\nSahakar ID: ${transData.internal_entry_id}` : '';
            alert(`✅ Sales entry submitted successfully!\n${customerLabel}: ${customerName}\nBill: ${billNumber}${internalIdMsg}\nAmount: ₹${amount}`);

            // Reset form
            setCustomerPhone('');
            setCustomerName('');
            setCustomerExists(false);
            setBillNumber('');
            setSalesValue('');
            setPaymentModes([]);
            setPaymentAmounts({});
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
            <OnlineBanner isOnline={isOnline} />
            <div className="p-6">
                {isLocked && (
                    <div className="max-w-3xl mx-auto mb-6 bg-red-600 dark:bg-red-900/40 text-white px-6 py-4 rounded-xl flex items-center justify-between shadow-lg border dark:border-red-900/50">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <span className="text-2xl">🔒</span>
                            </div>
                            <div>
                                <p className="font-bold text-lg">Business Day Locked</p>
                                <p className="text-sm text-red-100 dark:text-red-200">This day has been locked by HO. New entries are disabled.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg font-bold hover:bg-red-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        >
                            Refresh
                        </button>
                    </div>
                )}
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-6">
                        {/* Step 1: Customer Details */}
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border dark:border-slate-800 p-6 transition-colors">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">1</span>
                                Customer Details
                            </h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
                                    Customer Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative max-w-sm">
                                    <input
                                        type="text"
                                        placeholder="Enter 10-digit phone number"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                                        maxLength={10}
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 border dark:border-slate-800 rounded-md bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors"
                                    />
                                    {fetchingCustomer && (
                                        <div className="absolute right-3 top-2.5">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                                        </div>
                                    )}

                                    {/* Autocomplete Suggestions */}
                                    {showSuggestions && customerSuggestions.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-md shadow-lg max-h-40 overflow-auto">
                                            {customerSuggestions.map((customer, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => selectCustomer(customer)}
                                                    className="px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer border-b dark:border-slate-800 last:border-b-0"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-slate-400">{customer.phone}</div>
                                                        </div>
                                                        <User className="w-3 h-3 text-gray-400 dark:text-slate-500" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {customerExists && customerName && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded border dark:border-green-900/30">
                                        <User className="w-4 h-4" />
                                        <span>Existing customer: <strong>{customerName}</strong></span>
                                    </div>
                                )}
                                {customerPhone.length === 10 && !customerExists && !fetchingCustomer && (
                                    <div className="mt-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-3 py-2 rounded border dark:border-orange-900/30">
                                        ⚠️ New customer - please enter name below
                                    </div>
                                )}
                            </div>

                            {/* Customer Name Field */}
                            {customerPhone.length === 10 && (
                                <div className="mt-4 max-w-sm">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
                                        Customer Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={customerExists ? "Auto-filled from database" : "Enter customer name"}
                                        value={customerName}
                                        onChange={(e) => !customerExists && setCustomerName(e.target.value)}
                                        disabled={customerExists || isLocked}
                                        className={`w-full px-3 py-2 border dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 transition-colors ${customerExists
                                            ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400 cursor-not-allowed'
                                            : isLocked ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed' : 'bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-blue-500'
                                            }`}
                                    />
                                    {!customerExists && customerName.trim() && (
                                        <p className="mt-1 text-xs text-green-600 dark:text-green-500">✓ This customer will be saved to the database</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Step 2: Sale Details */}
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border dark:border-slate-800 p-6 transition-colors">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">2</span>
                                Sale Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
                                        ERP Bill Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., 458723"
                                        value={billNumber}
                                        onChange={(e) => setBillNumber(e.target.value.replace(/\D/g, ''))}
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 border dark:border-slate-800 rounded-md bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
                                        Sahakar Entry ID
                                    </label>
                                    <div
                                        className="w-full px-3 py-2 border dark:border-slate-800 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 flex items-center justify-between cursor-help"
                                        title="System-generated internal reference"
                                    >
                                        <span className="font-mono">{idPrefix}-XXXXXX</span>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">Auto</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
                                        Sales Value (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={salesValue}
                                        onChange={(e) => {
                                            // Remove leading zeros
                                            const val = e.target.value;
                                            if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
                                                setSalesValue(val.replace(/^0+/, ''));
                                            } else {
                                                setSalesValue(val);
                                            }
                                        }}
                                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                        step="0.01"
                                        min="0"
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 border dark:border-slate-800 rounded-md bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Payment Modes */}
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border dark:border-slate-800 p-6 transition-colors">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">3</span>
                                Payment Modes
                            </h2>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-3">
                                Select Payment Mode(s) <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-6 mb-4">
                                {['Cash', 'UPI', 'Card', 'Credit'].map((mode) => (
                                    <label key={mode} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={paymentModes.includes(mode)}
                                            onChange={() => handlePaymentModeChange(mode)}
                                            disabled={isLocked}
                                            className="w-4 h-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-slate-700 rounded focus:ring-blue-500 disabled:opacity-50"
                                        />
                                        <span className="text-gray-700 dark:text-slate-300">{mode}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Payment amount breakdown for multiple modes */}
                            {paymentModes.length > 1 && (
                                <div className="mt-4 space-y-3 bg-blue-50 dark:bg-slate-800/40 p-4 rounded border dark:border-slate-800">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-400">Split Payment Amounts:</p>
                                    {paymentModes.map(mode => {
                                        const isAutoCalculated = autoCalculated.has(mode);
                                        return (
                                            <div key={mode} className="flex items-center gap-3">
                                                <label className="text-sm text-gray-700 dark:text-slate-400 w-20">{mode}:</label>
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={paymentAmounts[mode] || ''}
                                                        onChange={(e) => handlePaymentAmountChange(mode, e.target.value)}
                                                        onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                                        step="0.01"
                                                        min="0"
                                                        disabled={isLocked}
                                                        className={`w-full px-3 py-2 pr-20 border dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 transition-all ${isAutoCalculated
                                                            ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-900/40 text-green-800 dark:text-green-400 font-semibold focus:ring-green-500'
                                                            : 'bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-blue-500'
                                                            } ${isLocked ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed' : ''}`}
                                                    />
                                                    {isAutoCalculated && paymentAmounts[mode] && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none" title="Auto-calculated and distributed">
                                                            <span className="text-green-600 dark:text-green-400 text-[10px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100/50 dark:bg-green-900/30 rounded uppercase tracking-tighter">
                                                                AUTO
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="pt-2 border-t border-blue-200 dark:border-slate-700">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium dark:text-slate-400">Total:</span>
                                            <span className={`font-bold ${Math.abs(calculateTotalPayment() - parseFloat(salesValue || '0')) < 0.01
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                ₹{calculateTotalPayment().toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-600 dark:text-slate-500">
                                            <span>Expected:</span>
                                            <span>₹{parseFloat(salesValue || '0').toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : isOnline ? 'Submit Entry' : 'Save as Draft (Offline)'}
                        </button>
                    </div>

                    {/* Right Side: Recent Transactions */}
                    <div className="w-full lg:w-96 space-y-6">
                        <RecentTransactions
                            outletId={user?.profile?.outlet_id || ''}
                            category="sales"
                            title="Recent Sales"
                        />

                        {/* Quick Permission Reference */}
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                            <h4 className="text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Policy Reminder
                            </h4>
                            <div className="space-y-2 text-[10px] text-blue-700 dark:text-blue-400">
                                <p>• <strong>Staff</strong>: Own entries only, until Shift End.</p>
                                <p>• <strong>Managers</strong>: 30-day editing window.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
