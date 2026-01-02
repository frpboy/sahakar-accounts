import { useQuery } from '@tanstack/react-query';
import { createClientBrowser } from '@/lib/supabase-client';

export function useLedgerLocks(outletId: string | undefined, fromDate: string, toDate: string) {
    const supabase = createClientBrowser();

    return useQuery({
        queryKey: ['ledger-locks', outletId, fromDate, toDate],
        queryFn: async () => {
            if (!outletId) return {};

            const { data, error } = await supabase
                .from('day_locks')
                .select('date, is_locked')
                .eq('outlet_id', outletId)
                .gte('date', fromDate)
                .lte('date', toDate);

            if (error) throw error;

            // Map: DateString -> isLocked
            const lockMap: Record<string, boolean> = {};
            data?.forEach((lock: any) => {
                lockMap[lock.date] = lock.is_locked;
            });

            return lockMap;
        },
        enabled: !!outletId,
        staleTime: 1000 * 60 * 5 // 5 Minutes
    });
}
