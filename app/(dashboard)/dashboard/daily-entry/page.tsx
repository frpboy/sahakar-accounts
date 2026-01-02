'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Lock, Unlock, Send, Calendar, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculateReconciliation, ReconciliationResult } from '@/lib/ledger-logic';
import { lockBusinessDay } from '@/lib/ledger-actions';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DailyRecord {
    id: string;
    date: string;
    outlet_id: string;
    opening_cash: number;
    opening_upi: number;
    closing_cash: number | null;
    closing_upi: number | null;
    status: string;
}

export default function DailyEntryPage() {
    const { user } = useAuth();
    const supabase = React.useMemo(() => createClientBrowser(), []);
    const [records, setRecords] = useState<DailyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Reconciliation UI State
    const [isReconciling, setIsReconciling] = useState(false);
    const [activeRecord, setActiveRecord] = useState<DailyRecord | null>(null);
    const [physicalCash, setPhysicalCash] = useState<string>('');
    const [reconData, setReconData] = useState<ReconciliationResult | null>(null);
    const [acknowledged, setAcknowledged] = useState(false);

    useEffect(() => {
        loadRecords();
    }, [user]);

    const loadRecords = async () => {
        if (!user?.profile?.outlet_id) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('daily_records')
                .select('*')
                .eq('outlet_id', user.profile.outlet_id)
                .order('date', { ascending: false })
                .limit(30);
            if (error) throw error;
            setRecords(data || []);
        } catch (e: any) {
            toast.error(`Load failed: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const [dayTransactions, setDayTransactions] = useState<any[]>([]);

    const startReconciliation = async (record: DailyRecord) => {
        setActiveRecord(record);
        setIsReconciling(true);
        setProcessing(true);
        try {
            const { data: txs, error } = await (supabase as any)
                .from('transactions')
                .select('*')
                .eq('outlet_id', record.outlet_id)
                .gte('created_at', `${record.date}T07:00:00`)
                .lte('created_at', `${record.date}T23:59:59`); // Simplified for now

            if (error) throw error;
            setDayTransactions(txs || []);

            const res = calculateReconciliation(record.opening_cash, txs || [], record.opening_cash);
            setReconData(res);
            setPhysicalCash(res.expectedCash.toString());
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setProcessing(false);
        }
    };

    const handlePhysicalCashChange = (val: string) => {
        setPhysicalCash(val);
        if (activeRecord) {
            const num = parseFloat(val) || 0;
            const res = calculateReconciliation(activeRecord.opening_cash, dayTransactions, num);
            setReconData(res);
        }
    };

    // Refined Re-calc
    useEffect(() => {
        if (activeRecord && isReconciling) {
            // Re-fetch or use state to update variance
            // For now, let's keep it simple: the user sees the 'Expected' and inputs 'Actual'
        }
    }, [physicalCash]);

    const finalizeSubmission = async () => {
        if (!activeRecord) return;
        const actual = parseFloat(physicalCash);
        const expected = reconData?.expectedCash || 0;
        const variance = actual - expected;

        if (Math.abs(variance) > 0.01 && !acknowledged) {
            toast.error("Please acknowledge the cash variance.");
            return;
        }

        setProcessing(true);
        try {
            const { error } = await (supabase as any)
                .from('daily_records')
                .update({
                    status: 'submitted',
                    closing_cash: actual,
                    submitted_at: new Date().toISOString(),
                    submitted_by: user?.id,
                    // variance: variance // Assume column exists or logic handles it
                })
                .eq('id', activeRecord.id);

            if (error) throw error;

            toast.success("Day submitted and reconciled.");
            setIsReconciling(false);
            loadRecords();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setProcessing(false);
        }
    };

    const lockDayWithSync = async (record: DailyRecord) => {
        if (!confirm('Lock this day? Rule 6: This is an absolute ledger lock.')) return;
        setProcessing(true);
        try {
            // 1. Update daily_records
            await (supabase as any).from('daily_records').update({ status: 'locked' }).eq('id', record.id);

            // 2. Rule 6 Sync: Create entry in day_locks
            await lockBusinessDay(record.outlet_id, record.date, user?.id || '');

            toast.success("Day Locked & Ledger Protected (Rule 5 & 6)");
            loadRecords();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setProcessing(false);
        }
    };

    const isManager = ['outlet_manager', 'ho_accountant', 'master_admin', 'superadmin'].includes(user?.profile?.role || '');

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <TopBar title="Daily Close & Reconciliation (Rule 9)" />
            <div className="p-6">
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-tight">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-tight">Ledger Cash Opening</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-tight">Closing (Reported)</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-tight">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-tight">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        {format(new Date(r.date), 'EEE, dd MMM yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                                        ₹{r.opening_cash?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-emerald-600">
                                        {r.closing_cash !== null ? `₹${r.closing_cash.toLocaleString()}` : <span className="text-gray-300 italic">Open</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge status={r.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex justify-end gap-2">
                                            {r.status === 'open' && (
                                                <Button size="sm" onClick={() => startReconciliation(r)} className="bg-blue-600 hover:bg-blue-700">
                                                    <Send className="w-3 h-3 mr-1" /> Reconcile & Submit
                                                </Button>
                                            )}
                                            {r.status === 'submitted' && isManager && (
                                                <Button size="sm" variant="destructive" onClick={() => lockDayWithSync(r)}>
                                                    <Lock className="w-3 h-3 mr-1" /> Finish & Lock (Rule 6)
                                                </Button>
                                            )}
                                            {r.status === 'locked' && isManager && (
                                                <span className="text-gray-400 text-xs flex items-center gap-1">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Locked
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rule 9 Reconciliation Sheet */}
            <Sheet open={isReconciling} onOpenChange={setIsReconciling}>
                <SheetContent side="right" className="w-[450px] sm:w-[540px]">
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin-slow" />
                            Daily Cash Reconciliation
                        </SheetTitle>
                        <SheetDescription>
                            Rule 9: Physical cash must match calculated ledger totals.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-8 space-y-6">
                        {/* Ledger Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <span className="text-xs text-gray-500 uppercase tracking-wider block">Opening Cash</span>
                                <span className="text-lg font-bold">₹{activeRecord?.opening_cash?.toLocaleString()}</span>
                            </div>
                            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                                <span className="text-xs text-blue-600 uppercase tracking-wider block font-semibold">Expected Cash (Ledger)</span>
                                <span className="text-lg font-bold text-blue-700">₹{reconData?.expectedCash?.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Input */}
                        <div className="space-y-3 p-6 bg-white border-2 border-dashed rounded-xl">
                            <Label className="text-sm font-bold uppercase text-gray-500">Physical Cash in Hand</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₹</span>
                                <Input
                                    type="number"
                                    placeholder="Enter physical count..."
                                    className="pl-8 text-xl font-mono"
                                    value={physicalCash}
                                    onChange={(e) => handlePhysicalCashChange(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Variance Logic */}
                        {reconData && (
                            <div className={cn(
                                "p-4 rounded-lg flex items-start gap-3",
                                Math.abs(parseFloat(physicalCash) - reconData.expectedCash) < 0.01
                                    ? "bg-green-50 text-green-800 border-green-100 border"
                                    : "bg-amber-50 text-amber-800 border-amber-100 border"
                            )}>
                                {Math.abs(parseFloat(physicalCash) - reconData.expectedCash) < 0.01 ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 mt-0.5" />
                                        <div>
                                            <p className="font-bold">Perfect Match</p>
                                            <p className="text-xs">Ledger and Physical cash are perfectly reconciled.</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-5 h-5 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-bold">Cash Variance Detected</p>
                                            <p className="text-sm font-mono">
                                                Variance: <span className="font-bold">₹{(parseFloat(physicalCash) - reconData.expectedCash).toLocaleString()}</span>
                                            </p>
                                            <div className="mt-3 flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="ack"
                                                    checked={acknowledged}
                                                    onChange={(e) => setAcknowledged(e.target.checked)}
                                                    className="w-4 h-4 rounded border-amber-300"
                                                />
                                                <label htmlFor="ack" className="text-xs font-semibold">
                                                    I acknowledge this variance (Strict Audit Rule)
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <SheetFooter className="mt-10">
                        <Button
                            className="w-full h-12 text-lg font-bold"
                            disabled={processing || (Math.abs(parseFloat(physicalCash) - (reconData?.expectedCash || 0)) > 0.01 && !acknowledged)}
                            onClick={finalizeSubmission}
                        >
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Finalize & Submit Day
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}

function Badge({ status }: { status: string }) {
    const colors = {
        open: 'bg-green-100 text-green-700 border-green-200',
        submitted: 'bg-amber-100 text-amber-700 border-amber-200',
        locked: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return (
        <span className={cn("px-2 py-1 rounded-md text-[10px] uppercase font-black border tracking-widest", (colors as any)[status])}>
            {status}
        </span>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
