'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Filter, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { canEditTransaction } from '@/lib/ledger-logic';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { LedgerTable } from '@/components/ledger/ledger-table';
import { LedgerDrawer } from '@/components/ledger/ledger-drawer';
import { BalanceCard } from '@/components/ledger/balance-card';

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

    const [stats, setStats] = useState({
        closing: 0,
        cash: 0,
        bank: 0,
        credit: 0
    });

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

            // Calc Stats (Simplified for current view)
            let cash = 0, bank = 0, credit = 0;
            data?.forEach((t: any) => {
                const amt = Number(t.amount);
                const isIncome = t.type === 'income';

                if (t.payment_mode === 'Cash') {
                    cash += isIncome ? amt : -amt;
                } else if (['UPI', 'Card', 'Bank Transfer'].includes(t.payment_mode)) {
                    bank += isIncome ? amt : -amt;
                } else if (t.payment_mode === 'Credit') {
                    // Credit Given (Receivable)
                    if (t.category === 'sales') credit += amt;
                }
            });

            // Note: This Closing Balance is just the NET of the VIEWED period + 0 opening. 
            // Real accounting needs Opening Balance.
            setStats({
                closing: cash + bank, // Liquid assets change
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

    useEffect(() => {
        loadRegister();
    }, [loadRegister]);

    const handleRowClick = (entry: any) => {
        setSelectedEntry(entry);
        setIsDrawerOpen(true);
    };

    const handleSaveAdjustment = async (adjustment: any) => {
        // Implement save logic here
        console.log('Saving adjustment', adjustment);
        setIsDrawerOpen(false);
    };

    const { allowed, reason } = selectedEntry
        ? canEditTransaction(selectedEntry.created_at, user?.profile?.role || '')
        : { allowed: false, reason: '' };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Ledger Register" />

            <div className="p-6 overflow-auto">
                <BalanceCard
                    closingBalance={stats.closing}
                    cash={stats.cash}
                    bank={stats.bank}
                    credit={stats.credit}
                    lastLockedDate={new Date()} // Placeholder
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
                    isDayLocked={false} // Placeholder
                    onRowClick={handleRowClick}
                />
            </div>

            <LedgerDrawer
                entry={selectedEntry}
                role={user?.profile?.role}
                canEdit={allowed}
                lockReason={reason}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSave={handleSaveAdjustment}
            />
        </div>
    );
}
