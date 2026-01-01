'use client';

import React, { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { User, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function SalesReturnPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const returnType = searchParams.get('type') === 'purchase' ? 'purchase' : 'sales';
    const isPurchase = returnType === 'purchase';

    // Form state
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerExists, setCustomerExists] = useState(false);
    const [customerSuggestions, setCustomerSuggestions] = useState<Array<{ phone: string; name: string; id: string }>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [fetchingCustomer, setFetchingCustomer] = useState(false);
    const [billNumber, setBillNumber] = useState('');
    const [returnAmount, setReturnAmount] = useState('');
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
        if (!billNumber.trim()) {
            alert('Please enter bill/entry number');
            return;
        }
        const amount = parseFloat(returnAmount);
        if (!amount || amount <= 0) {
            alert('Please enter a valid return amount');
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

            // Create transaction (negative income for return)
            const { data, error } = await (supabase as any)
                .from('transactions')
                .insert({
                    daily_record_id: dailyRecordId,
                    outlet_id: user.profile.outlet_id,
                    entry_number: billNumber.trim(),
                    transaction_type: isPurchase ? 'income' : 'expense',
                    category: isPurchase ? 'purchase_return' : 'sales_return',
                    description: `${isPurchase ? 'Purchase' : 'Sales'} return from ${customerPhone} (Original bill: ${billNumber})`,
                    amount: amount,
                    payment_modes: 'Cash', // Default to cash refund
                    customer_phone: customerPhone.trim(),
                    created_by: user.id
                })
                .select()
                .single();

            if (error) throw error;

            // Success
            alert(`✅ ${isPurchase ? 'Purchase' : 'Sales'} return submitted successfully!\nBill: ${billNumber}\nReturn Amount: ₹${amount}`);

            // Reset form
            setCustomerPhone('');
            setBillNumber('');
            setReturnAmount('');
        } catch (e: any) {
            console.error('Submit error:', e);
            alert(`❌ Failed to submit: ${e?.message || 'Unknown error'}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <TopBar title={isPurchase ? "Purchase Return" : "Sales Return"} />
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
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Return Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Phone <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="10-digit phone"
                                        value={customerPhone}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCustomerPhone(val);
                                            if (val.length >= 3) searchCustomers(val);
                                            else { setShowSuggestions(false); setCustomerExists(false); }
                                        }}
                                        maxLength={10}
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                    {fetchingCustomer && (
                                        <div className="absolute right-3 top-2.5">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        </div>
                                    )}
                                </div>
                                {showSuggestions && customerSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-auto">
                                        {customerSuggestions.map((c, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    setCustomerPhone(c.phone);
                                                    setCustomerName(c.name);
                                                    setCustomerExists(true);
                                                    setShowSuggestions(false);
                                                }}
                                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 text-sm"
                                            >
                                                <div className="font-medium">{c.name}</div>
                                                <div className="text-xs text-gray-500">{c.phone}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {customerExists && (
                                    <div className="mt-1 text-xs text-green-600 font-medium flex items-center gap-1">
                                        <User className="w-3 h-3" /> Found: {customerName}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Entry / Bill Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., INV-001"
                                    value={billNumber}
                                    onChange={(e) => setBillNumber(e.target.value)}
                                    disabled={isLocked}
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Return Amount (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={returnAmount}
                                    onChange={(e) => setReturnAmount(e.target.value)}
                                    step="0.01"
                                    min="0"
                                    disabled={isLocked}
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                        {!isLocked && (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !customerPhone || !billNumber || !returnAmount}
                                className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : 'Submit Return'}
                            </button>
                        )}
                        {isLocked && (
                            <div className="w-full bg-gray-100 text-gray-400 py-3 rounded-lg font-bold text-center border border-dashed mt-6 text-sm">
                                Day Locked - Submissions Disabled
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
