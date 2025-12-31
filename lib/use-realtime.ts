'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClientBrowser } from '@/lib/supabase-client';
import { cacheHelpers } from './db';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

type DailyRecordRealtimeRow = {
    id: string;
    outlet_id: string;
    date: string;
    opening_cash: number | null;
    opening_upi: number | null;
    closing_cash: number | null;
    closing_upi: number | null;
    total_income: number | null;
    total_expense: number | null;
    status: 'draft' | 'submitted' | 'locked';
};

type TransactionRealtimeRow = {
    id: string;
    daily_record_id: string;
    type: 'income' | 'expense';
    category: string;
    payment_mode: 'cash' | 'upi';
    amount: number;
    description: string | null;
    date: string;
};

type OutletRealtimeRow = {
    id: string;
    name: string;
    code: string;
    address?: string | null;
    phone?: string | null;
};

// Real-time hook for daily records with caching
export function useRealtimeDailyRecords(outletId?: string) {
    const queryClient = useQueryClient();
  const supabase = createClientBrowser();
    const [isRealtime, setIsRealtime] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['daily-records-realtime', outletId],
        queryFn: async () => {
            // Try cache first
            if (outletId) {
                const cached = await cacheHelpers.getDailyRecordsByOutlet(outletId);
                if (cached.length > 0) {
                    console.log('[Cache] Using cached daily records');
                    return cached;
                }
            }

            // Fetch from API
            const url = outletId ? `/api/daily-records?outletId=${outletId}` : '/api/daily-records';
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch daily records');

            const data = await res.json();

            // Cache each record
            if (Array.isArray(data)) {
                await Promise.all(data.map(record => cacheHelpers.cacheDailyRecord(record)));
            }

            return data;
        },
        staleTime: 30000, // 30 seconds
        refetchOnWindowFocus: false,
    });

    // Set up real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('daily-records-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'daily_records',
                    filter: outletId ? `outlet_id=eq.${outletId}` : undefined,
                },
                async (payload) => {
                    console.log('[Realtime] Daily record changed:', payload);

                    // Update cache
                    if (isRecord(payload.new)) {
                        const row = payload.new as Partial<DailyRecordRealtimeRow>;
                        if (typeof row.id === 'string' && typeof row.outlet_id === 'string' && typeof row.date === 'string') {
                            await cacheHelpers.cacheDailyRecord({
                                id: row.id,
                                outlet_id: row.outlet_id,
                                date: row.date,
                                opening_cash: typeof row.opening_cash === 'number' ? row.opening_cash : 0,
                                opening_upi: typeof row.opening_upi === 'number' ? row.opening_upi : 0,
                                closing_cash: typeof row.closing_cash === 'number' ? row.closing_cash : 0,
                                closing_upi: typeof row.closing_upi === 'number' ? row.closing_upi : 0,
                                total_income: typeof row.total_income === 'number' ? row.total_income : 0,
                                total_expense: typeof row.total_expense === 'number' ? row.total_expense : 0,
                                status: row.status === 'submitted' || row.status === 'locked' ? row.status : 'draft',
                            });
                        }
                    }

                    // Invalidate and refetch
                    queryClient.invalidateQueries({ queryKey: ['daily-records-realtime', outletId] });
                    setIsRealtime(true);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [outletId, supabase, queryClient]);

    return { data, isLoading, error, isRealtime };
}

// Real-time hook for transactions with caching
export function useRealtimeTransactions(dailyRecordId?: string) {
    const queryClient = useQueryClient();
    const supabase = createClientBrowser();
    const [isRealtime, setIsRealtime] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['transactions-realtime', dailyRecordId],
        queryFn: async () => {
            // Try cache first
            if (dailyRecordId) {
                const cached = await cacheHelpers.getTransactionsByDailyRecord(dailyRecordId);
                if (cached.length > 0) {
                    console.log('[Cache] Using cached transactions');
                    return cached;
                }
            }

            // Fetch from API
            const url = dailyRecordId
                ? `/api/transactions?dailyRecordId=${dailyRecordId}`
                : '/api/transactions';
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch transactions');

            const data = await res.json();

            // Cache each transaction
            if (Array.isArray(data)) {
                await Promise.all(data.map(tx => cacheHelpers.cacheTransaction(tx)));
            }

            return data;
        },
        enabled: !!dailyRecordId,
        staleTime: 10000, // 10 seconds
        refetchOnWindowFocus: false,
    });

    // Set up real-time subscription
    useEffect(() => {
        if (!dailyRecordId) return;

        const channel = supabase
            .channel('transactions-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                    filter: `daily_record_id=eq.${dailyRecordId}`,
                },
                async (payload) => {
                    console.log('[Realtime] Transaction changed:', payload);

                    // Update cache
                    if (isRecord(payload.new)) {
                        const row = payload.new as Partial<TransactionRealtimeRow>;
                        if (
                            typeof row.id === 'string' &&
                            typeof row.daily_record_id === 'string' &&
                            typeof row.type === 'string' &&
                            typeof row.category === 'string' &&
                            typeof row.payment_mode === 'string' &&
                            typeof row.amount === 'number'
                        ) {
                            const dateValue =
                                typeof row.date === 'string'
                                    ? row.date
                                    : new Date().toISOString().split('T')[0];

                            await cacheHelpers.cacheTransaction({
                                id: row.id,
                                daily_record_id: row.daily_record_id,
                                type: row.type === 'expense' ? 'expense' : 'income',
                                category: row.category,
                                payment_mode: row.payment_mode === 'upi' ? 'upi' : 'cash',
                                amount: row.amount,
                                description: typeof row.description === 'string' ? row.description : undefined,
                                date: dateValue,
                            });
                        }
                    }

                    // Invalidate and refetch
                    queryClient.invalidateQueries({ queryKey: ['transactions-realtime', dailyRecordId] });
                    queryClient.invalidateQueries({ queryKey: ['daily-record-today'] });
                    setIsRealtime(true);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [dailyRecordId, supabase, queryClient]);

    return { data, isLoading, error, isRealtime };
}

// Real-time hook for outlets with caching
export function useRealtimeOutlets() {
    const queryClient = useQueryClient();
    const supabase = createClientBrowser();

    const { data, isLoading, error } = useQuery({
        queryKey: ['outlets-realtime'],
        queryFn: async () => {
            // Try cache first
            const cached = await cacheHelpers.getAllOutlets();
            if (cached.length > 0) {
                console.log('[Cache] Using cached outlets');
                return cached;
            }

            // Fetch from API
            const res = await fetch('/api/outlets');
            if (!res.ok) throw new Error('Failed to fetch outlets');

            const data = await res.json();

            // Cache each outlet
            if (Array.isArray(data)) {
                await Promise.all(data.map(outlet => cacheHelpers.cacheOutlet(outlet)));
            }

            return data;
        },
        staleTime: 300000, // 5 minutes
        refetchOnWindowFocus: false,
    });

    // Set up real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('outlets-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'outlets',
                },
                async (payload) => {
                    console.log('[Realtime] Outlet changed:', payload);

                    // Update cache
                    if (isRecord(payload.new)) {
                        const row = payload.new as Partial<OutletRealtimeRow>;
                        if (typeof row.id === 'string' && typeof row.name === 'string' && typeof row.code === 'string') {
                            await cacheHelpers.cacheOutlet({
                                id: row.id,
                                name: row.name,
                                code: row.code,
                                address: typeof row.address === 'string' ? row.address : undefined,
                                phone: typeof row.phone === 'string' ? row.phone : undefined,
                            });
                        }
                    }

                    // Invalidate and refetch
                    queryClient.invalidateQueries({ queryKey: ['outlets-realtime'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, queryClient]);

    return { data, isLoading, error };
}
