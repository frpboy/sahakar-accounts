'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Category {
    id: string;
    code: string;
    name: string;
    type: 'income' | 'expense';
}

interface TransactionFormProps {
    dailyRecordId: string;
    onSuccess?: () => void;
}

export function TransactionForm({ dailyRecordId, onSuccess }: TransactionFormProps) {
    const queryClient = useQueryClient();
    const [type, setType] = useState<'income' | 'expense'>('income');
    const [category, setCategory] = useState('');
    const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    // Fetch categories
    const { data: categories = [] } = useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await fetch('/api/categories');
            if (!res.ok) throw new Error('Failed to fetch categories');
            return res.json();
        },
    });

    // Filter categories by type
    const filteredCategories = categories.filter((cat) => cat.type === type);

    // Reset category when type changes
    useEffect(() => {
        setCategory('');
    }, [type]);

    // Create transaction mutation
    const createTransaction = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create transaction');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['daily-record-today'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

            // Reset form
            setAmount('');
            setDescription('');
            setCategory('');

            onSuccess?.();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!category || !amount || parseFloat(amount) <= 0) {
            alert('Please fill all required fields');
            return;
        }

        createTransaction.mutate({
            dailyRecordId,
            type,
            category,
            paymentMode,
            amount: parseFloat(amount),
            description: description.trim() || null,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Entry</h3>

            {/* Type Toggle */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setType('income')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${type === 'income'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        💰 Income
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('expense')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${type === 'expense'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        💸 Expense
                    </button>
                </div>
            </div>

            {/* Category Select */}
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                </label>
                <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">Select category...</option>
                    {filteredCategories.map((cat) => (
                        <option key={cat.id} value={cat.code}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Payment Mode Toggle */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setPaymentMode('cash')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${paymentMode === 'cash'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        💵 Cash
                    </button>
                    <button
                        type="button"
                        onClick={() => setPaymentMode('upi')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${paymentMode === 'upi'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        📱 UPI
                    </button>
                </div>
            </div>

            {/* Amount Input */}
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Amount * (₹)
                </label>
                <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                </label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Add notes..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={createTransaction.isPending}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {createTransaction.isPending ? 'Adding...' : '✓ Add Transaction'}
            </button>

            {createTransaction.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {createTransaction.error.message}
                </div>
            )}
        </form>
    );
}
