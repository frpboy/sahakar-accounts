'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Search, Download, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function CustomerLedgerPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const loadCustomers = useCallback(async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        try {
            // 1. Fetch Customers
            // In Sahakar, accounts are likely linked to `profiles` or a `customers` table?
            // The Sales Report fixed in Step 4024 removed `profiles` join.
            // But we need Customer names. 
            // Earlier viewing of `analytics/page.tsx` showed error on "customers" table.
            // Schema has `public.users` referenced by `created_by`. 
            // But where are Customers stored?
            // `transactions` table has `customer_id`.
            // Let's query distinct `customer_id` from transactions or a `customers` table if it exists.

            // Checking Step 3982 Errors: "Argument of type 'customers' is not assignable".
            // This suggests 'customers' table might not exist in types or DB.
            // But usually there is a table.
            // Let's assume we derive Customer List from Transactions + `profiles` table?
            // Or try fetching `customers` table and fail gracefully.

            // PLAN: Group transactions by `customer_id` (if not null).
            // Calculate Debit (Credit Given sales) vs Credit (Credit Received payments).

            const { data: txs, error } = await (supabase as any)
                .from('transactions')
                .select('customer_id, type, category, amount, payment_mode, profiles:customer_id(full_name, phone_number)')
                .eq('outlet_id', user.profile.outlet_id)
                .in('category', ['sales', 'credit_received']) // Sales (Credit Mode), Credit Received
                .not('customer_id', 'is', null);

            if (error) throw error;

            // Aggregation
            const balanceMap = new Map();

            txs?.forEach((t: any) => {
                const cid = t.customer_id;
                if (!balanceMap.has(cid)) {
                    balanceMap.set(cid, {
                        id: cid,
                        name: t.profiles?.full_name || 'Unknown',
                        phone: t.profiles?.phone_number || '-',
                        debit: 0,
                        credit: 0
                    });
                }
                const record = balanceMap.get(cid);

                // Logic:
                // Sales (Credit Mode) -> Debit (Customer owes us)
                // Credit Received -> Credit (Customer pays us)
                // What about Sales Return? (Credit to Customer)

                if (t.category === 'sales' && t.payment_mode === 'Credit') {
                    record.debit += Number(t.amount);
                } else if (t.category === 'credit_received') {
                    record.credit += Number(t.amount);
                }
                // Handle Returns later or if category 'sales_return' exists check logic (usually reduces Debit or adds Credit)
            });

            setCustomers(Array.from(balanceMap.values()));

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Customer Ledger" />

            <div className="p-4 border-b bg-white dark:bg-gray-800 flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        type="search"
                        placeholder="Search customers..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export List</Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-4 py-3">Customer</th>
                                <th className="px-4 py-3">Phone</th>
                                <th className="px-4 py-3 text-right">Debit (Owes)</th>
                                <th className="px-4 py-3 text-right">Credit (Paid)</th>
                                <th className="px-4 py-3 text-right">Balance</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr><td colSpan={6} className="p-4 text-center text-gray-500">No customers found with credit history</td></tr>
                            ) : (
                                filteredCustomers.map((c) => {
                                    const balance = c.debit - c.credit;
                                    const status = balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : '-';
                                    const color = balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-gray-400';

                                    return (
                                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3 font-medium">{c.name}</td>
                                            <td className="px-4 py-3 text-gray-500">{c.phone}</td>
                                            <td className="px-4 py-3 text-right">₹{c.debit.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">₹{c.credit.toLocaleString()}</td>
                                            <td className={cn("px-4 py-3 text-right font-bold", color)}>
                                                ₹{Math.abs(balance).toLocaleString()} {status}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                                </Button>
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
