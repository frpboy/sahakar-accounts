'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Download, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { canEditTransaction } from '@/lib/ledger-logic';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function DayBookPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    // Default to Today for Day Book
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const loadDayBook = useCallback(async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        try {
            // Business Day Logic applied? Or strictly Calendar day for Day Book?
            // "Day Book" usually implies the Shift/Business Day.
            // Let's use the 7AM to 2AM Logic for the Selected Date.

            const fromDateObj = new Date(date);
            const toDateObj = new Date(date);
            toDateObj.setDate(toDateObj.getDate() + 1);

            const fromStr = `${fromDateObj.toISOString().split('T')[0]}T07:00:00`;
            const toStr = `${toDateObj.toISOString().split('T')[0]}T02:00:00`;

            const { data, error } = await (supabase as any)
                .from('transactions')
                .select('*, users(name)')
                .eq('outlet_id', user.profile.outlet_id)
                .gte('created_at', fromStr)
                .lte('created_at', toStr)
                .order('created_at', { ascending: true }); // Chronological order

            if (error) throw error;
            setTransactions(data || []);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, date, supabase]);

    useEffect(() => {
        loadDayBook();
    }, [loadDayBook]);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Day Book" />

            <div className="p-4 border-b bg-white dark:bg-gray-800 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Select Day:</span>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-40"
                    />
                    <Button onClick={loadDayBook} variant="secondary">View Log</Button>
                </div>
                <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export Log</Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">Voucher</th>
                                <th className="px-4 py-3">Particulars</th>
                                <th className="px-4 py-3">Mode</th>
                                <th className="px-4 py-3 text-right">Debit</th>
                                <th className="px-4 py-3 text-right">Credit</th>
                                <th className="px-4 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={7} className="p-4 text-center text-gray-500">No transactions for this day</td></tr>
                            ) : (
                                transactions.map((t) => {
                                    const isIncome = t.type === 'income';
                                    const debit = isIncome ? 0 : t.amount;
                                    const credit = isIncome ? t.amount : 0;
                                    const { allowed } = canEditTransaction(t.created_at, user?.profile?.role || '');

                                    return (
                                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-500">
                                                {format(new Date(t.created_at), 'HH:mm:ss')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border",
                                                    isIncome ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"
                                                )}>
                                                    {t.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900 dark:text-white">{t.description || 'Transaction'}</div>
                                                {t.users?.name && <div className="text-xs text-gray-400">User: {t.users.name}</div>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {t.payment_mode}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-red-600">
                                                {debit > 0 ? `₹${debit.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-green-600">
                                                {credit > 0 ? `₹${credit.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {!allowed && <Lock className="w-3 h-3 text-gray-400 mx-auto" />}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
