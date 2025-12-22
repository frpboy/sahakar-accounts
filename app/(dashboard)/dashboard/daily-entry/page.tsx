'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import type { Outlet, DailyRecord, Transaction, Category } from '@/lib/db';

export default function DailyEntryPage() {
    const router = useRouter();
    const [selectedOutlet, setSelectedOutlet] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [dailyRecord, setDailyRecord] = useState<DailyRecord | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Transaction form state
    const [type, setType] = useState<'income' | 'expense'>('income');
    const [category, setCategory] = useState('');
    const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedOutlet && selectedDate) {
            loadDailyRecord();
        }
    }, [selectedOutlet, selectedDate]);

    async function loadInitialData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Load user's outlets
            const { data: userData } = await supabase
                .from('users')
                .select('*, organization_id')
                .eq('id', user.id)
                .single();

            if (!userData) return;

            // Load outlets based on role
            let outletsData;
            if (userData.role === 'master_admin' || userData.role === 'ho_accountant') {
                const { data } = await supabase
                    .from('outlets')
                    .select('*')
                    .eq('organization_id', userData.organization_id)
                    .eq('is_active', true)
                    .order('name');
                outletsData = data;
            } else {
                const { data } = await supabase
                    .from('user_outlet_access')
                    .select('outlets(*)')
                    .eq('user_id', user.id);
                outletsData = data?.map(d => d.outlets as unknown as Outlet);
            }

            setOutlets(outletsData || []);
            if (outletsData && outletsData.length > 0) {
                setSelectedOutlet(outletsData[0].id);
            }

            // Load categories
            const { data: categoriesData } = await supabase
                .from('categories')
                .select('*')
                .eq('organization_id', userData.organization_id)
                .eq('is_active', true)
                .order('name');
            setCategories(categoriesData || []);

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadDailyRecord() {
        try {
            // Try to get existing daily record
            const { data } = await supabase
                .from('daily_records')
                .select('*')
                .eq('outlet_id', selectedOutlet)
                .eq('date', selectedDate)
                .maybeSingle();

            if (data) {
                setDailyRecord(data);
                // Load transactions
                const { data: txData } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('daily_record_id', data.id)
                    .order('created_at');
                setTransactions(txData || []);
            } else {
                // Create new daily record with previous day's closing as opening
                const previousDate = new Date(selectedDate);
                previousDate.setDate(previousDate.getDate() - 1);

                const { data: prevRecord } = await supabase
                    .from('daily_records')
                    .select('closing_cash, closing_upi')
                    .eq('outlet_id', selectedOutlet)
                    .eq('date', format(previousDate, 'yyyy-MM-dd'))
                    .maybeSingle();

                const { data: newRecord } = await supabase
                    .from('daily_records')
                    .insert({
                        outlet_id: selectedOutlet,
                        date: selectedDate,
                        opening_cash: prevRecord?.closing_cash || 0,
                        opening_upi: prevRecord?.closing_upi || 0,
                    })
                    .select()
                    .single();

                setDailyRecord(newRecord);
                setTransactions([]);
            }
        } catch (error) {
            console.error('Error loading daily record:', error);
        }
    }

    async function handleAddTransaction() {
        if (!dailyRecord || !category || !amount) return;

        if (dailyRecord.status === 'locked') {
            alert('This day is locked and cannot be modified');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('transactions')
                .insert({
                    daily_record_id: dailyRecord.id,
                    type,
                    category,
                    payment_mode: paymentMode,
                    amount: parseFloat(amount),
                    description: description || null,
                    created_by: user?.id,
                })
                .select()
                .single();

            if (error) throw error;

            // Add to local state
            setTransactions([..transactions, data]);

            // Recalculate totals
            await recalculateTotals([...transactions, data]);

            // Reset form
            setAmount('');
            setDescription('');
        } catch (error) {
            console.error('Error adding transaction:', error);
            alert('Failed to add transaction');
        }
    }

    async function recalculateTotals(txs: Transaction[]) {
        if (!dailyRecord) return;

        const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const cashIn = txs.filter(t => t.type === 'income' && t.payment_mode === 'cash').reduce((sum, t) => sum + t.amount, 0);
        const cashOut = txs.filter(t => t.type === 'expense' && t.payment_mode === 'cash').reduce((sum, t) => sum + t.amount, 0);
        const upiIn = txs.filter(t => t.type === 'income' && t.payment_mode === 'upi').reduce((sum, t) => sum + t.amount, 0);
        const upiOut = txs.filter(t => t.type === 'expense' && t.payment_mode === 'upi').reduce((sum, t) => sum + t.amount, 0);

        const updated = {
            total_income: income,
            total_expense: expense,
            closing_cash: dailyRecord.opening_cash + cashIn - cashOut,
            closing_upi: dailyRecord.opening_upi + upiIn - upiOut,
        };

        await supabase
            .from('daily_records')
            .update(updated)
            .eq('id', dailyRecord.id);

        setDailyRecord({ ...dailyRecord, ...updated });
    }

    async function handleSubmitDay() {
        if (!dailyRecord) return;

        if (transactions.length === 0) {
            alert('Please add at least one transaction before submitting');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();

            await supabase
                .from('daily_records')
                .update({
                    status: 'submitted',
                    submitted_at: new Date().toISOString(),
                    submitted_by: user?.id,
                })
                .eq('id', dailyRecord.id);

            alert('Day submitted successfully!');
            router.refresh();
        } catch (error) {
            console.error('Error submitting day:', error);
            alert('Failed to submit day');
        }
    }

    const filteredCategories = categories.filter(c => c.type === type);

    if (loading) {
        return <div className="flex justify-center py-12">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Daily Entry</h2>
                {dailyRecord && dailyRecord.status !== 'draft' && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${dailyRecord.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                        }`}>
                        {dailyRecord.status.toUpperCase()}
                    </span>
                )}
            </div>

            {/* Outlet and Date Selection */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Outlet
                        </label>
                        <select
                            value={selectedOutlet}
                            onChange={(e) => setSelectedOutlet(e.target.value)}
                            disabled={dailyRecord?.status !== 'draft'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            {outlets.map(outlet => (
                                <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={format(new Date(), 'yyyy-MM-dd')}
                            disabled={dailyRecord?.status !== 'draft'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Opening Balances */}
            {dailyRecord && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Opening Balances</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Cash</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {formatCurrency(dailyRecord.opening_cash)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">UPI</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {formatCurrency(dailyRecord.opening_upi)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Entry Form */}
            {dailyRecord && dailyRecord.status === 'draft' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add Transaction</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                            <select
                                value={type}
                                onChange={(e) => {
                                    setType(e.target.value as 'income' | 'expense');
                                    setCategory('');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select category</option>
                                {filteredCategories.map(cat => (
                                    <option key={cat.id} value={cat.code}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment</label>
                            <select
                                value={paymentMode}
                                onChange={(e) => setPaymentMode(e.target.value as 'cash' | 'upi')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="cash">Cash</option>
                                <option value="upi">UPI</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleAddTransaction}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Add Transaction
                    </button>
                </div>
            )}

            {/* Transactions List */}
            {dailyRecord && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-medium text-gray-900">Transactions ({transactions.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No transactions yet. Add your first transaction above.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map(tx => (
                                        <tr key={tx.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${tx.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.category}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.payment_mode.toUpperCase()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                                {formatCurrency(tx.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{tx.description || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Closing Balances & Submit */}
            {dailyRecord && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Day Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <p className="text-sm text-gray-600">Total Income</p>
                            <p className="text-xl font-semibold text-green-600">
                                {formatCurrency(dailyRecord.total_income)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Expense</p>
                            <p className="text-xl font-semibold text-red-600">
                                {formatCurrency(dailyRecord.total_expense)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Closing Cash</p>
                            <p className="text-xl font-semibold text-gray-900">
                                {formatCurrency(dailyRecord.closing_cash)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Closing UPI</p>
                            <p className="text-xl font-semibold text-gray-900">
                                {formatCurrency(dailyRecord.closing_upi)}
                            </p>
                        </div>
                    </div>
                    {dailyRecord.status === 'draft' && (
                        <button
                            onClick={handleSubmitDay}
                            className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                        >
                            Submit Day
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
