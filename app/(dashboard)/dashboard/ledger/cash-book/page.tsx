'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { IndianRupee, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LedgerTable } from '@/components/ledger/ledger-table';
import { LedgerDrawer } from '@/components/ledger/ledger-drawer';
import { getTransactionPermission } from '@/lib/ledger-logic';
import { useLedgerLocks } from '@/hooks/use-ledger-locks';
import { postReversal } from '@/lib/ledger-actions';
import { toast } from 'sonner';

export default function CashBookPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: locks } = useLedgerLocks(user?.profile?.outlet_id, date, date);

    const loadCashLog = useCallback(async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        try {
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextDateStr = nextDate.toISOString().split('T')[0];

            // Filter for transactions containing 'Cash' in payment_modes
            // and where type is income/expense (which is all of them usually)
            const { data, error } = await (supabase as any)
                .from('transactions')
                .select('*, users(name)')
                .eq('outlet_id', user.profile.outlet_id)
                .ilike('payment_modes', '%Cash%')
                .gte('created_at', `${date}T07:00:00`)
                .lte('created_at', `${nextDateStr}T02:00:00`)
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
        loadCashLog();
    }, [loadCashLog]);

    const handleRowClick = (entry: any) => {
        setSelectedEntry(entry);
        setIsDrawerOpen(true);
    };

    const perm = getTransactionPermission(
        selectedEntry?.ledger_date || selectedEntry?.created_at || date,
        user?.profile?.role || '',
        locks ? !!locks[date] : false
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
            <TopBar title="Cash Book" />

            <div className="p-4 border-b bg-white dark:bg-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <IndianRupee className="w-5 h-5 text-green-600" />
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-40"
                    />
                    <Button onClick={loadCashLog} variant="secondary" size="sm">Refresh</Button>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-gray-500 text-xs">Closing Balance</span>
                        <span className="font-bold text-green-700">₹{stats.balance.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cash In (Debits)</div>
                        <div className="text-xl font-bold text-green-600">₹{stats.inflow.toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cash Out (Credits)</div>
                        <div className="text-xl font-bold text-red-600">₹{stats.outflow.toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Net Flow</div>
                        <div className="text-xl font-bold text-blue-600">₹{stats.balance.toLocaleString()}</div>
                    </div>
                </div>

                <LedgerTable
                    entries={transactions}
                    role={user?.profile?.role}
                    isDayLocked={locks ? !!locks[date] : false}
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
