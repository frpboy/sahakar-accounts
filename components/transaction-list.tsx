'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface TransactionListProps {
    dailyRecordId: string;
}

interface Transaction {
    id: string;
    type: 'income' | 'expense';
    category: string;
    payment_mode: 'cash' | 'upi';
    amount: number;
    description: string | null;
    created_at: string;
}

export function TransactionList({ dailyRecordId }: TransactionListProps) {
    const { data: transactions, isLoading } = useQuery<Transaction[]>({
        queryKey: ['transactions', dailyRecordId],
        queryFn: async () => {
            const res = await fetch(`/api/transactions?dailyRecordId=${dailyRecordId}`);
            if (!res.ok) throw new Error('Failed to fetch transactions');
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-center">Loading transactions...</p>
            </div>
        );
    }

    if (!transactions || transactions.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{`Today's Transactions`}</h2>
                <p className="text-gray-500 text-center py-8">
                    No transactions yet. Add your first entry above!
                </p>
            </div>
        );
    }

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatCategory = (category: string) => {
        return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">{`Today's Transactions`}</h2>
                <p className="text-sm text-gray-600 mt-1">{transactions.length} entries</p>
            </div>

            <div className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span
                                        className={`px-2 py-0.5 rounded text-xs font-medium ${transaction.type === 'income'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {transaction.type.toUpperCase()}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded text-xs font-medium ${transaction.payment_mode === 'cash'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-purple-100 text-purple-800'
                                            }`}
                                    >
                                        {transaction.payment_mode === 'cash' ? '💵 Cash' : '📱 UPI'}
                                    </span>
                                </div>
                                <p className="font-medium text-gray-900">
                                    {formatCategory(transaction.category)}
                                </p>
                                {transaction.description && (
                                    <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    {formatTime(transaction.created_at)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p
                                    className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                        }`}
                                >
                                    {transaction.type === 'income' ? '+' : '-'}₹
                                    {transaction.amount.toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
