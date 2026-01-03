'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, CreditCard, TrendingUp, TrendingDown, List } from 'lucide-react';

interface TransactionSummaryProps {
    dailyRecordId: string;
}

type Transaction = {
    id: string;
    daily_record_id: string;
    type: 'income' | 'expense';
    category: string;
    payment_modes: string;
    amount: number;
    description: string | null;
    date: string;
    created_at: string;
};

export function TransactionSummary({ dailyRecordId }: TransactionSummaryProps) {
    const { data: transactions, isLoading } = useQuery({
        queryKey: ['transactions', dailyRecordId],
        queryFn: async () => {
            const res = await fetch(`/api/transactions?dailyRecordId=${dailyRecordId}`);
            if (!res.ok) throw new Error('Failed to fetch transactions');
            return res.json() as Promise<Transaction[]>;
        }
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!transactions || transactions.length === 0) {
        return (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <List className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No transactions recorded yet</p>
                <p className="text-sm text-gray-500 mt-1">Add your first transaction above</p>
            </div>
        );
    }

    // Group by type and payment mode
    const incomeTransactions = transactions.filter((t: Transaction) => t.type === 'income');
    const expenseTransactions = transactions.filter((t: Transaction) => t.type === 'expense');

    const cashIncome = incomeTransactions
        .filter((t: Transaction) => t.payment_modes === 'cash')
        .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);
    const upiIncome = incomeTransactions
        .filter((t: Transaction) => t.payment_modes === 'upi')
        .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);
    const cashExpense = expenseTransactions
        .filter((t: Transaction) => t.payment_modes === 'cash')
        .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);
    const upiExpense = expenseTransactions
        .filter((t: Transaction) => t.payment_modes === 'upi')
        .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

    const totalIncome = cashIncome + upiIncome;
    const totalExpense = cashExpense + upiExpense;

    // Group by category
    const categoryGroups: { [key: string]: { income: number; expense: number; count: number } } = {};
    transactions.forEach((t: Transaction) => {
        if (!categoryGroups[t.category]) {
            categoryGroups[t.category] = { income: 0, expense: 0, count: 0 };
        }
        if (t.type === 'income') {
            categoryGroups[t.category].income += t.amount || 0;
        } else {
            categoryGroups[t.category].expense += t.amount || 0;
        }
        categoryGroups[t.category].count += 1;
    });

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <List className="w-5 h-5 text-blue-600" />
                    Transaction Summary
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} recorded
                </p>
            </div>

            <div className="p-6 space-y-6">
                {/* Overall Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Total Income</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900">
                            ₹{totalIncome.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                            {incomeTransactions.length} transaction{incomeTransactions.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-medium text-red-700">Total Expense</span>
                        </div>
                        <p className="text-2xl font-bold text-red-900">
                            ₹{totalExpense.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                            {expenseTransactions.length} transaction{expenseTransactions.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Payment Mode Split */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment Mode Breakdown</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-gray-700">Cash</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-600">Income:</span>
                                    <span className="font-medium">₹{cashIncome.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-red-600">Expense:</span>
                                    <span className="font-medium">₹{cashExpense.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="pt-2 border-t border-gray-300 flex justify-between text-sm font-bold">
                                    <span>Net:</span>
                                    <span className={cashIncome - cashExpense >= 0 ? 'text-green-700' : 'text-red-700'}>
                                        ₹{(cashIncome - cashExpense).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                <CreditCard className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">UPI</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-600">Income:</span>
                                    <span className="font-medium">₹{upiIncome.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-red-600">Expense:</span>
                                    <span className="font-medium">₹{upiExpense.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="pt-2 border-t border-gray-300 flex justify-between text-sm font-bold">
                                    <span>Net:</span>
                                    <span className={upiIncome - upiExpense >= 0 ? 'text-green-700' : 'text-red-700'}>
                                        ₹{(upiIncome - upiExpense).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">By Category</h4>
                    <div className="space-y-2">
                        {Object.entries(categoryGroups)
                            .sort(([, a], [, b]) => (b.income + b.expense) - (a.income + a.expense))
                            .map(([category, data]) => (
                                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div>
                                        <p className="font-medium text-gray-900">{category}</p>
                                        <p className="text-xs text-gray-500">{data.count} transaction{data.count !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="text-right">
                                        {data.income > 0 && (
                                            <p className="text-sm text-green-600">+₹{data.income.toLocaleString('en-IN')}</p>
                                        )}
                                        {data.expense > 0 && (
                                            <p className="text-sm text-red-600">-₹{data.expense.toLocaleString('en-IN')}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
