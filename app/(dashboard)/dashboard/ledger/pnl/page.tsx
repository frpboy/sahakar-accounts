'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function PnLPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [pnl, setPnl] = useState({
        income: { total: 0, sales: 0, other: 0 },
        expense: { total: 0, purchase: 0, operating: 0 },
        netProfit: 0
    });
    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().substring(0, 7) + '-01',
        to: new Date().toISOString().split('T')[0]
    });

    const loadPnL = useCallback(async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        try {
            const toDateObj = new Date(dateRange.to);
            toDateObj.setDate(toDateObj.getDate() + 1);
            const toDateNext = toDateObj.toISOString().split('T')[0];

            const { data, error } = await (supabase as any)
                .from('transactions')
                .select('type, category, amount')
                .eq('outlet_id', user.profile.outlet_id)
                .gte('created_at', `${dateRange.from}T07:00:00`)
                .lte('created_at', `${toDateNext}T02:00:00`);

            if (error) throw error;

            const res = {
                income: { total: 0, sales: 0, other: 0 },
                expense: { total: 0, purchase: 0, operating: 0 },
                netProfit: 0
            };

            data?.forEach((t: any) => {
                const amt = Number(t.amount);

                // Rule: Netting Reversals
                // A reversal of an 'income' is an 'expense' on that same category.
                if (t.category === 'sales') {
                    if (t.type === 'income') res.income.sales += amt;
                    else if (t.type === 'expense') res.income.sales -= amt; // Sales Return
                } else if (t.category === 'purchase') {
                    if (t.type === 'expense') res.expense.purchase += amt;
                    else if (t.type === 'income') res.expense.purchase -= amt; // Purchase Return
                } else if (t.type === 'income') {
                    res.income.other += amt;
                } else if (t.type === 'expense') {
                    res.expense.operating += amt;
                }
            });

            // Recalculate Totals
            res.income.total = res.income.sales + res.income.other;
            res.expense.total = res.expense.purchase + res.expense.operating;
            res.netProfit = res.income.total - res.expense.total;
            setPnl(res);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, dateRange, supabase]);

    useEffect(() => {
        loadPnL();
    }, [loadPnL]);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Profit & Loss" />

            <div className="p-4 border-b bg-white dark:bg-gray-800 flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                        className="w-32"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                        className="w-32"
                    />
                    <Button onClick={loadPnL} variant="secondary">Calc P&L</Button>
                </div>
                <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {/* Income Side */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden">
                        <div className="p-4 border-b bg-green-50 dark:bg-green-900/20 text-green-700 font-bold flex justify-between">
                            <span>Income</span>
                            <span>₹{pnl.income.total.toLocaleString()}</span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between border-b pb-2">
                                <span>Sales Revenue</span>
                                <span className="font-mono">₹{pnl.income.sales.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2 text-gray-500">
                                <span>Other Income</span>
                                <span className="font-mono">₹{pnl.income.other.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Expense Side */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden">
                        <div className="p-4 border-b bg-red-50 dark:bg-red-900/20 text-red-700 font-bold flex justify-between">
                            <span>Expenses</span>
                            <span>₹{pnl.expense.total.toLocaleString()}</span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between border-b pb-2">
                                <span>Purchase Cost</span>
                                <span className="font-mono">₹{pnl.expense.purchase.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span>Operating Expenses</span>
                                <span className="font-mono">₹{pnl.expense.operating.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Net Profit Summary */}
                <div className="max-w-5xl mx-auto mt-8">
                    <div className={cn(
                        "p-6 rounded-xl border flex items-center justify-between shadow-sm",
                        pnl.netProfit >= 0 ? "bg-green-600 text-white" : "bg-red-600 text-white"
                    )}>
                        <div className="flex items-center gap-4">
                            {pnl.netProfit >= 0 ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
                            <div>
                                <h3 className="text-xl font-bold opacity-90">{pnl.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</h3>
                                <p className="opacity-75 text-sm">Income - Expenses</p>
                            </div>
                        </div>
                        <div className="text-3xl font-bold font-mono">
                            ₹{Math.abs(pnl.netProfit).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
