'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function CashBookPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().substring(0, 7) + '-01',
        to: new Date().toISOString().split('T')[0]
    });

    const loadCashBook = useCallback(async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        try {
            const toDateObj = new Date(dateRange.to);
            toDateObj.setDate(toDateObj.getDate() + 1);
            const toDateNext = toDateObj.toISOString().split('T')[0];

            // Filter for 'Cash' payment mode
            const { data, error } = await (supabase as any)
                .from('transactions')
                .select('*, users(name)')
                .eq('outlet_id', user.profile.outlet_id)
                .eq('payment_mode', 'Cash') // Only Cash
                .gte('created_at', `${dateRange.from}T07:00:00`)
                .lte('created_at', `${toDateNext}T02:00:00`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, dateRange, supabase]);

    useEffect(() => {
        loadCashBook();
    }, [loadCashBook]);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Cash Book" />

            <div className="p-4 border-b bg-white dark:bg-gray-800 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                        className="w-40"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                        className="w-40"
                    />
                    <Button onClick={loadCashBook} variant="secondary">View Cash Log</Button>
                </div>
                <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Particulars</th>
                                <th className="px-4 py-3">Ref No</th>
                                <th className="px-4 py-3 text-right">Cash In (Dr)</th>
                                <th className="px-4 py-3 text-right">Cash Out (Cr)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center text-gray-500">No cash transactions found</td></tr>
                            ) : (
                                transactions.map((t) => {
                                    // Cash Book: 
                                    // Income (Sales) = Cash In = Debit (Real Account rules: Debit what comes in)
                                    // Expense (Purchase) = Cash Out = Credit
                                    const isIncome = t.type === 'income';
                                    const debit = isIncome ? t.amount : 0; // Cash In
                                    const credit = isIncome ? 0 : t.amount; // Cash Out

                                    return (
                                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {format(new Date(t.created_at), 'dd MMM yyyy HH:mm')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{t.description || t.category}</div>
                                                <span className="text-xs text-gray-400 capitalize">{t.category.replace('_', ' ')}</span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                                {/* Ref No usually Invoice ID or custom ref */}
                                                {t.id.substring(0, 8)}...
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-green-600">
                                                {debit > 0 ? `₹${debit.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-red-600">
                                                {credit > 0 ? `₹${credit.toLocaleString()}` : '-'}
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
