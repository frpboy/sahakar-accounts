'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Filter, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTransactionPermission } from '@/lib/ledger-logic';
import { useLedgerLocks } from '@/hooks/use-ledger-locks';
import { postReversal } from '@/lib/ledger-actions'; // IMPORTED
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { LedgerTable } from '@/components/ledger/ledger-table';
import { LedgerDrawer } from '@/components/ledger/ledger-drawer';
import { BalanceCard } from '@/components/ledger/balance-card';
import { toast } from 'sonner';

export default function LedgerRegisterPage() {
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

    const { data: locks } = useLedgerLocks(user?.profile?.outlet_id, dateRange.from, dateRange.to);

    const [stats, setStats] = useState({
        closing: 0,
        cash: 0,
        bank: 0,
        credit: 0
    });
    const [absoluteLastLocked, setAbsoluteLastLocked] = useState<string | null>(null);

    const loadRegister = useCallback(async () => {
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
                .gte('created_at', `${dateRange.from}T07:00:00`)
                .lte('created_at', `${toDateNext}T02:00:00`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);

            let cash = 0, bank = 0, credit = 0;
            data?.forEach((t: any) => {
                const amt = Number(t.amount);
                const isIncome = t.type === 'income';

                if (t.payment_mode === 'Cash') {
                    cash += isIncome ? amt : -amt;
                } else if (['UPI', 'Card', 'Bank Transfer'].includes(t.payment_mode)) {
                    bank += isIncome ? amt : -amt;
                } else if (t.payment_mode === 'Credit') {
                    if (t.category === 'sales') credit += amt;
                }
            });

            setStats({
                closing: cash + bank,
                cash,
                bank,
                credit
            });

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, dateRange, supabase]);

    const fetchLocks = useCallback(async () => {
        if (!user?.profile.outlet_id) return;
        const { data } = await (supabase as any)
            .from('day_locks')
            .select('date')
            .eq('outlet_id', user.profile.outlet_id)
            .eq('is_locked', true)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (data) setAbsoluteLastLocked(data.date);
    }, [supabase, user]);

    useEffect(() => {
        loadRegister();
        fetchLocks();
    }, [loadRegister, fetchLocks]);

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
            loadRegister();
        } catch (e: any) {
            toast.error(e.message || "Failed to post reversal", { id: loadingId });
        }
    };

    const getEntryPermission = (entry: any) => {
        if (!entry) return { allowed: false, reason: '', actionType: 'view_only' as const };
        const dateKey = entry.ledger_date || entry.created_at.split('T')[0];
        const isDayLocked = locks ? !!locks[dateKey] : false;

        return getTransactionPermission(
            entry.ledger_date || entry.created_at,
            user?.profile?.role || '',
            isDayLocked
        );
    };

    const { allowed, reason, actionType } = getEntryPermission(selectedEntry);

    const lastLockedDate = useMemo(() => {
        if (!locks) return null;
        const lockedDates = Object.entries(locks)
            .filter(([_, locked]) => locked)
            .map(([date]) => date)
            .sort()
            .reverse();
        return lockedDates.length > 0 ? new Date(lockedDates[0]) : null;
    }, [locks]);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Ledger Register" />

            <div className="p-6 overflow-auto">
                <BalanceCard
                    closingBalance={stats.closing}
                    cash={stats.cash}
                    bank={stats.bank}
                    credit={stats.credit}
                    lastLockedDate={absoluteLastLocked as any}
                />

                <div className="flex items-center gap-2 mb-4">
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
                    <Button onClick={loadRegister} variant="secondary">Filter</Button>
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
