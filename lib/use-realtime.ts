'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cacheHelpers } from './db';

// Real-time hook for daily records with caching
export function useRealtimeDailyRecords(outletId?: string) {
    const queryClient = useQueryClient();
    const supabase = createClientComponentClient();
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
                    if (payload.new) {
                        await cacheHelpers.cacheDailyRecord(payload.new as any);
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
    const supabase = createClientComponentClient();
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
                    if (payload.new) {
                        await cacheHelpers.cacheTransaction(payload.new as any);
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
    const supabase = createClientComponentClient();

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
                    if (payload.new) {
                        await cacheHelpers.cacheOutlet(payload.new as any);
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
