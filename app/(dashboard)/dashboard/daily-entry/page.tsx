'use client';

import React, { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Lock, Unlock, Send, Calendar } from 'lucide-react';

interface DailyRecord {
    id: string;
    date: string;
    outlet_id: string;
    opening_cash: number;
    opening_upi: number;
    closing_cash: number | null;
    closing_upi: number | null;
    status: string;
    submitted_at: string | null;
    submitted_by: string | null;
    locked_at: string | null;
    locked_by: string | null;
}

export default function DailyEntryPage() {
    const { user } = useAuth();
    const supabase = React.useMemo(() => createClientBrowser(), []);
    const [records, setRecords] = useState<DailyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

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
            console.error('Failed to load records:', e);
            alert(`Failed to load records: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const submitDay = async (recordId: string) => {
        if (!confirm('Submit this day? You won\'t be able to add more transactions.')) return;

        setProcessing(true);
        try {
            const { error } = await (supabase as any)
                .from('daily_records')
                .update({
                    status: 'submitted',
                    submitted_at: new Date().toISOString(),
                    submitted_by: user?.id
                })
                .eq('id', recordId);

            if (error) throw error;

            alert('✅ Day submitted successfully!');
            loadRecords();
        } catch (e: any) {
            console.error('Submit error:', e);
            alert(`❌ Failed to submit: ${e.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const lockDay = async (recordId: string) => {
        if (!confirm('Lock this day? This action is permanent.')) return;

        setProcessing(true);
        try {
            const { error } = await (supabase as any)
                .from('daily_records')
                .update({
                    status: 'locked',
                    locked_at: new Date().toISOString(),
                    locked_by: user?.id
                })
                .eq('id', recordId);

            if (error) throw error;

            alert('✅ Day locked successfully!');
            loadRecords();
        } catch (e: any) {
            console.error('Lock error:', e);
            alert(`❌ Failed to lock: ${e.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const unlockDay = async (recordId: string) => {
        const reason = prompt('Please provide a reason for unlocking this day for audit purposes:', 'Correction required');
        if (!reason) return;

        setProcessing(true);
        try {
            // 1. Update the record status
            const { error: updateError } = await (supabase as any)
                .from('daily_records')
                .update({
                    status: 'open',
                    locked_at: null,
                    locked_by: null
                })
                .eq('id', recordId);

            if (updateError) throw updateError;

            // 2. Log the action to audit_logs
            await (supabase as any)
                .from('audit_logs')
                .insert({
                    user_id: user?.id,
                    user_email: user?.email,
                    action: 'DAY_UNLOCK',
                    entity_type: 'daily_records',
                    entity_id: recordId,
                    reason: reason,
                    details: { date: records.find(r => r.id === recordId)?.date }
                });

            alert('✅ Day unlocked successfully and action logged.');
            loadRecords();
        } catch (e: any) {
            console.error('Unlock error:', e);
            alert(`❌ Failed to unlock: ${e.message}`);
        } finally {
            setProcessing(false);
        }
    };

    const isManager = user?.profile?.role === 'outlet_manager' || user?.profile?.role === 'master_admin' || user?.profile?.role === 'superadmin';

    if (loading) {
        return (
            <div className="flex flex-col h-full">
                <TopBar title="Daily Entry Management" />
                <div className="p-6 flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <TopBar title="Daily Entry Management" />
            <div className="p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Daily Records</h2>
                    <p className="text-gray-600 mt-1">Manage daily entry submissions and locks</p>
                </div>

                {records.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No daily records found.</p>
                        <p className="text-gray-400 text-sm mt-2">Records are created automatically when you add transactions.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Opening
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Closing
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {records.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {new Date(record.date).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            <div>Cash: ₹{record.opening_cash.toFixed(2)}</div>
                                            <div>UPI: ₹{record.opening_upi.toFixed(2)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {record.closing_cash !== null ? (
                                                <>
                                                    <div>Cash: ₹{record.closing_cash.toFixed(2)}</div>
                                                    <div>UPI: ₹{(record.closing_upi || 0).toFixed(2)}</div>
                                                </>
                                            ) : (
                                                <span className="text-gray-400">Not closed</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'locked'
                                                ? 'bg-red-100 text-red-800'
                                                : record.status === 'submitted'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-green-100 text-green-800'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex gap-2">
                                                {record.status === 'open' && (
                                                    <button
                                                        onClick={() => submitDay(record.id)}
                                                        disabled={processing}
                                                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        <Send className="w-3 h-3" />
                                                        Submit
                                                    </button>
                                                )}
                                                {record.status === 'submitted' && isManager && (
                                                    <button
                                                        onClick={() => lockDay(record.id)}
                                                        disabled={processing}
                                                        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        <Lock className="w-3 h-3" />
                                                        Lock
                                                    </button>
                                                )}
                                                {record.status === 'locked' && isManager && (
                                                    <button
                                                        onClick={() => unlockDay(record.id)}
                                                        disabled={processing}
                                                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        <Unlock className="w-3 h-3" />
                                                        Unlock
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
