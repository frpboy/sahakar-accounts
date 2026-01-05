'use client';

import React, { useState, useMemo, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { OnlineBanner } from '@/components/online-banner';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { db } from '@/lib/offline-db';
import { User, Clock, AlertCircle, Search, X, ChevronDown } from 'lucide-react';
import { detectAnomalies } from '@/lib/anomaly-engine';
import { RecentTransactions } from '@/components/history/recent-transactions';

// --- Searchable Select Component ---
interface UserOption {
    id: string;
    name: string;
    outlet_id: string;
    outlet_name?: string;
    role?: string;
}

interface SearchableSelectProps {
    label: string;
    options: UserOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    filterOutletId?: string; // If provided, strictly filters users by this outlet
}

function SearchableSelect({ label, options, value, onChange, placeholder, disabled, required, filterOutletId }: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter options
    const filteredOptions = useMemo(() => {
        let list = options;
        if (filterOutletId) {
            list = list.filter(u => u.outlet_id === filterOutletId);
        }
        if (!searchTerm) return list;
        const lower = searchTerm.toLowerCase();
        return list.filter(u =>
            u.name.toLowerCase().includes(lower) ||
            (u.outlet_name && u.outlet_name.toLowerCase().includes(lower))
        );
    }, [options, filterOutletId, searchTerm]);

    // Selected User Object
    const selectedUser = options.find(u => u.id === value);

    // Handle Click Outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Effect to clear search when closed
    useEffect(() => {
        if (!isOpen) setSearchTerm('');
    }, [isOpen]);

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div
                className={`relative w-full border rounded-md bg-white dark:bg-slate-900 flex items-center min-h-[42px] 
                    ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-800' : 'cursor-text hover:border-blue-400'}
                    ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-300 dark:border-slate-700'}
                `}
                onClick={() => !disabled && setIsOpen(true)}
            >
                {/* Search / Display Input */}
                <div className="flex-1 flex items-center px-3">
                    {isOpen ? (
                        <input
                            type="text"
                            className="w-full bg-transparent outline-none text-sm placeholder-gray-400"
                            placeholder="Search staff..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    ) : (
                        <span className={`text-sm ${selectedUser ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                            {selectedUser ? selectedUser.name : (placeholder || 'Select...')}
                        </span>
                    )}
                </div>

                {/* Icons */}
                <div className="flex items-center gap-1 pr-2">
                    {value && !disabled && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400 hover:text-red-500"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(user => (
                            <div
                                key={user.id}
                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 flex flex-col
                                    ${value === user.id ? 'bg-blue-50 dark:bg-slate-800 font-medium' : ''}
                                `}
                                onClick={() => {
                                    onChange(user.id);
                                    setIsOpen(false);
                                }}
                            >
                                <span className="text-gray-900 dark:text-white">{user.name}</span>
                                {user.outlet_name && (
                                    <span className="text-[10px] text-gray-500">{user.outlet_name}</span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">No staff found</div>
                    )}
                </div>
            )}
        </div>
    );
}

// --- Main Page Component ---

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
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [customerSuggestions, setCustomerSuggestions] = useState<Array<{ phone: string; name: string; id: string }>>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Feature Extension: Referrals and Assignments
    const [assignedTo, setAssignedTo] = useState<string>('');
    const [referredBy, setReferredBy] = useState<string>('');
    const [staffList, setStaffList] = useState<UserOption[]>([]);

    // Feature Extension: Refill Reminder
    const [refillReminder, setRefillReminder] = useState(false);
    const [refillDays, setRefillDays] = useState('');

    const [billNumber, setBillNumber] = useState('');
    const [salesValue, setSalesValue] = useState('');
    const [paymentModes, setPaymentModes] = useState<string[]>([]);
    const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
    const [autoCalculated, setAutoCalculated] = useState<Set<string>>(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [fetchingCustomer, setFetchingCustomer] = useState(false);
    const [idPrefix, setIdPrefix] = useState('HP-TVL');
    const [isLocked, setIsLocked] = useState(false);
    const [checkingLock, setCheckingLock] = useState(true);

    // Initial Load: Fetch Staff and Lock Status
    useEffect(() => {
        async function init() {
            if (!user?.profile?.outlet_id) return;

            // Set default assigned to current user
            setAssignedTo(user.id);

            // Fetch Staff List
            try {
                // Fetch staff via API (Proxy to allow global search)
                const res = await fetch('/api/users');
                if (res.ok) {
                    const users = await res.json();
                    // Map API format to UserOption
                    const mappedUsers = users.map((u: any) => ({
                        id: u.id,
                        name: u.name,
                        outlet_id: u.outlet_id,
                        outlet_name: u.outlet?.name || 'Unknown',
                        role: u.role
                    }));
                    setStaffList(mappedUsers);
                } else {
                    console.error("API Error fetching staff:", res.statusText);
                    // Fallback to minimal user info if API fails (though API is upgraded)
                    setStaffList([{ id: user.id, name: user.profile.name || 'Current User', outlet_id: user.profile.outlet_id }]);
                }
            } catch (e) {
                console.error("Failed to fetch staff list", e);
            }

            // Check Lock
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
        init();
    }, [user, supabase]);

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
                setSelectedCustomerId(null);
            }
        }
    }, [customerPhone]);

    // Auto-fill payment amount logic (Same as before)
    useEffect(() => {
        const total = parseFloat(salesValue) || 0;
        if (paymentModes.length === 1 && total > 0) {
            const mode = paymentModes[0];
            setPaymentAmounts(prev => ({ ...prev, [mode]: total.toFixed(2) }));
            setAutoCalculated(new Set([mode]));
        } else if (paymentModes.length > 1 && total > 0) {
            setPaymentAmounts(prev => {
                const updated = { ...prev };
                let distributable = paymentModes.filter(m => autoCalculated.has(m) || !prev[m] || parseFloat(prev[m]) === 0);
                if (distributable.length === 0) distributable = [...paymentModes];

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
    }, [paymentModes, salesValue]);

    // ID prefix
    useEffect(() => {
        if (user?.profile) {
            const profile = user.profile as any;
            let code = profile.outlet?.location_code;
            if (!code && profile.outlet?.name) {
                code = profile.outlet.name.trim().substring(0, 3).toUpperCase();
            }
            code = (code || 'TVL').substring(0, 4).toUpperCase();
            setIdPrefix(`HP-${code}`);
        }
    }, [user]);

    const searchCustomers = async (phone: string) => {
        setFetchingCustomer(true);
        try {
            // Try with new feature columns first
            const { data, error } = await (supabase as any)
                .from('customers')
                .select('phone, name, id, customer_code, assigned_to_user_id, referred_by_user_id')
                .or(`phone.ilike.${phone}%,name.ilike.%${phone}%,customer_code.ilike.${phone}%`)
                .eq('is_active', true)
                .limit(10);

            if (error) {
                // If error is related to missing columns (Migration not applied), try fallback
                if (error.code === '42703' || error.message?.includes('column')) {
                    console.warn('New columns missing, trying basic search...');
                    const { data: fallback } = await (supabase as any)
                        .from('customers')
                        .select('phone, name, id, customer_code')
                        .or(`phone.ilike.${phone}%,name.ilike.%${phone}%,customer_code.ilike.${phone}%`)
                        .eq('is_active', true)
                        .limit(10);

                    if (fallback) {
                        setCustomerSuggestions(fallback);
                        setShowSuggestions(fallback.length > 0);
                        if (phone.length === 10) {
                            const exactMatch = fallback.find((c: any) => c.phone === phone);
                            if (exactMatch) {
                                selectCustomer(exactMatch);
                            } else {
                                setCustomerExists(false);
                                setCustomerName('');
                                setSelectedCustomerId(null);
                            }
                        }
                        return;
                    }
                }
                throw error;
            }

            if (data) {
                setCustomerSuggestions(data);
                setShowSuggestions(data.length > 0);

                if (phone.length === 10) {
                    const exactMatch = data.find((c: any) => c.phone === phone);
                    if (exactMatch) {
                        selectCustomer(exactMatch);
                    } else {
                        setCustomerExists(false);
                        setCustomerName('');
                        setSelectedCustomerId(null);
                    }
                }
            } else {
                setCustomerSuggestions([]);
                setShowSuggestions(false);
            }
        } catch (e) {
            console.error('[Debug] Customer search exception:', e);
            setCustomerSuggestions([]);
        } finally {
            setFetchingCustomer(false);
        }
    };

    const selectCustomer = (customer: any) => {
        setCustomerPhone(customer.phone);
        setCustomerName(customer.name);
        setCustomerExists(true);
        setSelectedCustomerId(customer.id);

        // Auto-fill Assignments if present
        if (customer.assigned_to_user_id) setAssignedTo(customer.assigned_to_user_id);
        if (customer.referred_by_user_id) setReferredBy(customer.referred_by_user_id);

        setShowSuggestions(false);
        setCustomerSuggestions([]);
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
        const totalSales = parseFloat(salesValue) || 0;

        setAutoCalculated(prev => {
            const next = new Set(prev);
            next.delete(mode);
            return next;
        });

        setPaymentAmounts(prev => {
            const updated = { ...prev, [mode]: value };
            if (paymentModes.length < 2) return updated;

            let distributableModes = paymentModes.filter(m => {
                if (m === mode) return false;
                return autoCalculated.has(m) || !prev[m] || parseFloat(prev[m]) === 0;
            });

            if (distributableModes.length === 0) {
                const otherModes = paymentModes.filter(m => m !== mode);
                if (otherModes.length > 0) distributableModes = [otherModes[otherModes.length - 1]];
            }

            if (distributableModes.length > 0) {
                const manualSum = paymentModes.reduce((sum, m) => {
                    if (m === mode) return sum + enteredAmount;
                    if (distributableModes.includes(m)) return sum;
                    return sum + (parseFloat(prev[m]) || 0);
                }, 0);

                const remaining = Math.max(0, totalSales - manualSum);
                const perMode = (remaining / distributableModes.length).toFixed(2);

                const nextAutoCalculated = new Set(autoCalculated);
                nextAutoCalculated.delete(mode);

                distributableModes.forEach((m) => {
                    updated[m] = perMode;
                    nextAutoCalculated.add(m);
                });

                let currentTotal = paymentModes.reduce((sum, m) => sum + (parseFloat(updated[m]) || 0), 0);
                let diff = totalSales - currentTotal;

                if (Math.abs(diff) > 0.001 && distributableModes.length > 0) {
                    const lastVictim = distributableModes[distributableModes.length - 1];
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
        if (!customerPhone.trim() || !/^\d{10}$/.test(customerPhone.trim())) {
            alert('Please enter a valid 10-digit phone number');
            return;
        }
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
        if (refillReminder && (!refillDays || parseInt(refillDays) <= 0)) {
            alert('Please enter valid number of days for Refill Reminder');
            return;
        }
        if (paymentModes.length === 0) {
            alert('Please select at least one payment mode');
            return;
        }
        if (paymentModes.length > 1) {
            const totalPayment = calculateTotalPayment();
            if (Math.abs(totalPayment - amount) > 0.01) {
                alert(`Payment amounts (₹${totalPayment.toFixed(2)}) must equal sales value (₹${amount.toFixed(2)})`);
                return;
            }
        }

        if (!user?.profile?.outlet_id) {
            alert('No outlet assigned');
            return;
        }

        setSubmitting(true);
        try {
            // Customer Handling
            let finalCustomerId = selectedCustomerId;
            const profile = (user as any).profile;

            if (!customerExists) {
                const newCustomerPayload: any = {
                    outlet_id: profile.outlet_id,
                    phone: customerPhone.trim(),
                    name: customerName.trim(),
                    is_active: true,
                    created_by: user.id,
                    assigned_to_user_id: refillReminder ? user.id : null,
                    referred_by_user_id: referredBy || null
                };

                // Insert Customer with Fallback
                let { data: newCust, error: customerError } = await (supabase as any)
                    .from('customers')
                    .insert(newCustomerPayload)
                    .select()
                    .single();

                if (customerError && (customerError.code === '42703' || customerError.message?.includes('column'))) {
                    console.warn('Fallback: Inserting customer without new columns...');
                    delete newCustomerPayload.assigned_to_user_id;
                    delete newCustomerPayload.referred_by_user_id;
                    const res = await (supabase as any)
                        .from('customers')
                        .insert(newCustomerPayload)
                        .select()
                        .single();
                    newCust = res.data;
                    customerError = res.error;
                }

                if (customerError) {
                    if (customerError.message.includes('duplicate')) {
                        const { data: existing } = await (supabase as any)
                            .from('customers')
                            .select('id')
                            .eq('phone', customerPhone.trim())
                            .single();
                        finalCustomerId = existing?.id;
                    } else {
                        throw customerError;
                    }
                } else {
                    finalCustomerId = newCust.id;
                }
            }

            // Daily Record Handling
            const today = new Date().toISOString().split('T')[0];
            let dailyRecordId: string;
            const { data: existingRecord } = await (supabase as any)
                .from('daily_records')
                .select('id')
                .eq('outlet_id', profile.outlet_id)
                .eq('date', today)
                .maybeSingle();

            if (existingRecord) {
                dailyRecordId = existingRecord.id;
            } else {
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
                if (recordError) throw recordError;
                dailyRecordId = newRecord.id;
            }

            // Transaction
            const transPayload: any = {
                daily_record_id: dailyRecordId,
                outlet_id: profile.outlet_id,
                entry_number: billNumber.trim(),
                type: 'income',
                category: 'sales',
                description: `Sale to ${customerName.trim()} (${customerPhone})`,
                amount: amount,
                payment_modes: paymentModes.join(','),
                customer_phone: customerPhone.trim(),
                customer_id: finalCustomerId,
                created_by: user.id,
                refill_days: refillReminder ? parseInt(refillDays) : null
            };

            let { data: transData, error: transError } = await (supabase as any)
                .from('transactions')
                .insert(transPayload)
                .select()
                .single();

            if (transError && (transError.code === '42703' || transError.message?.includes('column'))) {
                console.warn('Fallback: Inserting transaction without new columns...');
                delete transPayload.refill_days;
                const res = await (supabase as any)
                    .from('transactions')
                    .insert(transPayload)
                    .select()
                    .single();
                transData = res.data;
                transError = res.error;
                if (!transError) {
                    alert('⚠️ Warning: Sale saved, but New Features (Refill Reminder) were NOT saved because the database migration is missing.');
                }
            }

            if (transError) throw transError;

            // Anomaly Detection
            const detected = detectAnomalies(transData);
            if (detected.length > 0) {
                const anomaliesToInsert = detected.map(a => ({
                    ...a,
                    outlet_id: profile.outlet_id,
                    metadata: { ...a.details, transaction_id: transData.id },
                    title: a.description,
                    detected_at: new Date().toISOString()
                }));
                await (supabase as any).from('anomalies').insert(anomaliesToInsert);
            }

            // Audit
            await (supabase as any).from('audit_logs').insert({
                user_id: user.id,
                action: 'CREATE_SALE',
                entity: 'transactions',
                entity_id: transData.id,
                severity: 'normal',
                reason: `Sale created for ₹${amount}`,
            });

            alert('✅ Sales entry submitted!');

            // Reset
            setCustomerPhone('');
            setCustomerName('');
            setCustomerExists(false);
            setBillNumber('');
            setSalesValue('');
            setPaymentModes([]);
            setPaymentAmounts({});
            setRefillReminder(false);
            setRefillDays('');
            setReferredBy('');
            // Keep assignedTo as current user
            setAssignedTo(user.id);

        } catch (e: any) {
            console.error('Submit error:', e);
            alert(`❌ Failed to submit: ${e.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Permission Logic
    const canEditAssignment = useMemo(() => {
        if (!user?.profile?.role) return false;
        // Managers and above can always edit
        if (['outlet_manager', 'ho_accountant', 'master_admin', 'superadmin', 'auditor'].includes(user.profile.role)) {
            return true;
        }
        // Staff can only edit if it's a NEW customer
        return !customerExists;
    }, [user, customerExists]);

    return (
        <div className="flex flex-col h-full">
            <TopBar title="New Sales Entry" />
            <OnlineBanner isOnline={isOnline} />
            <div className="p-6">
                {isLocked && (
                    <div className="max-w-3xl mx-auto mb-6 bg-red-600 text-white px-6 py-4 rounded-xl flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl">🔒</span>
                            <p className="font-bold">Business Day Locked</p>
                        </div>
                    </div>
                )}
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-6">
                        {/* 1. Customer Details */}
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">1</span>
                                Customer Details
                            </h2>
                            <div>
                                <label className="block text-sm font-medium mb-1">Customer Phone <span className="text-red-500">*</span></label>
                                <div className="relative max-w-sm">
                                    <input
                                        type="text"
                                        placeholder="10-digit number"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                                        maxLength={10}
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                    {showSuggestions && customerSuggestions.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-auto">
                                            {customerSuggestions.map((c, idx) => (
                                                <div key={idx} onClick={() => selectCustomer(c)} className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b">
                                                    <div className="text-sm font-bold">{c.name}</div>
                                                    <div className="text-xs text-gray-500">{c.phone}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {customerPhone.length === 10 && (
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Customer Name</label>
                                            <input
                                                type="text"
                                                value={customerName}
                                                onChange={(e) => !customerExists && setCustomerName(e.target.value.toUpperCase())}
                                                disabled={customerExists || isLocked}
                                                className="w-full px-3 py-2 border rounded-md uppercase"
                                            />
                                        </div>



                                        <div title={!canEditAssignment ? "Only Managers can change referral for existing customers." : ""}>
                                            <SearchableSelect
                                                label="Referred By (Optional)"
                                                options={staffList}
                                                value={referredBy}
                                                onChange={setReferredBy}
                                                disabled={!canEditAssignment || isLocked}
                                                placeholder="Search Any Staff..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Sale Details */}
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">2</span>
                                Sale Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Bill Number <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={billNumber}
                                        onChange={(e) => setBillNumber(e.target.value.replace(/\D/g, ''))}
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Sales Value (₹) <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        value={salesValue}
                                        onChange={(e) => setSalesValue(e.target.value)}
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 border rounded-md font-bold"
                                    />
                                </div>
                            </div>

                            {/* Refill Reminder */}
                            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="refill"
                                        checked={refillReminder}
                                        onChange={(e) => setRefillReminder(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <label htmlFor="refill" className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer select-none">
                                        Set Refill Reminder for this sale
                                    </label>
                                </div>
                                {refillReminder && (
                                    <div className="mt-3 flex items-center gap-3">
                                        <span className="text-sm">Purchased for:</span>
                                        <input
                                            type="number"
                                            value={refillDays}
                                            onChange={(e) => setRefillDays(e.target.value)}
                                            placeholder="30"
                                            className="w-20 px-2 py-1 border rounded text-center"
                                        />
                                        <span className="text-sm">days</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Payment Modes */}
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">3</span>
                                Payment
                            </h2>
                            <div className="flex flex-wrap gap-4 mb-4">
                                {['Cash', 'UPI', 'Card', 'Credit'].map(mode => (
                                    <label key={mode} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={paymentModes.includes(mode)}
                                            onChange={() => handlePaymentModeChange(mode)}
                                            disabled={isLocked}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span>{mode}</span>
                                    </label>
                                ))}
                            </div>

                            {paymentModes.length > 1 && (
                                <div className="space-y-3 bg-blue-50 p-4 rounded small">
                                    {paymentModes.map(mode => (
                                        <div key={mode} className="flex gap-2 items-center">
                                            <span className="w-16">{mode}:</span>
                                            <input
                                                type="number"
                                                value={paymentAmounts[mode] || ''}
                                                onChange={(e) => handlePaymentAmountChange(mode, e.target.value)}
                                                className="flex-1 px-2 py-1 border rounded"
                                            />
                                        </div>
                                    ))}
                                    <div className="flex justify-between font-bold border-t pt-2">
                                        <span>Total: {calculateTotalPayment()}</span>
                                        <span>Expected: {salesValue}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold mt-4"
                            >
                                {submitting ? 'Submitting...' : 'Submit Entry'}
                            </button>
                        </div>
                    </div>

                    <div className="w-full lg:w-96">
                        <RecentTransactions
                            outletId={user?.profile?.outlet_id || ''}
                            category="sales"
                            title="Recent Sales"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
