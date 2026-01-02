'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Search, Download, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LedgerTable } from '@/components/ledger/ledger-table';
import { useSearchParams } from 'next/navigation';

export default function CustomerLedgerPage() {
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get('search') || '';

    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState(initialSearch);

    // For Drill-down
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerTransactions, setCustomerTransactions] = useState<any[]>([]);

    const loadCustomers = useCallback(async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        try {
            // Rule 11: Deriving from Single Source (transactions)
            const { data: txs, error } = await (supabase as any)
                .from('transactions')
                .select(`
                    customer_id, 
                    type, 
                    category, 
                    amount, 
                    payment_modes, 
                    customers(name, phone)
                `)
                .eq('outlet_id', user.profile.outlet_id)
                .not('customer_id', 'is', null);

            if (error) throw error;

            const balanceMap = new Map();
            txs?.forEach((t: any) => {
                const cid = t.customer_id;
                if (!balanceMap.has(cid)) {
                    balanceMap.set(cid, {
                        id: cid,
                        name: t.customers?.name || 'Guest Customer',
                        phone: t.customers?.phone || '-',
                        debit: 0,
                        credit: 0
                    });
                }
                const record = balanceMap.get(cid);
                const amt = Number(t.amount);
                const isCreditSale = t.type === 'income' && t.payment_modes?.includes('Credit');

                // Debit = Customer owes (mostly Sales on Credit)
                if (isCreditSale) {
                    record.debit += amt;
                }
                // Credit = Customer paid (Credit Received)
                else if (t.category === 'credit_received') {
                    record.credit += amt;
                }
                // Net out reversals/returns if they exist
                else if (t.is_reversal) {
                    if (t.type === 'expense' && t.payment_modes?.includes('Credit')) record.debit -= amt;
                    else if (t.type === 'income' && t.category === 'credit_received') record.credit -= amt;
                }
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

    const viewCustomerDetails = async (customer: any) => {
        setSelectedCustomer(customer);
        const { data, error } = await (supabase as any)
            .from('transactions')
            .select('*, users(name)')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false });

        if (!error) setCustomerTransactions(data || []);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Customer Ledger" />

            <div className="p-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border mb-6 flex justify-between items-center gap-4 shadow-sm">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by name or phone..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export Balances</Button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-6 py-4">Customer Details</th>
                                <th className="px-6 py-4 text-right">Debit (Owes)</th>
                                <th className="px-6 py-4 text-right">Credit (Paid)</th>
                                <th className="px-6 py-4 text-right">Closing Balance</th>
                                <th className="px-6 py-4 text-center">History</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center animate-pulse">Loading Customer Data...</td></tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">No credit records found</td></tr>
                            ) : (
                                filteredCustomers.map((c) => {
                                    const balance = c.debit - c.credit;
                                    return (
                                        <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-gray-100">{c.name}</div>
                                                        <div className="text-xs text-gray-400">{c.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-gray-600">₹{c.debit.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right font-mono text-gray-600">₹{c.credit.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-xs font-bold font-mono",
                                                    balance > 0 ? "bg-red-50 text-red-700 border border-red-100" :
                                                        balance < 0 ? "bg-green-50 text-green-700 border border-green-100" :
                                                            "bg-gray-50 text-gray-400 border border-gray-100"
                                                )}>
                                                    ₹{Math.abs(balance).toLocaleString()} {balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : ''}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Button size="sm" variant="ghost" className="rounded-full hover:bg-blue-50 hover:text-blue-600" onClick={() => viewCustomerDetails(c)}>
                                                    <ChevronRight className="w-5 h-5" />
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

            <Sheet open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
                <SheetContent side="right" className="w-[80%] sm:max-w-4xl p-0">
                    <SheetHeader className="p-6 border-b bg-gray-50 dark:bg-gray-900">
                        <SheetTitle className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                <User className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <div className="text-2xl">{selectedCustomer?.name}</div>
                                <div className="text-sm font-normal text-gray-500">Transaction History • {selectedCustomer?.phone}</div>
                            </div>
                        </SheetTitle>
                    </SheetHeader>
                    <div className="p-6 h-[calc(100vh-120px)] overflow-auto">
                        <LedgerTable
                            entries={customerTransactions}
                            role={user?.profile?.role}
                            isDayLocked={false}
                        // Reversal and detail view still work inside here!
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
