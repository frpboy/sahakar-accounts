'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTransactionPermission } from '@/lib/ledger-logic';
import { useLedgerLocks } from '@/hooks/use-ledger-locks';
import { postReversal } from '@/lib/ledger-actions';
import { LedgerTable } from '@/components/ledger/ledger-table';
import { LedgerDrawer } from '@/components/ledger/ledger-drawer';
import { BalanceCard } from '@/components/ledger/balance-card';
import { toast } from 'sonner';

export default function DayBookPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Default to Today
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Fetch Locks for the viewed range (single day for Day Book)
    const { data: locks } = useLedgerLocks(user?.profile?.outlet_id, date, date);

    const loadDayBook = useCallback(async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        try {
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
                .order('created_at', { ascending: true });

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

    // Stats Calculation
    const stats = useMemo(() => {
        let cash = 0, bank = 0, credit = 0;
        transactions.forEach(t => {
            const amt = Number(t.amount);
            const isIncome = t.type === 'income';
            if (t.payment_mode === 'Cash') cash += isIncome ? amt : -amt;
            else if (['UPI', 'Card', 'Bank Transfer'].includes(t.payment_mode)) bank += isIncome ? amt : -amt;
            else if (t.payment_mode === 'Credit' && t.category === 'sales') credit += amt;
        });
        return { closing: cash + bank, cash, bank, credit };
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
            loadDayBook();
        } catch (e: any) {
            toast.error(e.message || "Failed to post reversal", { id: loadingId });
        }
    };

    const isLocked = locks ? !!locks[date] : false;
    const { allowed, reason, actionType } = selectedEntry
        ? getTransactionPermission(selectedEntry.created_at, user?.profile?.role || '', isLocked)
        : { allowed: false, reason: '', actionType: 'view_only' as const };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Day Book" />

            <div className="p-6 overflow-auto">
                <BalanceCard
                    closingBalance={stats.closing}
                    cash={stats.cash}
                    bank={stats.bank}
                    credit={stats.credit}
                    lastLockedDate={isLocked ? new Date(date) : null}
                />

                <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium">Business Date:</span>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-40"
                    />
                    <Button onClick={loadDayBook} variant="secondary">View Day Log</Button>
                </div>

                <LedgerTable
                    entries={transactions}
                    role={user?.profile?.role}
                    isDayLocked={isLocked}
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
