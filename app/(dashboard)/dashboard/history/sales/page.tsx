'use client';

import { useEffect, useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { HistoryTable } from '@/components/history/history-table';

export default function SalesHistoryPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [transactions, setTransactions] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadHistory() {
            if (!user?.profile?.outlet_id) return;
            setLoading(true);
            try {
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
                        daily_records(status),
                        profiles(full_name)
                    `)
                    .eq('outlet_id', user.profile.outlet_id)
                    .eq('category', 'sales')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) throw error;
                setTransactions(data || []);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        loadHistory();
    }, [supabase, user]);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <TopBar title="Sales History" />

            <div className="p-6">
                <HistoryTable
                    title="Sales Transactions"
                    data={transactions}
                    loading={loading}
                    searchTerm={search}
                    onSearchChange={setSearch}
                    category="sales"
                    emptyMessage="No sales transactions found"
                    onViewRow={(row) => console.log('View', row)}
                    onEditRow={(row) => console.log('Edit', row)}
                />
            </div>
        </div>
    );
}
