'use client';

import { useQuery } from '@tanstack/react-query';

interface Transaction {
    id: string;
    type: 'income' | 'expense';
    category: string;
    payment_mode: 'cash' | 'upi';
    amount: number;
    description: string | null;
    created_at: string;
}

interface TransactionListProps {
    dailyRecordId: string;
}

export function TransactionList({ dailyRecordId }: TransactionListProps) {
    const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
        queryKey: ['transactions', dailyRecordId],
        queryFn: async () => {
            const res = await fetch(`/api/transactions?dailyRecordId=${dailyRecordId}`);
            if (!res.ok) throw new Error('Failed to fetch transactions');
            return res.json();
        },
    });

    if (isLoading) {
        return <div className="text-center py-8 text-gray-500">Loading transactions...</div>;
    }

    if (transactions.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">No transactions yet today</p>
                <p className="text-sm text-gray-400 mt-2">Add your first entry above</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    Today's Transactions ({transactions.length})
                </h3>
            </div>

            <div className="divide-y divide-gray-200">
                {transactions.map((txn) => (
                    <div key={txn.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${txn.type === 'income'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {txn.type === 'income' ? '💰' : '💸'} {txn.type.toUpperCase()}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {txn.payment_mode === 'cash' ? '💵' : '📱'} {txn.payment_mode.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-gray-900">{txn.category}</p>
                                {txn.description && (
                                    <p className="text-sm text-gray-600 mt-1">{txn.description}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                    {new Date(txn.created_at).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                            <div className="text-right ml-4">
                                <p
                                    className={`text-lg font-bold ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'
                                        }`}
                                >
                                    {txn.type === 'income' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN', {
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
