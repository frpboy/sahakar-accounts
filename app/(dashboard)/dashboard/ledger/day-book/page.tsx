'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { History, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LedgerTable } from '@/components/ledger/ledger-table';
import { LedgerDrawer } from '@/components/ledger/ledger-drawer';
import { getTransactionPermission } from '@/lib/ledger-logic';
import { useLedgerLocks } from '@/hooks/use-ledger-locks';
import { postReversal } from '@/lib/ledger-actions';
import { toast } from 'sonner';

export default function DayBookPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: locks } = useLedgerLocks(user?.profile?.outlet_id, date, date);

    const loadDayLog = useCallback(async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        try {
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const nextDateStr = nextDate.toISOString().split('T')[0];

            const { data, error } = await (supabase as any)
                .from('transactions')
                .select('*, users(name)')
                .eq('outlet_id', user.profile.outlet_id)
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
        loadDayLog();
    }, [loadDayLog]);

    const handleRowClick = (entry: any) => {
        setSelectedEntry(entry);
        setIsDrawerOpen(true);
    };

    const handlePostCorrection = async (data: { reason: string }) => {
        if (!selectedEntry || !user) return;
        const loadingId = toast.loading("Processing reversal...");
        try {
            await postReversal(selectedEntry, data.reason, user.id);
            toast.success("Reversal Entry Posted", { id: loadingId });
            setIsDrawerOpen(false);
            loadDayLog();
        } catch (e: any) {
            toast.error(e.message || "Failed", { id: loadingId });
        }
    };

    const perm = getTransactionPermission(
        selectedEntry?.ledger_date || selectedEntry?.created_at || date,
        user?.profile?.role || '',
        locks ? !!locks[date] : false
    );

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Day Book" />

            <div className="p-4 border-b bg-white dark:bg-gray-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-blue-500" />
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-40"
                    />
                    <Button onClick={loadDayLog} variant="secondary" size="sm">Refresh</Button>
                </div>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export PDF</Button>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="mb-4 text-sm text-gray-500">
                    Chronological accounting log (7 AM - 2 AM Business Day)
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
                onSave={handlePostCorrection}
            />
        </div>
    );
}
