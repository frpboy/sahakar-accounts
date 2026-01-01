'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { OnlineBanner } from '@/components/online-banner';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { db } from '@/lib/offline-db';
import { User, Hash } from 'lucide-react';

export default function NewSalesPage() {
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

    // Auto-fill payment amount when single mode selected
    useEffect(() => {
        if (paymentModes.length === 1 && salesValue) {
            setPaymentAmounts({ [paymentModes[0]]: salesValue });
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

    // Construct ID prefix from outlet details
    useEffect(() => {
        if (user?.profile) {
            const profile = user.profile as any;
            const type = profile.outlet?.outlet_type || (profile.outlet?.type === 'smart_clinic' ? 'SC' : 'HP');
            const code = profile.outlet?.location_code || (profile.outlet?.name ? profile.outlet.name.split(' ').pop()?.substring(0, 3).toUpperCase() : 'TVL');
            setIdPrefix(`${type}-${code}`);
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

    const handlePaymentModeToggle = (mode: string) => {
        setPaymentModes(prev => {
            const newModes = prev.includes(mode)
                ? prev.filter(m => m !== mode)
                : [...prev, mode];

            // Clear amounts for removed modes
            if (!newModes.includes(mode)) {
                const newAmounts = { ...paymentAmounts };
                delete newAmounts[mode];
                setPaymentAmounts(newAmounts);
            }

            return newModes;
        });
    };

    const handlePaymentAmountChange = (mode: string, value: string) => {
        setPaymentAmounts(prev => ({
            ...prev,
            [mode]: value
        }));
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
                        status: 'open'
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
                    transaction_type: 'income',
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
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter 10-digit phone number"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    maxLength={10}
                                    disabled={isLocked}
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                                {fetchingCustomer && (
                                    <div className="absolute right-3 top-2.5">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                            </div>

                            {/* Autocomplete Suggestions */}
                            {showSuggestions && customerSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-auto">
                                    {customerSuggestions.map((customer, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => selectCustomer(customer)}
                                            className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                                    <div className="text-xs text-gray-500">{customer.phone}</div>
                                                </div>
                                                <User className="w-3 h-3 text-gray-400" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {customerExists && customerName && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
                                    <User className="w-4 h-4" />
                                    <span>Existing customer: <strong>{customerName}</strong></span>
                                </div>
                            )}
                            {customerPhone.length === 10 && !customerExists && !fetchingCustomer && (
                                <div className="mt-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded">
                                    ⚠️ New customer - please enter name below
                                </div>
                            )}
                        </div>

                        {/* Customer Name Field */}
                        {customerPhone.length === 10 && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder={customerExists ? "Auto-filled from database" : "Enter customer name"}
                                    value={customerName}
                                    onChange={(e) => !customerExists && setCustomerName(e.target.value)}
                                    disabled={customerExists || isLocked}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${customerExists
                                        ? 'bg-gray-100 text-gray-700 cursor-not-allowed'
                                        : isLocked ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50 focus:ring-blue-500'
                                        }`}
                                />
                                {!customerExists && customerName.trim() && (
                                    <p className="mt-1 text-xs text-green-600">✓ This customer will be saved to the database</p>
                                )}
                            </div>
                        )}
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
                                    ERP Bill Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., 458723"
                                    value={billNumber}
                                    onChange={(e) => setBillNumber(e.target.value)}
                                    disabled={isLocked}
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sahakar Entry ID
                                </label>
                                <div
                                    className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-500 flex items-center justify-between cursor-help"
                                    title="System-generated internal reference"
                                >
                                    <span className="font-mono">{idPrefix}-XXXXXX</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">Auto</span>
                                </div>
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
                                    disabled={isLocked}
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                        <div className="flex flex-wrap gap-6 mb-4">
                            {['Cash', 'UPI', 'Card', 'Credit'].map((mode) => (
                                <label key={mode} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={paymentModes.includes(mode)}
                                        disabled={isLocked}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                                    />
                                    <span className="text-gray-700">{mode}</span>
                                </label>
                            ))}
                        </div>

                        {/* Payment amount breakdown for multiple modes */}
                        {paymentModes.length > 1 && (
                            <div className="mt-4 space-y-3 bg-blue-50 p-4 rounded">
                                <p className="text-sm font-medium text-blue-900">Split Payment Amounts:</p>
                                {paymentModes.map(mode => (
                                    <div key={mode} className="flex items-center gap-3">
                                        <label className="text-sm text-gray-700 w-20">{mode}:</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={paymentAmounts[mode] || ''}
                                            onChange={(e) => handlePaymentAmountChange(mode, e.target.value)}
                                            step="0.01"
                                            min="0"
                                            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                ))}
                                <div className="pt-2 border-t border-blue-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">Total:</span>
                                        <span className={`font-bold ${Math.abs(calculateTotalPayment() - parseFloat(salesValue || '0')) < 0.01
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                            }`}>
                                            ₹{calculateTotalPayment().toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
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
            </div>
        </div>
    );
}
