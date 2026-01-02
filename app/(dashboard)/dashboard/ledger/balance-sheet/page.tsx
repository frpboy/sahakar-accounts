'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Scale, ShieldCheck, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function BalanceSheetPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const [sheetData, setSheetData] = useState({
        assets: { total: 0, items: [] as any[] },
        liabilities: { total: 0, items: [] as any[] },
        equity: { total: 0, items: [] as any[] }
    });

    const loadBalanceSheet = useCallback(async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        try {
            // Netting all transactions up to target date
            const { data, error } = await (supabase as any)
                .from('transactions')
                .select('type, category, amount, payment_modes, ledger_account_id')
                .eq('outlet_id', user.profile.outlet_id)
                .lte('created_at', `${date}T23:59:59`); // Use end of day for BS

            if (error) throw error;

            // Simplified mapping for Balance Sheet
            // Real BS would use Chart of Accounts, but let's derive from current categories
            // Categories: sales, purchase, expense, credit, return

            let cash = 0;
            let bank = 0;
            let receivables = 0;
            let payables = 0; // Purchase credits
            let equity = 0; // Simulated opening + retained earnings

            data?.forEach((t: any) => {
                const amt = Number(t.amount);
                const isIncome = t.type === 'income';

                // Asset side
                if (t.payment_modes?.includes('Cash')) {
                    cash += isIncome ? amt : -amt;
                }
                if (t.payment_modes?.includes('UPI') || t.payment_modes?.includes('Card') || t.payment_modes?.includes('Bank')) {
                    bank += isIncome ? amt : -amt;
                }
                if (t.payment_modes?.includes('Credit') && t.category === 'sales') {
                    receivables += isIncome ? amt : -amt;
                }

                // Liabilities
                if (t.category === 'purchase' && t.payment_modes?.includes('Credit')) {
                    payables += (t.type === 'expense') ? amt : -amt;
                }
            });

            // Derive Equity (Retained Earnings)
            // Profit = Income - Expense
            let incomeTotal = 0;
            let expenseTotal = 0;
            data?.forEach((t: any) => {
                if (t.type === 'income') incomeTotal += Number(t.amount);
                else expenseTotal += Number(t.amount);
            });
            equity = incomeTotal - expenseTotal;

            setSheetData({
                assets: {
                    total: cash + bank + receivables,
                    items: [
                        { name: 'Cash in Hand', value: cash },
                        { name: 'Bank & Digital', value: bank },
                        { name: 'Customer Receivables', value: receivables }
                    ]
                },
                liabilities: {
                    total: payables,
                    items: [
                        { name: 'Supplier Payables', value: payables }
                    ]
                },
                equity: {
                    total: equity,
                    items: [
                        { name: 'Retained Earnings', value: equity }
                    ]
                }
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, date, supabase]);

    useEffect(() => {
        loadBalanceSheet();
    }, [loadBalanceSheet]);

    const assetTotal = sheetData.assets.total;
    const liabilityEquityTotal = sheetData.liabilities.total + sheetData.equity.total;
    const isBalanced = Math.abs(assetTotal - liabilityEquityTotal) < 1;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Balance Sheet" />

            <div className="p-4 border-b bg-white dark:bg-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Scale className="w-5 h-5 text-indigo-600" />
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-40"
                    />
                    <Button onClick={loadBalanceSheet} variant="secondary" size="sm">Generate</Button>
                </div>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> PDF Report</Button>
            </div>

            <div className="flex-1 overflow-auto p-6 max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* ASSETS */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b-2 border-indigo-600 pb-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Assets</h3>
                            <span className="text-xl font-bold text-indigo-700">₹{assetTotal.toLocaleString()}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 space-y-3">
                            {sheetData.assets.items.map((item, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                                    <span className="font-mono">₹{item.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* LIABILITIES & EQUITY */}
                    <div className="space-y-8">
                        {/* Liabilities */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b-2 border-amber-600 pb-2">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Liabilities</h3>
                                <span className="text-xl font-bold text-amber-700">₹{sheetData.liabilities.total.toLocaleString()}</span>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 space-y-3">
                                {sheetData.liabilities.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                                        <span className="font-mono">₹{item.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Equity */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-2">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Equity</h3>
                                <span className="text-xl font-bold text-emerald-700">₹{sheetData.equity.total.toLocaleString()}</span>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 space-y-3">
                                {sheetData.equity.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                                        <span className="font-mono">₹{item.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final Equation */}
                <div className={cn(
                    "mt-12 p-8 rounded-2xl border-2 flex flex-col md:flex-row items-center justify-between transition-all",
                    isBalanced
                        ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                        : "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
                )}>
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                        {isBalanced
                            ? <ShieldCheck className="w-12 h-12 text-green-600" />
                            : <AlertCircle className="w-12 h-12 text-red-600" />
                        }
                        <div>
                            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {isBalanced ? 'Sheet Balanced' : 'Out of Balance'}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400">Assets = Liabilities + Equity</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="text-sm font-mono text-gray-500">₹{assetTotal.toLocaleString()} = ₹{liabilityEquityTotal.toLocaleString()}</div>
                        <div className={cn(
                            "text-4xl font-black font-serif",
                            isBalanced ? "text-green-700" : "text-red-700"
                        )}>
                            {isBalanced ? 'PASSED' : 'FAILED'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
