'use client';

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { CheckCircle, AlertCircle, X, Send, DollarSign, CreditCard } from 'lucide-react';

interface SubmitReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    recordId: string;
    date: string;
}

type DailyRecordDetail = {
    opening_cash: number | null;
    opening_upi: number | null;
    total_income: number | null;
    total_expense: number | null;
};

type TransactionRow = {
    type: 'income' | 'expense';
    payment_modes: string;
    amount: number | null;
};

export function SubmitReviewModal({ isOpen, onClose, recordId, date }: SubmitReviewModalProps) {
    const queryClient = useQueryClient();

    // Fetch record details and transactions
    const { data: record } = useQuery<DailyRecordDetail | null>({
        queryKey: ['daily-record', recordId],
        queryFn: async () => {
            const res = await fetch(`/api/daily-records?id=${recordId}`);
            if (!res.ok) throw new Error('Failed to fetch record');
            const records = await res.json();
            return (records?.[0] ?? null) as DailyRecordDetail | null;
        },
        enabled: isOpen
    });

    const { data: transactions } = useQuery<TransactionRow[]>({
        queryKey: ['transactions', recordId],
        queryFn: async () => {
            const res = await fetch(`/api/transactions?daily_record_id=${recordId}`);
            if (!res.ok) throw new Error('Failed to fetch transactions');
            return (await res.json()) as TransactionRow[];
        },
        enabled: isOpen
    });

    const submitMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/daily-records/${recordId}/submit`, {
                method: 'POST'
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to submit');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-record-today'] });
            queryClient.invalidateQueries({ queryKey: ['daily-record', recordId] });
            onClose();
        }
    });

    if (!isOpen || !record) return null;

    const openingCash = record.opening_cash || 0;
    const openingUpi = record.opening_upi || 0;
    const totalIncome = record.total_income || 0;
    const totalExpense = record.total_expense || 0;

    // Calculate expected closing
    const incomeTransactions = (transactions ?? []).filter((t) => t.type === 'income');
    const expenseTransactions = (transactions ?? []).filter((t) => t.type === 'expense');

    const cashIncome = incomeTransactions
        .filter((t) => t.payment_modes === 'cash')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    const upiIncome = incomeTransactions
        .filter((t) => t.payment_modes === 'upi')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    const cashExpense = expenseTransactions
        .filter((t) => t.payment_modes === 'cash')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    const upiExpense = expenseTransactions
        .filter((t) => t.payment_modes === 'upi')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const expectedCashClosing = openingCash + cashIncome - cashExpense;
    const expectedUpiClosing = openingUpi + upiIncome - upiExpense;

    // Validations
    const hasOpeningBalances = openingCash > 0 || openingUpi > 0;
    const hasTransactions = (transactions?.length || 0) > 0;
    const hasIncome = totalIncome > 0;
    const hasExpense = totalExpense > 0;

    const canSubmit = hasOpeningBalances && hasTransactions;
    const warnings: string[] = [];
    if (!hasIncome) warnings.push('No income transactions recorded');
    if (!hasExpense) warnings.push('No expense transactions recorded');
    if (transactions?.length === 1) warnings.push('Only one transaction recorded');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                        Review & Submit
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Date */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700">Submitting for:</p>
                        <p className="text-lg font-bold text-blue-900">
                            {new Date(date).toLocaleDateString('en-IN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    {/* Opening Balances */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3">1. Opening Balances</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-gray-600">Cash</span>
                                </div>
                                <p className="text-xl font-bold text-gray-900">
                                    ₹{openingCash.toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <CreditCard className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-gray-600">UPI</span>
                                </div>
                                <p className="text-xl font-bold text-gray-900">
                                    ₹{openingUpi.toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Summary */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3">2. Transaction Summary</h4>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-sm text-green-700 mb-1">Total Income</p>
                                <p className="text-2xl font-bold text-green-900">
                                    ₹{totalIncome.toLocaleString('en-IN')}
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                    {incomeTransactions.length} transaction(s)
                                </p>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-700 mb-1">Total Expense</p>
                                <p className="text-2xl font-bold text-red-900">
                                    ₹{totalExpense.toLocaleString('en-IN')}
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                    {expenseTransactions.length} transaction(s)
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            Total: <span className="font-medium">{transactions?.length || 0}</span> transactions recorded
                        </p>
                    </div>

                    {/* Expected Closing */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3">3. Expected Closing Balances</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                                <p className="text-sm text-green-700 mb-1">Cash</p>
                                <p className="text-xl font-bold text-green-900">
                                    ₹{expectedCashClosing.toLocaleString('en-IN')}
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                    {openingCash.toLocaleString()} + {cashIncome.toLocaleString()} - {cashExpense.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-700 mb-1">UPI</p>
                                <p className="text-xl font-bold text-blue-900">
                                    ₹{expectedUpiClosing.toLocaleString('en-IN')}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    {openingUpi.toLocaleString()} + {upiIncome.toLocaleString()} - {upiExpense.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Validations */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-3">4. Validation Checks</h4>
                        <div className="space-y-2">
                            <div className={`flex items-center gap-2 ${hasOpeningBalances ? 'text-green-700' : 'text-red-700'}`}>
                                {hasOpeningBalances ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5" />
                                )}
                                <span className="text-sm">Opening balances set</span>
                            </div>
                            <div className={`flex items-center gap-2 ${hasTransactions ? 'text-green-700' : 'text-red-700'}`}>
                                {hasTransactions ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5" />
                                )}
                                <span className="text-sm">Transactions recorded</span>
                            </div>
                        </div>

                        {/* Warnings */}
                        {warnings.length > 0 && (
                            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-yellow-900 mb-2">Warnings:</p>
                                <ul className="text-sm text-yellow-700 space-y-1">
                                    {warnings.map((w, i) => (
                                        <li key={i}>• {w}</li>
                                    ))}
                                </ul>
                                <p className="text-xs text-yellow-600 mt-2">
                                    You can still submit, but please verify your data is correct.
                                </p>
                            </div>
                        )}
                    </div>

                    {submitMutation.isError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800">
                                {submitMutation.error.message}
                            </p>
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={submitMutation.isPending}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white disabled:opacity-50 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => submitMutation.mutate()}
                        disabled={!canSubmit || submitMutation.isPending}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
                    >
                        {submitMutation.isPending ? (
                            <>
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Submit for Review
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
