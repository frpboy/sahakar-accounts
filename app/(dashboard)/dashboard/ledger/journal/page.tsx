'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { canEditTransaction } from '@/lib/ledger-logic';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function JournalEntryPage() {
    const { user } = useAuth();
    const router = useRouter();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [submitting, setSubmitting] = useState(false);

    const [entry, setEntry] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'income', // 'income' (Credit Income) or 'expense' (Debit Expense)
        category: '',   // Sales, Purchase, etc.
        mode: 'Cash',   // Cash, Bank, Credit
        amount: '',
        reason: ''
    });

    const [lockStatus, setLockStatus] = useState<{ locked: boolean, reason?: string }>({ locked: false });

    // Check Lock Status on Date Change
    useEffect(() => {
        checkLock();
    }, [entry.date, user]);

    const checkLock = async () => {
        if (!user?.profile.outlet_id) return;
        const { allowed, reason } = canEditTransaction(entry.date, user.profile.role);
        if (!allowed) {
            setLockStatus({ locked: true, reason });
            return;
        }

        // Also check DB Day Lock (Simulated or Real if table existed)
        // For now, relying on Role Window
        setLockStatus({ locked: false });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!entry.amount || !entry.category || !entry.reason) {
            toast.error('Please fill all required fields');
            return;
        }

        if (lockStatus.locked) {
            toast.error(`Cannot post: ${lockStatus.reason}`);
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.from('transactions').insert({
                outlet_id: user?.profile.outlet_id,
                created_at: new Date().toISOString(), // Or entry.date + time? Usually Journal allows backdating within window
                // If backdating, created_at should reflect that? 
                // Or better: store `transaction_date` separately? 
                // Existing schema uses `created_at` as the date. 
                // Let's set `created_at` to the selected date (at current time or noon)
                // to ensure it falls in that day.

                type: entry.type,
                category: entry.category,
                amount: parseFloat(entry.amount),
                payment_mode: entry.mode,
                description: `MANUAL JOURNAL: ${entry.reason}`,
                created_by: user?.id,
                // status: 'completed' // if exists
            });

            if (error) throw error;

            toast.success('Journal Entry Posted Successfully');
            router.push('/dashboard/ledger/register');

        } catch (e: any) {
            toast.error(e.message || 'Failed to post entry');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Manual Journal Entry" />

            <div className="flex-1 overflow-auto p-4 flex justify-center">
                <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow border p-6">
                    <div className="mb-6 pb-4 border-b">
                        <h2 className="text-lg font-semibold">Post Adjustment / Journal</h2>
                        <p className="text-sm text-gray-500">Corrective entries only. Creates a permanent ledger record.</p>
                    </div>

                    {lockStatus.locked && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            <span><strong>Locked:</strong> {lockStatus.reason}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Journal Date</Label>
                                <Input
                                    type="date"
                                    value={entry.date}
                                    onChange={(e) => setEntry(prev => ({ ...prev, date: e.target.value }))}
                                    disabled={submitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Amount (₹)</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={entry.amount}
                                    onChange={(e) => setEntry(prev => ({ ...prev, amount: e.target.value }))}
                                    disabled={submitting || lockStatus.locked}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Transaction Impact (Dr/Cr)</Label>
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase text-gray-500">Nature</Label>
                                    <Select
                                        value={entry.type}
                                        onValueChange={(v) => setEntry(prev => ({ ...prev, type: v }))}
                                        disabled={submitting || lockStatus.locked}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="income">Income (Credit Sales/Rev)</SelectItem>
                                            <SelectItem value="expense">Expense (Debit Exp/Purch)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase text-gray-500">Category / Account</Label>
                                    <Select
                                        value={entry.category}
                                        onValueChange={(v) => setEntry(prev => ({ ...prev, category: v }))}
                                        disabled={submitting || lockStatus.locked}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sales">Sales Account</SelectItem>
                                            <SelectItem value="sales_return">Sales Return</SelectItem>
                                            <SelectItem value="purchase">Purchase Account</SelectItem>
                                            <SelectItem value="purchase_return">Purchase Return</SelectItem>
                                            <SelectItem value="operating">Operating Expense</SelectItem>
                                            <SelectItem value="salary">Staff Salary</SelectItem>
                                            <SelectItem value="rent">Rent / Utilities</SelectItem>
                                            <SelectItem value="credit_received">Credit Received (Cust)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Payment / Fund Mode</Label>
                            <Select
                                value={entry.mode}
                                onValueChange={(v) => setEntry(prev => ({ ...prev, mode: v }))}
                                disabled={submitting || lockStatus.locked}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Cash Account</SelectItem>
                                    <SelectItem value="UPI">UPI / Bank</SelectItem>
                                    <SelectItem value="Credit">Credit / Payable / Receivable</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Reason / Narration (Mandatory)</Label>
                            <Textarea
                                placeholder="Explain why this entry is being posted..."
                                value={entry.reason}
                                onChange={(e) => setEntry(prev => ({ ...prev, reason: e.target.value }))}
                                className="h-24 resize-none"
                                required
                                disabled={submitting || lockStatus.locked}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={submitting || lockStatus.locked}
                        >
                            {submitting ? 'Posting...' : 'Post to Ledger'}
                            <Save className="w-4 h-4 ml-2" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
