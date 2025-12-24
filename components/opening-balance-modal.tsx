'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, DollarSign, CreditCard, TrendingUp, X } from 'lucide-react';

interface OpeningBalanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    recordId: string;
    date: string;
    previousClosingCash?: number;
    previousClosingUpi?: number;
}

export function OpeningBalanceModal({
    isOpen,
    onClose,
    recordId,
    date,
    previousClosingCash = 0,
    previousClosingUpi = 0
}: OpeningBalanceModalProps) {
    const [openingCash, setOpeningCash] = useState(previousClosingCash.toString());
    const [openingUpi, setOpeningUpi] = useState(previousClosingUpi.toString());
    const queryClient = useQueryClient();

    const setOpeningBalances = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/daily-records/${recordId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    opening_cash: parseFloat(openingCash) || 0,
                    opening_upi: parseFloat(openingUpi) || 0
                })
            });
            if (!res.ok) throw new Error('Failed to set opening balances');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-record-today'] });
            onClose();
        }
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setOpeningBalances.mutate();
    };

    const totalOpening = (parseFloat(openingCash) || 0) + (parseFloat(openingUpi) || 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                        Start Your Day
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={setOpeningBalances.isPending}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <p className="font-medium text-blue-900">
                            {new Date(date).toLocaleDateString('en-IN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <p className="text-sm text-blue-700">
                        Set your opening balances to begin tracking today's transactions
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Previous Day Summary */}
                    {(previousClosingCash > 0 || previousClosingUpi > 0) && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Yesterday's Closing:</p>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Cash: ₹{previousClosingCash.toLocaleString('en-IN')}</span>
                                <span>UPI: ₹{previousClosingUpi.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    )}

                    {/* Opening Cash */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <DollarSign className="w-4 h-4 inline mr-1 text-green-600" />
                            Opening Cash Balance
                        </label>
                        <input
                            type="number"
                            value={openingCash}
                            onChange={(e) => setOpeningCash(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg"
                            required
                        />
                    </div>

                    {/* Opening UPI */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <CreditCard className="w-4 h-4 inline mr-1 text-blue-600" />
                            Opening UPI Balance
                        </label>
                        <input
                            type="number"
                            value={openingUpi}
                            onChange={(e) => setOpeningUpi(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                            required
                        />
                    </div>

                    {/* Total */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Total Opening Balance:</span>
                            <span className="text-2xl font-bold text-gray-900">
                                ₹{totalOpening.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {setOpeningBalances.isError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-red-800">
                                {setOpeningBalances.error.message}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={setOpeningBalances.isPending}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={setOpeningBalances.isPending}
                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
                        >
                            {setOpeningBalances.isPending ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    Starting...
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="w-5 h-5" />
                                    Start Day
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
