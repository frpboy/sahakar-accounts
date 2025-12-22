'use client';

import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';

interface TransactionFormProps {
    dailyRecordId: string;
}

export function TransactionForm({ dailyRecordId }: TransactionFormProps) {
    const [type, setType] = useState<'income' | 'expense'>('income');
    const [category, setCategory] = useState('');
    const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const queryClient = useQueryClient();

    const createTransaction = useMutation({
        mutationFn: async (data: any) => {
            setIsSubmitting(true);
            try {
                // Generate unique idempotency key to prevent duplicates
                const idempotencyKey = `${dailyRecordId}-${Date.now()}-${Math.random().toString(36)}`;

                const res = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Idempotency-Key': idempotencyKey,
                    },
                    body: JSON.stringify(data),
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.details || error.error || 'Failed to create transaction');
                }

                return res.json();
            } finally {
                setIsSubmitting(false);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['daily-record-today'] });
            // Reset form
            setCategory('');
            setAmount('');
            setDescription('');
        },
        onError: (error: Error) => {
            alert(`Error: ${error.message}`);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent double submission
        if (isSubmitting) {
            return;
        }

        // Client-side validation
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (!category) {
            alert('Please select a category');
            return;
        }

        createTransaction.mutate({
            dailyRecordId,
            type,
            category,
            paymentMode,
            amount: parseFloat(amount),
            description: description || undefined,
        });
    };

    const incomeCategories = [
        'consultation',
        'medicine_sale',
        'lab_test',
        'other_income',
    ];

    const expenseCategories = [
        'medicine_purchase',
        'staff_salary',
        'clinic_expenses',
        'transport',
        'rent',
        'utilities',
        'miscellaneous',
    ];

    const categories = type === 'income' ? incomeCategories : expenseCategories;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Entry</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selection */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setType('income')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${type === 'income'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Income
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('expense')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${type === 'expense'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Expense
                    </button>
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                    </label>
                    <select
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Payment Mode */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Mode *
                    </label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setPaymentMode('cash')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${paymentMode === 'cash'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            💵 Cash
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMode('upi')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${paymentMode === 'upi'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            📱 UPI
                        </button>
                    </div>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount *
                    </label>
                    <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optional notes"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting || !amount || !category}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium 
                             hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                             focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed 
                             transition-colors shadow-sm"
                >
                    {isSubmitting ? 'Adding...' : '✓ Add Transaction'}
                </button>

                {createTransaction.isError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                        Failed to add transaction. Please try again.
                    </div>
                )}
            </form>
        </div>
    );
}
