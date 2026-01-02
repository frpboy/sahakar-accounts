'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function TrialBalancePage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [ledgerData, setLedgerData] = useState<any[]>([]);
    const [totals, setTotals] = useState({ debit: 0, credit: 0 });
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // "As On" Date

    const loadTrialBalance = useCallback(async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        try {
            // Fetch ALL transactions up to selected date (End of Day Business Time)
            const toDateObj = new Date(date);
            toDateObj.setDate(toDateObj.getDate() + 1);
            const toDateNext = toDateObj.toISOString().split('T')[0];

            const { data, error } = await (supabase as any)
                .from('transactions')
                .select('type, category, amount, payment_mode')
                .eq('outlet_id', user.profile.outlet_id)
                .lte('created_at', `${toDateNext}T02:00:00`);

            if (error) throw error;

            // Aggregation Logic
            // Groups: Cash, Bank, Sales, Purchase, Expenses, Customers, Suppliers/Others
            const groups: Record<string, { debit: number; credit: number }> = {
                'Cash': { debit: 0, credit: 0 },
                'Bank / UPI': { debit: 0, credit: 0 },
                'Sales Account': { debit: 0, credit: 0 },
                'Purchase Account': { debit: 0, credit: 0 },
                'Operating Expenses': { debit: 0, credit: 0 },
                'Customer Receivables': { debit: 0, credit: 0 }, // Simplified
            };

            data?.forEach((t: any) => {
                const amt = Number(t.amount);

                // 1. Impact on Cash/Bank
                if (t.payment_mode === 'Cash') {
                    if (t.type === 'income') groups['Cash'].debit += amt; // Cash In
                    else groups['Cash'].credit += amt; // Cash Out
                } else if (['UPI', 'Card', 'Bank Transfer'].includes(t.payment_mode)) {
                    if (t.type === 'income') groups['Bank / UPI'].debit += amt;
                    else groups['Bank / UPI'].credit += amt;
                } else if (t.payment_mode === 'Credit') {
                    // Credit Tx
                    // If Sales -> Debit Customer
                }

                // 2. Impact on Head (Sales/Purchase/Exp)
                if (t.category === 'sales') {
                    // Credit Sales Account
                    if (t.type === 'income') groups['Sales Account'].credit += amt;

                    // If mode is Credit, Debit Customer
                    if (t.payment_mode === 'Credit') {
                        groups['Customer Receivables'].debit += amt;
                    }
                } else if (t.category === 'purchase') {
                    // Debit Purchase Account
                    if (t.type === 'expense') groups['Purchase Account'].debit += amt;
                } else if (['expense', 'salary', 'rent'].includes(t.category) || t.type === 'expense') {
                    // Check if not purchase
                    if (t.category !== 'purchase') {
                        groups['Operating Expenses'].debit += amt;
                    }
                }

                // Credit Received/Given
                if (t.category === 'credit_received') {
                    // Customer pays us. 
                    // Cash/Bank Debit (Handled above in 1)
                    // Customer Credit
                    groups['Customer Receivables'].credit += amt;
                }
            });

            // Convert to Array
            const rows = Object.entries(groups).map(([name, val]) => ({
                name,
                debit: val.debit,
                credit: val.credit
            }));

            // Calc Totals
            const totalDr = rows.reduce((s, r) => s + r.debit, 0);
            const totalCr = rows.reduce((s, r) => s + r.credit, 0);

            setLedgerData(rows);
            setTotals({ debit: totalDr, credit: totalCr });

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, date, supabase]);

    useEffect(() => {
        loadTrialBalance();
    }, [loadTrialBalance]);

    const isBalanced = totals.debit === totals.credit;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Trial Balance" />

            <div className="p-4 border-b bg-white dark:bg-gray-800 flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">As On:</span>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-40"
                    />
                    <Button onClick={loadTrialBalance} variant="secondary">Run Report</Button>
                </div>
                <Button variant="outline"><Download className="w-4 h-4 mr-2" /> PDF</Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden max-w-4xl mx-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-4 py-3">Ledger Account</th>
                                <th className="px-4 py-3 text-right">Debit</th>
                                <th className="px-4 py-3 text-right">Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={3} className="p-4 text-center">Loading...</td></tr>
                            ) : (
                                <>
                                    {ledgerData.map((row) => (
                                        <tr key={row.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3 font-medium">{row.name}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">
                                                {row.debit > 0 ? `₹${row.debit.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600">
                                                {row.credit > 0 ? `₹${row.credit.toLocaleString()}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 dark:bg-gray-800 font-bold border-t-2 border-gray-300">
                                        <td className="px-4 py-3">TOTAL</td>
                                        <td className="px-4 py-3 text-right">₹{totals.debit.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">₹{totals.credit.toLocaleString()}</td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && (
                    <div className={cn(
                        "max-w-4xl mx-auto mt-4 p-4 rounded-lg flex items-center justify-center gap-2 font-bold",
                        isBalanced ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                        {isBalanced ? (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                Trial Balance is Perfect
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="w-5 h-5" />
                                Mismatch Found (Only visible if Logic Incomplete)
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
