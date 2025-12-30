'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, X, AlertCircle } from 'lucide-react';

interface UnlockModalProps {
    recordId: string;
    recordDate: string;
    outletName: string;
    onClose: () => void;
}

export function UnlockRecordModal({ recordId, recordDate, outletName, onClose }: UnlockModalProps) {
    const [reason, setReason] = useState('');
    const queryClient = useQueryClient();

    const unlockMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/daily-records/${recordId}/unlock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to unlock record');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-records'] });
            queryClient.invalidateQueries({ queryKey: ['locked-records'] });
            onClose();
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            alert('Unlock reason is mandatory for audit compliance');
            return;
        }
        unlockMutation.mutate();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Lock className="w-6 h-6 text-orange-600" />
                        Unlock Locked Record
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600">Date: <span className="font-medium text-gray-900">{new Date(recordDate).toLocaleDateString('en-IN')}</span></p>
                    <p className="text-sm text-gray-600">Outlet: <span className="font-medium text-gray-900">{outletName}</span></p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-900 mb-1">Critical Action</p>
                            <p className="text-sm text-red-700">
                                {`Unlocking will revert this record to "submitted" status and allow modifications.`}
                                HO Accountant will be notified of this action.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unlock Reason <span className="text-red-600">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Transaction correction needed, incorrect closing balance, data entry error"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            rows={4}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This reason will be permanently logged in the audit trail
                        </p>
                    </div>

                    {unlockMutation.isError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-red-800">
                                {unlockMutation.error.message}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={unlockMutation.isPending}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={unlockMutation.isPending || !reason.trim()}
                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                        >
                            {unlockMutation.isPending ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    Unlocking...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    Unlock Record
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
