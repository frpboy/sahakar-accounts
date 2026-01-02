'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { CreditCard, Download, Smartphone, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LedgerTable } from '@/components/ledger/ledger-table';
import { LedgerDrawer } from '@/components/ledger/ledger-drawer';
import { getTransactionPermission } from '@/lib/ledger-logic';
import { useLedgerLocks } from '@/hooks/use-ledger-locks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function BankBookPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('UPI');

    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().substring(0, 7) + '-01',
        to: new Date().toISOString().split('T')[0]
    });

    const { data: locks } = useLedgerLocks(user?.profile?.outlet_id, dateRange.from, dateRange.to);

    const loadBankLog = useCallback(async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        try {
            const toDateObj = new Date(dateRange.to);
            toDateObj.setDate(toDateObj.getDate() + 1);
            const toDateNext = toDateObj.toISOString().split('T')[0];

            const { data, error } = await (supabase as any)
                .from('transactions')
                .select('*, users(name)')
                .eq('outlet_id', user.profile.outlet_id)
                .ilike('payment_modes', `%${activeTab}%`)
                .gte('created_at', `${dateRange.from}T07:00:00`)
                .lte('created_at', `${toDateNext}T02:00:00`)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setTransactions(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, dateRange, activeTab, supabase]);

    useEffect(() => {
        loadBankLog();
    }, [loadBankLog]);

    const handleRowClick = (entry: any) => {
        setSelectedEntry(entry);
        setIsDrawerOpen(true);
    };

    const perm = getTransactionPermission(
        selectedEntry?.ledger_date || selectedEntry?.created_at || dateRange.to,
        user?.profile?.role || '',
        false // Simplified for range view
    );

    const stats = useMemo(() => {
        let inflow = 0;
        let outflow = 0;
        transactions.forEach(t => {
            if (t.type === 'income') inflow += Number(t.amount);
            else outflow += Number(t.amount);
        });
        return { inflow, outflow, balance: inflow - outflow };
    }, [transactions]);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Bank / UPI Book" />

            <div className="p-4 border-b bg-white dark:bg-gray-800 space-y-4">
                <div className="flex justify-between items-center">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                        <TabsList>
                            <TabsTrigger value="UPI" className="gap-2">
                                <Smartphone className="w-4 h-4" /> UPI
                            </TabsTrigger>
                            <TabsTrigger value="Card" className="gap-2">
                                <CreditCard className="w-4 h-4" /> Card
                            </TabsTrigger>
                            <TabsTrigger value="Bank Transfer" className="gap-2">
                                <Landmark className="w-4 h-4" /> Bank
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
                </div>

                <div className="flex items-center gap-3">
                    <Input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange(p => ({ ...p, from: e.target.value }))}
                        className="w-36"
                    />
                    <span className="text-gray-400 font-mono">→</span>
                    <Input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange(p => ({ ...p, to: e.target.value }))}
                        className="w-36"
                    />
                    <Button onClick={loadBankLog} variant="secondary" size="sm">Filter</Button>

                    <div className="flex-1 flex justify-end gap-6 text-sm pr-4 font-mono">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-500 uppercase">Inflow</span>
                            <span className="text-green-600 font-bold">₹{stats.inflow.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-500 uppercase">Outflow</span>
                            <span className="text-red-500 font-bold">₹{stats.outflow.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-500 uppercase">Book Balance</span>
                            <span className="text-blue-600 font-bold underline">₹{stats.balance.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <LedgerTable
                    entries={transactions}
                    role={user?.profile?.role}
                    isDayLocked={false}
                    onRowClick={handleRowClick}
                />
            </div>

            <LedgerDrawer
                entry={selectedEntry}
                role={user?.profile?.role}
                canEdit={perm.allowed}
                lockReason={perm.reason}
                actionType={perm.actionType}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />
        </div>
    );
}
