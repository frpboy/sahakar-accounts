'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Lock, Unlock } from 'lucide-react';
import { createClientBrowser } from '@/lib/supabase-client';

interface MonthClosureActionsProps {
    outletId: string;
    month: string; // YYYY-MM
    status: 'open' | 'closed';
    onStatusChange?: () => void;
}

export function MonthClosureActions({ outletId, month, status, onStatusChange }: MonthClosureActionsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClientBrowser();
    const queryClient = useQueryClient();

    const handleCloseMonth = async () => {
        if (!confirm('Are you sure you want to CLOSE this month? No further edits will be allowed.')) return;
        setIsLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase.rpc('close_month', {
                outlet_id_param: outletId,
                month_param: `${month}-01`,
                closed_by_user_id: user.id,
                close_reason: 'Manual closure via dashboard'
            });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.error || 'Failed to close month');

            queryClient.invalidateQueries({ queryKey: ['monthly-report'] });
            if (onStatusChange) onStatusChange();
        } catch (err: unknown) {
            console.error('Close month error:', err);
            setError(err instanceof Error ? err.message : 'Failed to close month');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReopenMonth = async () => {
        const reason = prompt('Please provide a reason for reopening this month:');
        if (!reason) return;

        setIsLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase.rpc('reopen_month', {
                outlet_id_param: outletId,
                month_param: `${month}-01`,
                reopened_by_user_id: user.id,
                reopen_reason: reason
            });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.error || 'Failed to reopen month');

            queryClient.invalidateQueries({ queryKey: ['monthly-report'] });
            if (onStatusChange) onStatusChange();
        } catch (err: unknown) {
            console.error('Reopen month error:', err);
            setError(err instanceof Error ? err.message : 'Failed to reopen month');
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'closed') {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-red-600" />
                        <div>
                            <h3 className="font-semibold text-red-900">Month Closed</h3>
                            <p className="text-sm text-red-700">This month is locked. No changes allowed.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleReopenMonth}
                        disabled={isLoading}
                        className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50 text-sm font-medium"
                    >
                        {isLoading ? 'Reopening...' : 'Reopen Month'}
                    </button>
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
        );
    }

    return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Unlock className="w-5 h-5 text-green-600" />
                    <div>
                        <h3 className="font-semibold text-green-900">Month Open</h3>
                        <p className="text-sm text-green-700">Daily records can be submitted and modified.</p>
                    </div>
                </div>
                <button
                    onClick={handleCloseMonth}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                >
                    {isLoading ? 'Closing...' : 'Close Month'}
                </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
}
