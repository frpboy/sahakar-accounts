'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; // Need tabs for UPI vs Card?
import { format } from 'date-fns';

export default function BankBookPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().substring(0, 7) + '-01',
        to: new Date().toISOString().split('T')[0]
    });
    const [modeFilter, setModeFilter] = useState('all'); // all, UPI, Card, Bank Transfer

    const loadBankBook = useCallback(async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        try {
            const toDateObj = new Date(dateRange.to);
            toDateObj.setDate(toDateObj.getDate() + 1);
            const toDateNext = toDateObj.toISOString().split('T')[0];

            let query = (supabase as any)
                .from('transactions')
                .select('*, users(name)')
                .eq('outlet_id', user.profile.outlet_id)
                .neq('payment_mode', 'Cash') // NOT Cash = Bank/UPI/Card
                .gte('created_at', `${dateRange.from}T07:00:00`)
                .lte('created_at', `${toDateNext}T02:00:00`)
                .order('created_at', { ascending: false });

            if (modeFilter !== 'all') {
                query = query.eq('payment_mode', modeFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setTransactions(data || []);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, dateRange, modeFilter, supabase]);

    useEffect(() => {
        loadBankBook();
    }, [loadBankBook]);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Bank & UPI Book" />

            <div className="p-4 border-b bg-white dark:bg-gray-800 space-y-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
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
                        <Button onClick={loadBankBook} variant="secondary">View Log</Button>
                    </div>
                    <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
                </div>

                <Tabs value={modeFilter} onValueChange={setModeFilter} className="w-full">
                    <TabsList>
                        <TabsTrigger value="all">All Digital</TabsTrigger>
                        <TabsTrigger value="UPI">UPI</TabsTrigger>
                        <TabsTrigger value="Card">Card</TabsTrigger>
                        <TabsTrigger value="Bank Transfer">Bank Transfer</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="flex-1 overflow-auto p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Particulars</th>
                                <th className="px-4 py-3">Mode</th>
                                <th className="px-4 py-3 text-right">In (Dr)</th>
                                <th className="px-4 py-3 text-right">Out (Cr)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center text-gray-500">No transactions found</td></tr>
                            ) : (
                                transactions.map((t) => {
                                    const isIncome = t.type === 'income';
                                    const debit = isIncome ? t.amount : 0; // Bank In
                                    const credit = isIncome ? 0 : t.amount; // Bank Out

                                    return (
                                        <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {format(new Date(t.created_at), 'dd MMM yyyy HH:mm')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{t.description || t.category}</div>
                                                <span className="text-xs text-gray-400 capitalize">{t.category.replace('_', ' ')}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100">
                                                    {t.payment_mode}
                                                </span>
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
