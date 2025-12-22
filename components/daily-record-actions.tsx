'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DailyRecordActionsProps {
    recordId: string;
    status: 'draft' | 'submitted' | 'locked';
}

export function DailyRecordActions({ recordId, status }: DailyRecordActionsProps) {
    const queryClient = useQueryClient();

    const submitRecord = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/daily-records/${recordId}/submit`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to submit record');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-record-today'] });
        },
    });

    const lockRecord = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/daily-records/${recordId}/lock`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to lock record');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-record-today'] });
        },
    });

    if (status === 'locked') {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="font-medium text-green-900">Record Locked</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                    This daily record has been finalized and cannot be modified.
                </p>
            </div>
        );
    }

    if (status === 'submitted') {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium text-yellow-900">Submitted for Review</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                            Waiting for manager approval to lock.
                        </p>
                    </div>
                    <button
                        onClick={() => lockRecord.mutate()}
                        disabled={lockRecord.isPending}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {lockRecord.isPending ? 'Locking...' : '🔒 Lock Record'}
                    </button>
                </div>
            </div>
        );
    }

    // Draft status
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="font-medium text-blue-900">Draft</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                        You can add or modify transactions.
                    </p>
                </div>
                <button
                    onClick={() => submitRecord.mutate()}
                    disabled={submitRecord.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {submitRecord.isPending ? 'Submitting...' : '✓ Submit Record'}
                </button>
            </div>
        </div>
    );
}
