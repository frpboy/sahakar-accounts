'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Calculator,
    Wallet,
    IndianRupee,
    ArrowUpRight,
    ArrowDownRight,
    Scale,
    AlertTriangle,
    CheckCircle2,
    Info,
    RefreshCcw,
    Save
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DailySummaryData {
    id: string;
    date: string;
    opening_cash: number;
    opening_upi: number;
    closing_cash: number;
    closing_upi: number;
    total_income: number;
    total_expense: number;
    physical_cash: number;
    physical_upi: number;
    tally_comment: string | null;
    status: string;
}

export function DailySummary() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const [data, setData] = useState<DailySummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state for physical tally
    const [form, setForm] = useState({
        physical_cash: '0',
        physical_upi: '0',
        tally_comment: ''
    });

    const loadData = async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/daily-records/today');
            if (!response.ok) throw new Error('Failed to fetch daily record');
            const result = await response.json();
            setData(result);
            setForm({
                physical_cash: (result.physical_cash || 0).toString(),
                physical_upi: (result.physical_upi || 0).toString(),
                tally_comment: result.tally_comment || ''
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user, supabase]);

    const handleSaveTally = async () => {
        if (!data) return;
        setIsSaving(true);
        try {
            const { error } = await (supabase as any)
                .from('daily_records')
                .update({
                    physical_cash: parseFloat(form.physical_cash) || 0,
                    physical_upi: parseFloat(form.physical_upi) || 0,
                    tally_comment: form.tally_comment
                })
                .eq('id', data.id);

            if (error) throw error;

            // Refresh data
            await loadData();
            alert('✅ Tally details saved successfully');
        } catch (err: any) {
            alert('❌ Failed to save: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-8 animate-pulse">
            <div className="h-4 w-32 bg-gray-200 dark:bg-slate-800 rounded mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-slate-800 rounded-xl" />)}
            </div>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-6 rounded-2xl text-red-600 flex flex-col items-center">
            <AlertTriangle className="w-10 h-10 mb-2" />
            <p className="font-bold">Error loading summary</p>
            <p className="text-sm">{error}</p>
            <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold">Retry</button>
        </div>
    );

    if (!data) return null;

    // Calculations
    const expectedClosingCash = (data.opening_cash || 0) + (data.total_income || 0) - (data.total_expense || 0);
    // Note: total_income/expense from daily_records is currently a global sum. 
    // In a real scenario, we might want to split income/expense by Cash vs UPI for better tallying.
    // However, for now, we'll assume total_income matches the total expected increase.

    // Improvement for future: Split income/expense by payment_mode in daily_records.
    // For now, let's treat expected closing as total expected liquidity.
    const physicalCash = parseFloat(form.physical_cash) || 0;
    const physicalUpi = parseFloat(form.physical_upi) || 0;
    const totalExpectedLiquidity = (data.opening_cash || 0) + (data.opening_upi || 0) + (data.total_income || 0) - (data.total_expense || 0);
    const totalPhysical = physicalCash + physicalUpi;
    const difference = totalPhysical - totalExpectedLiquidity;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold dark:text-white">Daily Financial Summary</h2>
                        <p className="text-xs text-gray-400">Real-time status for {format(new Date(data.date), 'dd MMM yyyy')}</p>
                    </div>
                </div>
                <button onClick={loadData} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <RefreshCcw className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            <div className="p-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="p-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-800">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Opening Balance</p>
                        <p className="text-xl font-bold dark:text-white">₹{((data.opening_cash || 0) + (data.opening_upi || 0)).toLocaleString()}</p>
                        <div className="flex gap-2 mt-1 opacity-60 text-[10px]">
                            <span className="dark:text-slate-400">Cash: ₹{data.opening_cash?.toLocaleString()}</span>
                            <span className="dark:text-slate-400">UPI: ₹{data.opening_upi?.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="p-4 bg-green-50/30 dark:bg-green-900/10 rounded-xl border border-green-100/50 dark:border-green-900/20">
                        <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> Total Income
                        </p>
                        <p className="text-xl font-bold text-green-700 dark:text-green-300">₹{(data.total_income || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-green-600/70 mt-1">Total cash/UPI received</p>
                    </div>

                    <div className="p-4 bg-red-50/30 dark:bg-red-900/10 rounded-xl border border-red-100/50 dark:border-red-900/20">
                        <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <ArrowDownRight className="w-3 h-3" /> Total Expenses
                        </p>
                        <p className="text-xl font-bold text-red-700 dark:text-red-300">₹{(data.total_expense || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-red-600/70 mt-1">Cash/UPI spent/refunded</p>
                    </div>

                    <div className="p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-900/20">
                        <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Wallet className="w-3 h-3" /> Expected In-Hand
                        </p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-300">₹{totalExpectedLiquidity.toLocaleString()}</p>
                        <p className="text-[10px] text-blue-600/70 mt-1">Cash + UPI expected</p>
                    </div>
                </div>

                {/* Tallying Section */}
                <div className="bg-gray-50 dark:bg-slate-950 rounded-2xl p-6 border dark:border-slate-800">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Inputs */}
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Scale className="w-4 h-4 text-gray-900 dark:text-white" />
                                <h3 className="font-bold dark:text-white">Physical Tally Entry</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Physical Cash (₹)</label>
                                    <input
                                        type="number"
                                        value={form.physical_cash}
                                        onChange={(e) => setForm(prev => ({ ...prev, physical_cash: e.target.value }))}
                                        className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl px-4 py-3 text-lg font-bold dark:text-white"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Physical UPI (₹)</label>
                                    <input
                                        type="number"
                                        value={form.physical_upi}
                                        onChange={(e) => setForm(prev => ({ ...prev, physical_upi: e.target.value }))}
                                        className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl px-4 py-3 text-lg font-bold dark:text-white"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Correction / Anomaly Comments</label>
                                <textarea
                                    value={form.tally_comment}
                                    onChange={(e) => setForm(prev => ({ ...prev, tally_comment: e.target.value }))}
                                    className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl px-4 py-2 text-sm dark:text-slate-300"
                                    rows={2}
                                    placeholder="Explain any mismatch here..."
                                />
                            </div>

                            <button
                                onClick={handleSaveTally}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'Saving...' : 'Save Tally Details'}
                            </button>
                        </div>

                        {/* Result Display */}
                        <div className="w-full lg:w-80 flex flex-col items-center justify-center p-6 border-l dark:border-slate-800">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-tighter">Current Difference</p>

                            <div className={cn(
                                "text-4xl font-black mb-2",
                                Math.abs(difference) < 0.1 ? "text-green-500" : "text-red-500"
                            )}>
                                ₹{difference.toLocaleString()}
                            </div>

                            {Math.abs(difference) < 0.1 ? (
                                <div className="flex items-center gap-2 py-2 px-4 bg-green-500/10 text-green-500 rounded-full text-xs font-bold border border-green-500/20">
                                    <CheckCircle2 className="w-4 h-4" /> Perfect Tally
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 py-2 px-4 bg-red-500/10 text-red-500 rounded-full text-xs font-bold border border-red-500/20">
                                    <AlertTriangle className="w-4 h-4" /> Mismatch
                                </div>
                            )}

                            <div className="mt-8 text-center">
                                <p className="text-lg font-black dark:text-white">₹{totalPhysical.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400">Total Physical Liquid (Combined)</p>
                            </div>

                            <div className="mt-6 flex flex-col gap-2 w-full">
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-100 dark:bg-slate-900 p-3 rounded-lg border dark:border-slate-800 leading-tight">
                                    <Info className="w-4 h-4 flex-shrink-0" />
                                    <span>Tallying is mandatory before ending shift. Mismatches require a detailed comment.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
