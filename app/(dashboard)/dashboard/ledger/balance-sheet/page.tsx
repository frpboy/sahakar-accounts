'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Download, Scale, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BalanceSheetPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [bs, setBs] = useState({
        assets: { total: 0, cash: 0, bank: 0, receivables: 0 },
        liabilities: { total: 0, payables: 0 },
        equity: { total: 0, retainedEarnings: 0 }
    });
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const loadBalanceSheet = useCallback(async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        try {
            // Fetch ALL transactions up to date
            const toDateObj = new Date(date);
            toDateObj.setDate(toDateObj.getDate() + 1);
            const toDateNext = toDateObj.toISOString().split('T')[0];

            const { data, error } = await (supabase as any)
                .from('transactions')
                .select('type, category, amount, payment_mode')
                .eq('outlet_id', user.profile.outlet_id)
                .lte('created_at', `${toDateNext}T02:00:00`);

            if (error) throw error;

            const res = {
                assets: { total: 0, cash: 0, bank: 0, receivables: 0 },
                liabilities: { total: 0, payables: 0 },
                equity: { total: 0, retainedEarnings: 0 }
            };

            // Aggregation
            // 1. Calculate P&L (Retained Earnings)
            let income = 0;
            let expense = 0;

            // 2. Calc Balances
            data?.forEach((t: any) => {
                const amt = Number(t.amount);

                // Asset: Cash
                if (t.payment_mode === 'Cash') {
                    if (t.type === 'income') res.assets.cash += amt;
                    else res.assets.cash -= amt;
                }

                // Asset: Bank
                if (['UPI', 'Card', 'Bank Transfer'].includes(t.payment_mode)) {
                    if (t.type === 'income') res.assets.bank += amt;
                    else res.assets.bank -= amt;
                }

                // Asset: Receivables (Credit Given)
                if (t.category === 'sales' && t.payment_mode === 'Credit') {
                    res.assets.receivables += amt;
                }
                if (t.category === 'credit_received') {
                    res.assets.receivables -= amt;
                }

                // Equity: Retained Earnings (Income - Expense)
                // Note: P&L is what balances the equation if Cash/Bank matches Income/Expense
                if (t.type === 'income') income += amt;
                if (t.type === 'expense') expense += amt;
            });

            res.equity.retainedEarnings = income - expense;

            // Equation: Assets = Liabilities + Equity
            // In a closed system derived from Single Entry:
            // Cash + Bank + Receivables should equal Retained Earnings + (Payables if any)
            // But wait:
            // Income (Sales Credit) increases Receivables and Income.
            // Income (Sales Cash) increases Cash and Income.
            // Expense (Cash) decreases Cash and increases Expense (which reduces Equity).
            // So: Assets = Equity (Retained Earnings) is the base equation if Liabilities=0.

            res.assets.total = res.assets.cash + res.assets.bank + res.assets.receivables;
            res.equity.total = res.equity.retainedEarnings; // + Capital if tracked
            res.liabilities.total = res.liabilities.payables;

            setBs(res);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, date, supabase]);

    useEffect(() => {
        loadBalanceSheet();
    }, [loadBalanceSheet]);

    const isBalanced = Math.abs(bs.assets.total - (bs.liabilities.total + bs.equity.total)) < 1; // Tolerance

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Balance Sheet" />

            <div className="p-4 border-b bg-white dark:bg-gray-800 flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">As On:</span>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-40"
                    />
                    <Button onClick={loadBalanceSheet} variant="secondary">Run Report</Button>
                </div>
                <Button variant="outline"><Download className="w-4 h-4 mr-2" /> PDF</Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Assets */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden">
                        <div className="p-4 border-b bg-blue-50 dark:bg-blue-900/20 text-blue-700 font-bold flex justify-between">
                            <span>Assets</span>
                            <span>₹{bs.assets.total.toLocaleString()}</span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between border-b pb-2">
                                <span>Cash in Hand</span>
                                <span className="font-mono">₹{bs.assets.cash.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span>Bank / UPI Accounts</span>
                                <span className="font-mono">₹{bs.assets.bank.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span>Customer Receivables</span>
                                <span className="font-mono">₹{bs.assets.receivables.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Liabilities + Equity */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden">
                        <div className="p-4 border-b bg-purple-50 dark:bg-purple-900/20 text-purple-700 font-bold flex justify-between">
                            <span>Equity & Liabilities</span>
                            <span>₹{(bs.equity.total + bs.liabilities.total).toLocaleString()}</span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between border-b pb-2">
                                <span>Accounts Payable</span>
                                <span className="font-mono">₹{bs.liabilities.payables.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2 font-semibold text-gray-700 dark:text-gray-300">
                                <span>Retained Earnings (Net Profit)</span>
                                <span className="font-mono">₹{bs.equity.retainedEarnings.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={cn(
                    "max-w-4xl mx-auto mt-8 p-4 rounded-lg flex items-center justify-center gap-2 font-bold text-lg border",
                    isBalanced ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                )}>
                    {isBalanced ? (
                        <>
                            <CheckCircle2 className="w-6 h-6" />
                            Balance Sheet Matches
                        </>
                    ) : (
                        <>
                            <AlertTriangle className="w-6 h-6" />
                            Mismatch: ₹{(bs.assets.total - (bs.equity.total + bs.liabilities.total)).toLocaleString()}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
