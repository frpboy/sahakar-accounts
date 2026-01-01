'use client';

import React, { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { db, DraftTransaction } from '@/lib/offline-db';
import { Trash2, Upload, Edit, Clock } from 'lucide-react';
import { createClientBrowser } from '@/lib/supabase-client';

export default function DraftsPage() {
    const { user } = useAuth();
    const supabase = createClientBrowser();
    const [drafts, setDrafts] = useState<DraftTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        loadDrafts();
    }, []);

    const loadDrafts = async () => {
        try {
            const allDrafts = await db.drafts.toArray();
            setDrafts(allDrafts.filter(d => !d.synced));
        } catch (error) {
            console.error('Failed to load drafts:', error);
        } finally {
            setLoading(false);
        }
    };

    const syncDraft = async (draft: DraftTransaction) => {
        if (!user?.profile?.outlet_id) return;

        setSyncing(true);
        try {
            // Get or create today's daily_record
            const today = new Date().toISOString().split('T')[0];

            let dailyRecordId: string;
            const { data: existingRecord } = await (supabase as any)
                .from('daily_records')
                .select('id')
                .eq('outlet_id', user.profile.outlet_id)
                .eq('date', today)
                .single();

            if (existingRecord) {
                dailyRecordId = existingRecord.id;
            } else {
                const { data: newRecord, error: recordError } = await (supabase as any)
                    .from('daily_records')
                    .insert({
                        outlet_id: user.profile.outlet_id,
                        date: today,
                        opening_cash: 0,
                        opening_upi: 0,
                        status: 'open'
                    })
                    .select('id')
                    .single();

                if (recordError) throw recordError;
                dailyRecordId = newRecord.id;
            }

            // Create transaction
            const { error } = await (supabase as any)
                .from('transactions')
                .insert({
                    daily_record_id: dailyRecordId,
                    outlet_id: draft.outlet_id,
                    entry_number: draft.entry_number,
                    transaction_type: draft.transaction_type,
                    category: draft.category,
                    description: draft.description,
                    amount: draft.amount,
                    payment_modes: draft.payment_modes,
                    customer_phone: draft.customer_phone,
                    created_by: user.id
                });

            if (error) throw error;

            // Mark as synced
            if (draft.id) {
                await db.drafts.update(draft.id, { synced: true });
            }

            alert('✅ Draft synced successfully!');
            loadDrafts();
        } catch (e: any) {
            console.error('Sync error:', e);
            alert(`❌ Failed to sync: ${e?.message}`);
        } finally {
            setSyncing(false);
        }
    };

    const syncAll = async () => {
        setSyncing(true);
        for (const draft of drafts) {
            await syncDraft(draft);
        }
        setSyncing(false);
    };

    const deleteDraft = async (id: number) => {
        if (!confirm('Delete this draft?')) return;

        try {
            await db.drafts.delete(id);
            loadDrafts();
        } catch (error) {
            console.error('Failed to delete draft:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full">
                <TopBar title="Draft Entries" />
                <div className="p-6 flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <TopBar title="Draft Entries" />
            <div className="p-6">
                {drafts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No draft entries found.</p>
                        <p className="text-gray-400 text-sm mt-2">Drafts are created when you save transactions offline.</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 flex justify-between items-center">
                            <p className="text-gray-600">{drafts.length} draft(s) pending sync</p>
                            <button
                                onClick={syncAll}
                                disabled={syncing}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4" />
                                {syncing ? 'Syncing...' : 'Sync All'}
                            </button>
                        </div>

                        <div className="grid gap-4">
                            {drafts.map((draft) => (
                                <div key={draft.id} className="bg-white rounded-lg shadow-sm border p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${draft.transaction_type === 'income'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {draft.category}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(draft.created_at).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            <p className="font-medium text-gray-900">{draft.description}</p>
                                            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Entry:</span> {draft.entry_number}
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Amount:</span> ₹{draft.amount.toFixed(2)}
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Payment:</span> {draft.payment_modes}
                                                </div>
                                                {draft.customer_phone && (
                                                    <div>
                                                        <span className="text-gray-500">Customer:</span> {draft.customer_phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => syncDraft(draft)}
                                                disabled={syncing}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                                                title="Sync now"
                                            >
                                                <Upload className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => draft.id && deleteDraft(draft.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
