'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Save, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getTransactionPermission } from '@/lib/ledger-logic';
import { useLedgerLocks } from '@/hooks/use-ledger-locks';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function JournalEntryPage() {
    const { user } = useAuth();
    const router = useRouter();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [submitting, setSubmitting] = useState(false);

    const [entry, setEntry] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'income',
        ledgerAccountId: '',
        mode: 'Cash',
        amount: '',
        reason: ''
    });
    const [leafAccounts, setLeafAccounts] = useState<any[]>([]);

    useEffect(() => {
        const fetchLeafs = async () => {
            const { data } = await (supabase as any)
                .from('ledger_accounts')
                .select('id, name, code, type')
                .eq('is_leaf', true)
                .eq('status', 'active');
            if (data) setLeafAccounts(data);
        };
        fetchLeafs();
    }, [supabase]);

    const { data: locks } = useLedgerLocks(user?.profile?.outlet_id, entry.date, entry.date);
    const isDayLocked = locks ? !!locks[entry.date] : false;

    const { allowed, reason: lockReason } = getTransactionPermission(
        entry.date,
        user?.profile?.role || '',
        isDayLocked
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!entry.amount || !entry.ledgerAccountId || entry.reason.length < 10) {
            toast.error('Valid amount, ledger account, and detailed reason (min 10 chars) required.');
            return;
        }

        if (!allowed) {
            toast.error(`Posting Blocked: ${lockReason}`);
            return;
        }

        setSubmitting(true);
        const loadingId = toast.loading("Posting to ledger...");
        try {
            const selectedAccount = leafAccounts.find(a => a.id === entry.ledgerAccountId);

            const { error } = await (supabase as any).from('transactions').insert({
                outlet_id: user?.profile.outlet_id,
                type: entry.type,
                category: selectedAccount?.name.toLowerCase() || 'manual',
                amount: parseFloat(entry.amount),
                payment_modes: entry.mode,
                description: `MANUAL JOURNAL: ${entry.reason}`,
                created_by: user?.id,
                ledger_date: entry.date,
                ledger_account_id: entry.ledgerAccountId,
                is_manual: true,
                source_type: 'manual',
                idempotency_key: `mj_${user?.id}_${Date.now()}`
            });

            if (error) throw error;

            toast.success('Journal Entry Posted Successfully', { id: loadingId });
            router.push('/dashboard/ledger/register');

        } catch (e: any) {
            toast.error(e.message || 'Failed to post entry', { id: loadingId });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Manual Journal Entry" />

            <div className="flex-1 overflow-auto p-6 flex justify-center">
                <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
                    <div className="mb-8 flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                        <Info className="w-6 h-6 text-blue-600 mt-1" />
                        <div>
                            <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100">Ledger Immutability Policy</h2>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Sahakar Accounts follows an **append-only** ledger rule. Manual journals should only be used for corrections or non-sale adjustments. Every entry is audited.
                            </p>
                        </div>
                    </div>

                    {!allowed && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100">
                            <AlertCircle className="w-6 h-6 flex-shrink-0" />
                            <span className="font-medium"><strong>Locked:</strong> {lockReason}</span>
                        </div>
                    )}

                    <div className="mb-6 p-4 bg-orange-600 text-white rounded-xl flex items-center gap-3 border border-orange-700 shadow-md">
                        <ShieldCheck className="w-6 h-6 flex-shrink-0" />
                        <div>
                            <p className="font-black text-sm uppercase tracking-widest">Manual Entry Risk Active</p>
                            <p className="text-[10px] opacity-90 leading-tight">All manual journals are flagged as 'High Risk' in the anomaly dashboard and sent to the HO Audit Queue immediately.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Target Business Date</Label>
                                <Input
                                    type="date"
                                    value={entry.date}
                                    onChange={(e) => setEntry(prev => ({ ...prev, date: e.target.value }))}
                                    disabled={submitting}
                                    className="h-12 text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Amount (₹)</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={entry.amount}
                                    onChange={(e) => setEntry(prev => ({ ...prev, amount: e.target.value }))}
                                    disabled={submitting || !allowed}
                                    className="h-12 text-base font-mono"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Target Ledger Account (Leaf)</Label>
                                <Select
                                    value={entry.ledgerAccountId}
                                    onValueChange={(v) => {
                                        const acc = leafAccounts.find(a => a.id === v);
                                        setEntry(prev => ({
                                            ...prev,
                                            ledgerAccountId: v,
                                            type: (acc?.type === 'Income' || acc?.type === 'Asset') ? 'income' : 'expense'
                                        }));
                                    }}
                                    disabled={submitting || !allowed}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Select Account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leafAccounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.code} - {acc.name} ({acc.type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mandatory Narration / Reason</Label>
                            <Textarea
                                placeholder="Provide a detailed reason for this manual adjustment..."
                                value={entry.reason}
                                onChange={(e) => setEntry(prev => ({ ...prev, reason: e.target.value }))}
                                className="w-full min-h-[120px] p-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                                required
                                disabled={submitting || !allowed}
                            />
                            <p className="text-xs text-gray-400 italic">Minimum 10 characters required for the audit trail.</p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                            disabled={submitting || !allowed}
                        >
                            {submitting ? 'Authenticating & Posting...' : 'Commit to Ledger'}
                            <Save className="w-5 h-5 ml-2" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
