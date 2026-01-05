'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Clock, Upload } from 'lucide-react';
import { RecentTransactions } from '@/components/history/recent-transactions';

export default function PurchasePage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();

    // Form state
    const [supplierName, setSupplierName] = useState('');
    const [erpId, setErpId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [voucherNumber, setVoucherNumber] = useState('');

    // Amounts
    const [purchaseAmount, setPurchaseAmount] = useState('');
    const [otherCharges, setOtherCharges] = useState('');

    const [bankTxId, setBankTxId] = useState('');
    const [remarks, setRemarks] = useState('');

    const [cashAmount, setCashAmount] = useState('');
    const [creditAmount, setCreditAmount] = useState('');
    const [bankAmount, setBankAmount] = useState('');
    const [purchaseLedgerId, setPurchaseLedgerId] = useState<string | null>(null);

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

    // Fetch Default Purchase Ledger
    useEffect(() => {
        async function fetchLedger() {
            try {
                const { data } = await supabase
                    .from('ledger_accounts')
                    .select('id')
                    .eq('name', 'Purchases')
                    .single();
                if (data) setPurchaseLedgerId(data.id);
            } catch (e) {
                console.error("Failed to fetch purchase ledger", e);
            }
        }
        fetchLedger();
    }, [supabase]);

    // Auto-generate Voucher Number on mount
    useEffect(() => {
        if (!voucherNumber && user?.profile?.outlet_id) {
            // Generate format: PUR-YYYYMMDD-HHMMSS
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            // PUR prefix for Inventory Purchase
            const generatedVoucher = `PUR-${year}${month}${day}-${hours}${minutes}${seconds}`;
            setVoucherNumber(generatedVoucher);
        }
    }, [user, voucherNumber]);

    const handleSubmit = async () => {
        if (isLocked) {
            alert('❌ This business day is locked. New entries are not allowed.');
            return;
        }
        // Validation
        if (!supplierName.trim()) {
            alert('Please enter Supplier Name');
            return;
        }
        if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) {
            alert('Please enter Purchase Amount');
            return;
        }

        const pAmount = parseFloat(purchaseAmount) || 0;
        const oCharges = parseFloat(otherCharges) || 0;
        const totalExpected = pAmount + oCharges;

        const cash = parseFloat(cashAmount) || 0;
        const credit = parseFloat(creditAmount) || 0;
        const bank = parseFloat(bankAmount) || 0;

        const totalPayment = cash + credit + bank;

        if (Math.abs(totalPayment - totalExpected) > 0.01) {
            alert(`Payment mismatch! Total: ₹${totalExpected.toFixed(2)}, Paid: ₹${totalPayment.toFixed(2)}`);
            return;
        }

        if (selectedModes.includes('Bank') && !bankTxId.trim()) {
            alert('Please enter Bank Transaction ID');
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
            if (credit > 0) modes.push('Credit');
            if (bank > 0) modes.push('Bank');

            // Prepare Payload
            const baseDescription = `Inventory Purchase from ${supplierName} (Inv: ${invoiceNumber || 'N/A'})`;
            let finalDescription = baseDescription;

            const payload: any = {
                daily_record_id: dailyRecordId,
                outlet_id: user.profile.outlet_id,
                entry_number: voucherNumber,
                // These columns might be missing
                external_bill_number: invoiceNumber || null,
                erp_id: erpId || null,
                supplier_name: supplierName,
                type: 'expense',
                category: 'purchase',
                description: finalDescription,
                amount: totalExpected,
                payment_modes: modes.join(','),
                created_by: user.id,
                other_charges: oCharges,
                bank_tx_id: bankTxId || null,
                remarks: remarks || null,
                ledger_account_id: purchaseLedgerId // Required field
            };

            let { error } = await (supabase as any)
                .from('transactions')
                .insert(payload);

            // Fallback
            if (error && (error.code === '42703' || error.message?.includes('column'))) {
                console.warn('Fallback: Inserting purchase without new columns...');

                // Append all extra info to description
                if (invoiceNumber) finalDescription += ` | Bill: ${invoiceNumber}`;
                if (erpId) finalDescription += ` | ERP: ${erpId}`;
                if (supplierName) finalDescription += ` | Supplier: ${supplierName}`;
                if (oCharges) finalDescription += ` | Other Charges: ${oCharges}`;
                if (bankTxId) finalDescription += ` | Bank Ref: ${bankTxId}`;
                if (remarks) finalDescription += ` | Remarks: ${remarks}`;

                const fallbackPayload = { ...payload };
                // Delete potential missing columns
                delete fallbackPayload.external_bill_number;
                delete fallbackPayload.erp_id;
                delete fallbackPayload.supplier_name;
                delete fallbackPayload.other_charges;
                delete fallbackPayload.bank_tx_id;
                delete fallbackPayload.remarks;

                fallbackPayload.description = finalDescription;

                const retry = await (supabase as any)
                    .from('transactions')
                    .insert(fallbackPayload);
                error = retry.error;

                if (!error) {
                    alert('⚠️ Warning: Saved, but DB migration missing. Extra details appended to description.');
                }
            }

            if (error) throw error;

            alert('✅ Purchase entry saved!');
            setSupplierName('');
            setErpId('');
            setInvoiceNumber('');
            setVoucherNumber(''); // Trigger auto-gen
            setPurchaseAmount('');
            setOtherCharges('');
            setBankTxId('');
            setRemarks('');
            setCashAmount('');
            setCreditAmount('');
            setBankAmount('');
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
            <TopBar title="Inventory Purchase" />
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
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Inventory Purchase Details</h2>

                            <div className="space-y-6">
                                {/* Row 1: Supplier & Voucher */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Supplier Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Enter Supplier Name"
                                            value={supplierName}
                                            onChange={(e) => setSupplierName(e.target.value.toUpperCase())}
                                            disabled={isLocked}
                                            className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Voucher Number (Internal)</label>
                                        <input
                                            type="text"
                                            value={voucherNumber}
                                            onChange={(e) => setVoucherNumber(e.target.value.toUpperCase())}
                                            disabled={isLocked}
                                            className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Row 2: ERP & Invoice */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">ERP Entry Number</label>
                                        <input
                                            type="text"
                                            placeholder="From HO ERP"
                                            value={erpId}
                                            onChange={(e) => setErpId(e.target.value)}
                                            disabled={isLocked}
                                            className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Bill / Invoice Number</label>
                                        <input
                                            type="text"
                                            placeholder="From Supplier Bill"
                                            value={invoiceNumber}
                                            onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                                            disabled={isLocked}
                                            className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                        />
                                    </div>
                                </div>

                                {/* Row 3: Totals */}
                                <div className="p-4 bg-gray-50 dark:bg-slate-950 rounded-lg border dark:border-slate-800">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Purchase Amount (₹) <span className="text-red-500">*</span></label>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={purchaseAmount}
                                                onChange={(e) => setPurchaseAmount(e.target.value)}
                                                disabled={isLocked}
                                                className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Other Charges (₹)</label>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={otherCharges}
                                                onChange={(e) => setOtherCharges(e.target.value)}
                                                disabled={isLocked}
                                                className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Extra freight, loading, etc. not in bill amount</p>
                                        </div>
                                    </div>
                                </div>


                                {/* Payment Modes Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-2">Select Payment Mode(s) <span className="text-red-500">*</span></label>
                                    <div className="flex gap-4 mb-4 flex-wrap">
                                        {['Cash', 'Credit', 'Bank'].map((mode) => (
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {selectedModes.includes('Cash') && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Cash (₹)</label>
                                                <input
                                                    type="number"
                                                    value={cashAmount}
                                                    onChange={(e) => setCashAmount(e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-md"
                                                />
                                            </div>
                                        )}

                                        {selectedModes.includes('Credit') && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Credit (₹)</label>
                                                <input
                                                    type="number"
                                                    value={creditAmount}
                                                    onChange={(e) => setCreditAmount(e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-md"
                                                />
                                            </div>
                                        )}
                                        {selectedModes.includes('Bank') && (
                                            <div className="md:col-span-2 lg:col-span-1">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Bank Transfer (₹)</label>
                                                <input
                                                    type="number"
                                                    value={bankAmount}
                                                    onChange={(e) => setBankAmount(e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-md"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Bank TX Details */}
                                    {selectedModes.includes('Bank') && (
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Reference / Transaction ID <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="e.g. UTR Number, Cheque No"
                                                value={bankTxId}
                                                onChange={(e) => setBankTxId(e.target.value)}
                                                className="w-full px-3 py-2 border rounded-md bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Remarks */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Remarks</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Any additional notes..."
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        disabled={isLocked}
                                        className="w-full px-3 py-2 border dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>


                                {!isLocked && (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium mt-4 shadow-lg shadow-blue-200 dark:shadow-none"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Inventory Purchase'}
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
                            title="Recent Inventory"
                        />
                        <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl p-4 transition-colors">
                            <h4 className="text-[10px] font-black text-purple-900 dark:text-purple-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Upload className="w-3 h-3" />
                                Stock Policy
                            </h4>
                            <div className="space-y-2 text-[10px] text-purple-700 dark:text-purple-400">
                                <p>• <strong>Strict Entry</strong>: All inventory bills must be entered same-day.</p>
                                <p>• <strong>Verification</strong>: Upload photo of bill if required.</p>
                                <p>• <strong>Bank Payments</strong>: Must include UTR/Reference No.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
