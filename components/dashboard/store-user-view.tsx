'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, IndianRupee, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';

type PaymentSlice = { name: string; value: number; color: string };

export function StoreUserDashboard() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const [txCount, setTxCount] = useState(0);
    const [totalValue, setTotalValue] = useState(0);
    const [paymentData, setPaymentData] = useState<PaymentSlice[]>([
        { name: 'UPI', value: 0, color: '#3B82F6' },
        { name: 'Cash', value: 0, color: '#10B981' },
        { name: 'Card', value: 0, color: '#8B5CF6' },
        { name: 'Credit', value: 0, color: '#F59E0B' },
    ]);

    useEffect(() => {
        let mounted = true;
        async function load() {
            if (!user?.profile.outlet_id) return;
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const isoDate = `${yyyy}-${mm}-${dd}`;

            const { data: record } = await supabase
                .from('daily_records')
                .select('id')
                .eq('outlet_id', user.profile.outlet_id)
                .eq('date', isoDate)
                .limit(1)
                .single();
            const dailyRecordId = (record as any)?.id as string | undefined;
            if (!dailyRecordId) {
                if (mounted) {
                    setTxCount(0);
                    setTotalValue(0);
                    setPaymentData((prev) => prev.map(p => ({ ...p, value: 0 })));
                }
                return;
            }

            const { data: txs } = await supabase
                .from('transactions')
                .select('amount,type,payment_modes')
                .eq('daily_record_id', dailyRecordId)
                .limit(1000);
            const list = (txs || []) as Array<{ amount: number; type: 'income' | 'expense'; payment_modes?: 'cash' | 'upi' | 'card' | 'credit' }>;

            const incomes = list.filter(t => t.type === 'income');
            const count = incomes.length;
            const total = incomes.reduce((sum, t) => sum + Number(t.amount || 0), 0);
            const groups: Record<string, number> = { upi: 0, cash: 0, card: 0, credit: 0 };
            for (const t of incomes) {
                const mode = (t.payment_modes || 'cash') as keyof typeof groups;
                if (groups[mode] !== undefined) groups[mode] += Number(t.amount || 0);
            }

            if (!mounted) return;
            setTxCount(count);
            setTotalValue(total);
            setPaymentData([
                { name: 'UPI', value: groups.upi, color: '#3B82F6' },
                { name: 'Cash', value: groups.cash, color: '#10B981' },
                { name: 'Card', value: groups.card, color: '#8B5CF6' },
                { name: 'Credit', value: groups.credit, color: '#F59E0B' },
            ]);
        }
        load();
        return () => { mounted = false; };
    }, [supabase, user]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500">Today's Sales</h3>
                        <ShoppingCart className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-gray-900">{txCount}</span>
                        <p className="text-sm text-gray-500 mt-1">Transactions</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
                        <IndianRupee className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-gray-900">₹{Math.round(totalValue).toLocaleString('en-IN')}</span>
                        <p className="text-sm text-gray-500 mt-1">Today</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500">Draft Entries</h3>
                        <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                        <span className="text-3xl font-bold text-gray-900">0</span>
                        <p className="text-sm text-gray-500 mt-1">Pending submission</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Payment Mode Distribution</h3>
                <p className="text-sm text-gray-500 mb-6">Today's sales by payment method</p>

                <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={paymentData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {paymentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap justify-center gap-6 mt-4">
                    {paymentData.map((item, idx) => (
                        <div key={idx} className="flex items-center">
                            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                            <span className="text-sm font-medium text-gray-700">{item.name}: </span>
                            <span className="text-sm text-gray-500 ml-1">₹{Math.round(item.value).toLocaleString('en-IN')}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
