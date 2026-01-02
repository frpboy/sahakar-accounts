'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { createClientBrowser } from '@/lib/supabase-client';
import { Clock, ExternalLink, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentTransactionsProps {
    outletId: string;
    category: string | string[];
    title?: string;
    onSelect?: (tx: any) => void;
}

export function RecentTransactions({ outletId, category, title = "Recent Entries", onSelect }: RecentTransactionsProps) {
    const supabase = useMemo(() => createClientBrowser(), []);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecent() {
            if (!outletId) return;
            setLoading(true);
            try {
                let query = (supabase as any)
                    .from('transactions')
                    .select('*, users(full_name)')
                    .eq('outlet_id', outletId);

                if (Array.isArray(category)) {
                    query = query.in('category', category);
                } else {
                    query = query.eq('category', category);
                }

                const { data, error } = await query
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (error) throw error;
                setTransactions(data || []);
            } catch (e) {
                console.error('Error fetching recent transactions:', e);
            } finally {
                setLoading(false);
            }
        }

        fetchRecent();

        // Polling for updates every 30 seconds
        const interval = setInterval(fetchRecent, 30000);
        return () => clearInterval(interval);
    }, [outletId, category, supabase]);

    if (loading && transactions.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-4 animate-pulse">
                <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-10 bg-gray-50 dark:bg-slate-800/50 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (transactions.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="px-4 py-3 border-b dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    {title}
                </h3>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">Last 10</span>
            </div>
            <div className="divide-y dark:divide-slate-800">
                {transactions.map((tx) => (
                    <div
                        key={tx.id}
                        onClick={() => onSelect?.(tx)}
                        className={cn(
                            "px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group",
                            onSelect ? "cursor-pointer" : ""
                        )}
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-mono font-bold text-gray-900 dark:text-slate-200">
                                    {tx.entry_number || '---'}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-slate-500">
                                    {format(new Date(tx.created_at), 'hh:mm a')}
                                </span>
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                                {tx.description}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                <User className="w-2.5 h-2.5 text-gray-300 dark:text-slate-600" />
                                <span className="text-[10px] text-gray-400 dark:text-slate-500 italic">
                                    {tx.users?.full_name || 'System'}
                                </span>
                            </div>
                        </div>
                        <div className="ml-4 flex flex-col items-end">
                            <div className="text-sm font-black text-gray-900 dark:text-white">
                                ₹{parseFloat(tx.amount).toLocaleString()}
                            </div>
                            <div className="flex gap-1 mt-1">
                                {tx.payment_modes?.split(',').map((m: string) => (
                                    <span key={m} className="text-[8px] uppercase font-bold px-1 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border dark:border-slate-700">
                                        {m.trim().substring(0, 3)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {onSelect && (
                <div className="px-4 py-2 bg-gray-50 dark:bg-slate-900/50 border-t dark:border-slate-800 text-[10px] text-gray-400 dark:text-slate-500 text-center">
                    Click entry to auto-fill (if supported)
                </div>
            )}
        </div>
    );
}
