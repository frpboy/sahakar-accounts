'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTransactionPermission } from '@/lib/ledger-logic';
import { useLedgerLocks } from '@/hooks/use-ledger-locks';
import { postReversal } from '@/lib/ledger-actions';
import { LedgerTable } from '@/components/ledger/ledger-table';
import { LedgerDrawer } from '@/components/ledger/ledger-drawer';
import { BalanceCard } from '@/components/ledger/balance-card';
import { toast } from 'sonner';

export default function BankBookPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().substring(0, 7) + '-01',
        to: new Date().toISOString().split('T')[0]
    });
    const [modeFilter, setModeFilter] = useState('all');

    const { data: locks } = useLedgerLocks(user?.profile?.outlet_id, dateRange.from, dateRange.to);

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
                .neq('payment_mode', 'Cash')
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
    }, [loadBankBook, modeFilter]);

    const stats = useMemo(() => {
        let bank = 0;
        transactions.forEach(t => {
            const amt = Number(t.amount);
            bank += t.type === 'income' ? amt : -amt;
        });
        return { closing: bank, cash: 0, bank, credit: 0 };
    }, [transactions]);

    const handleRowClick = (entry: any) => {
        setSelectedEntry(entry);
        setIsDrawerOpen(true);
    };

    const handlePostCorrection = async (data: { reason: string, type: 'reversal' | 'adjustment' }) => {
        if (!selectedEntry || !user) return;
        const loadingId = toast.loading("Processing reversal...");
        try {
            await postReversal(selectedEntry, data.reason, user.id);
            toast.success("Reversal Entry Posted Successfully", { id: loadingId });
            setIsDrawerOpen(false);
            loadBankBook();
        } catch (e: any) {
            toast.error(e.message || "Failed to post reversal", { id: loadingId });
        }
    };

    const getEntryPermission = (entry: any) => {
        if (!entry) return { allowed: false, reason: '', actionType: 'view_only' as const };
        const dateKey = entry.ledger_date || entry.created_at.split('T')[0];
        const isDayLocked = locks ? !!locks[dateKey] : false;
        return getTransactionPermission(entry.ledger_date || entry.created_at, user?.profile?.role || '', isDayLocked);
    };

    const { allowed, reason, actionType } = getEntryPermission(selectedEntry);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Bank & UPI Book" />

            <div className="p-6 overflow-auto">
                <BalanceCard
                    closingBalance={stats.closing}
                    cash={0}
                    bank={stats.bank}
                    credit={0}
                    lastLockedDate={null}
                />

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border mb-6 space-y-4 shadow-sm">
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
                        <Button onClick={loadBankBook} variant="secondary">View Bank Log</Button>
                    </div>

                    <Tabs value={modeFilter} onValueChange={setModeFilter} className="w-full">
                        <TabsList className="bg-gray-100/50">
                            <TabsTrigger value="all">All Digital</TabsTrigger>
                            <TabsTrigger value="UPI">UPI</TabsTrigger>
                            <TabsTrigger value="Card">Card</TabsTrigger>
                            <TabsTrigger value="Bank Transfer">Bank Transfer</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

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
                canEdit={allowed}
                lockReason={reason}
                actionType={actionType}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSave={handlePostCorrection}
            />
        </div>
    );
}
