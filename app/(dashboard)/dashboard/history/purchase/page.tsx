'use client';

import { useEffect, useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { HistoryTable } from '@/components/history/history-table';

export default function PurchaseHistoryPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [transactions, setTransactions] = useState<any[]>([]);
    const [dutyLogs, setDutyLogs] = useState<Record<string, boolean>>({});

    useEffect(() => {
        async function loadHistory() {
            if (!user?.profile?.outlet_id) return;
            setLoading(true);
            try {
                // Fetch Duty Logs for the current user (last 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const { data: logs } = await supabase
                    .from('duty_logs' as any)
                    .select('date, duty_end')
                    .eq('user_id', user.id)
                    .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

                const logMap: Record<string, boolean> = {};
                logs?.forEach((l: any) => {
                    if (l.duty_end) logMap[l.date] = true;
                });
                setDutyLogs(logMap);

                const { data, error } = await (supabase as any)
                    .from('transactions')
                    .select(`
                        id,
                        created_at,
                        internal_entry_id,
                        entry_number,
                        customer_phone,
                        amount,
                        payment_modes,
                        category,
                        description,
                        status,
                        created_by,
                        daily_records(status, date),
                        users(full_name)
                    `)
                    .eq('outlet_id', user.profile.outlet_id)
                    .eq('category', 'purchase')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) throw error;
                setTransactions(data || []);
            } catch (e: any) {
                console.error('History error', e);
            } finally {
                setLoading(false);
            }
        }
        loadHistory();
    }, [supabase, user]);

    const handleDelete = async (row: any) => {
        try {
            const resp = await fetch(`/api/transactions/${row.id}`, { method: 'DELETE' });
            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error || 'Failed to delete');
            }
            alert('✅ Transaction deleted successfully');
            setTransactions(prev => prev.filter(t => t.id !== row.id));
        } catch (e: any) {
            alert(`❌ Error: ${e.message}`);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950 transition-colors">
            <TopBar title="Purchase History" />

            <div className="p-6 space-y-6">
                {/* Permission Notes */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-4 items-start">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">History Editing Rules</h4>
                        <div className="mt-1 text-xs text-blue-700 dark:text-blue-400 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                            <p>• <strong>Strict Audit</strong>: Direct edits are prohibited (Rule 5).</p>
                            <p>• <strong>Corrections</strong>: Use Reversal entries to void and fix records.</p>
                            <p>• <strong>Admins</strong>: Can delete records in extreme reconciliation cases.</p>
                        </div>
                    </div>
                </div>
                <HistoryTable
                    title="Purchase Transactions"
                    data={transactions}
                    loading={loading}
                    searchTerm={search}
                    onSearchChange={setSearch}
                    category="purchase"
                    emptyMessage="No purchases found"
                    currentUser={user ? { id: user.id, role: user.profile?.role || '' } : undefined}
                    dutyLogs={dutyLogs}
                    onViewRow={(row) => console.log('View', row)}
                    onDeleteRow={handleDelete}
                />
            </div>
        </div>
    );
}
