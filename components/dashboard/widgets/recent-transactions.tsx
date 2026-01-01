'use client';

import React from 'react';
import { IndianRupee, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
}

interface RecentTransactionsProps {
    transactions: Transaction[];
    loading?: boolean;
    title?: string;
    limit?: number;
}

export function RecentTransactions({
    transactions,
    loading,
    title = 'Recent Transactions',
    limit = 10
}: RecentTransactionsProps) {
    const displayTransactions = transactions.slice(0, limit);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center gap-3">
                            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!displayTransactions || displayTransactions.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
                <div className="text-center py-8 text-gray-400">
                    No transactions yet
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {displayTransactions.map((transaction) => (
                    <div
                        key={transaction.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div
                            className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center",
                                transaction.type === 'income'
                                    ? 'bg-green-100'
                                    : 'bg-red-100'
                            )}
                        >
                            {transaction.type === 'income' ? (
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            ) : (
                                <TrendingDown className="h-5 w-5 text-red-600" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {transaction.description}
                            </p>
                            <p className="text-xs text-gray-500">
                                {new Date(transaction.date).toLocaleDateString()} • {transaction.category}
                            </p>
                        </div>
                        <div className="text-right">
                            <p
                                className={cn(
                                    "text-sm font-semibold",
                                    transaction.type === 'income'
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                )}
                            >
                                {transaction.type === 'income' ? '+' : '-'}
                                ₹{transaction.amount.toFixed(2)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
