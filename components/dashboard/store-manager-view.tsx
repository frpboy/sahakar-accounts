'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Users, CreditCard, TrendingUp } from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';

type TrendPoint = { day: string; value: number };
type PaymentSlice = { name: string; value: number; color: string };

export function StoreManagerDashboard() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const [weekTotal, setWeekTotal] = useState(0);
    const [avgTx, setAvgTx] = useState(0);
    const [newCustomers, setNewCustomers] = useState(0);
    const [salesTrendData, setSalesTrendData] = useState<TrendPoint[]>([]);
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
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const monthStr = `${yyyy}-${mm}`;

            try {
                const res = await fetch(`/api/reports/cash-flow?outletId=${encodeURIComponent(user.profile.outlet_id)}&month=${monthStr}`, { cache: 'no-store' });
                const cf = res.ok ? await res.json() : [];
                const last7 = (cf || []).slice(-7);
                const trend: TrendPoint[] = last7.map((d: any) => {
                    const date = new Date(d.date);
                    const day = date.toLocaleDateString('en-IN', { weekday: 'short' });
                    const value = Number(d.cash_in || 0) + Number(d.upi_in || 0);
                    return { day, value };
                });
                const weekSum = trend.reduce((s, p) => s + p.value, 0);

                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                const isoStart = startDate.toISOString().split('T')[0];
                const isoEnd = now.toISOString().split('T')[0];

                const { data: records } = await supabase
                    .from('daily_records')
                    .select('id,date')
                    .eq('outlet_id', user.profile.outlet_id)
                    .gte('date', isoStart)
                    .lte('date', isoEnd)
                    .order('date', { ascending: true });
                const recordIds = (records || []).map((r: any) => r.id);

                const { data: txs } = await supabase
                    .from('transactions')
                    .select('amount,type,payment_mode')
                    .in('daily_record_id', recordIds);
                const list = (txs || []) as Array<{ amount: number; type: 'income' | 'expense'; payment_mode?: 'cash' | 'upi' | 'card' | 'credit' }>;
                const incomes = list.filter(t => t.type === 'income');
                const avg = incomes.length ? incomes.reduce((s, t) => s + Number(t.amount || 0), 0) / incomes.length : 0;
                const groups: Record<string, number> = { upi: 0, cash: 0, card: 0, credit: 0 };
                for (const t of incomes) {
                    const mode = (t.payment_mode || 'cash') as keyof typeof groups;
                    if (groups[mode] !== undefined) groups[mode] += Number(t.amount || 0);
                }

                const { data: cust } = await (supabase as any)
                    .from('customers')
                    .select('id,created_at')
                    .eq('outlet_id', user.profile.outlet_id)
                    .gte('created_at', isoStart)
                    .lte('created_at', isoEnd);

                if (!mounted) return;
                setSalesTrendData(trend);
                setWeekTotal(weekSum);
                setAvgTx(avg);
                setPaymentData([
                    { name: 'UPI', value: groups.upi, color: '#3B82F6' },
                    { name: 'Cash', value: groups.cash, color: '#10B981' },
                    { name: 'Card', value: groups.card, color: '#8B5CF6' },
                    { name: 'Credit', value: groups.credit, color: '#F59E0B' },
                ]);
                setNewCustomers((cust || []).length);
            } catch {
                if (!mounted) return;
                setSalesTrendData([]);
                setWeekTotal(0);
                setAvgTx(0);
                setPaymentData([
                    { name: 'UPI', value: 0, color: '#3B82F6' },
                    { name: 'Cash', value: 0, color: '#10B981' },
                    { name: 'Card', value: 0, color: '#8B5CF6' },
                    { name: 'Credit', value: 0, color: '#F59E0B' },
                ]);
                setNewCustomers(0);
            }
        }
        load();
        return () => { mounted = false; };
    }, [supabase, user]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-500">Week's Sales</span>
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">₹{Math.round(weekTotal).toLocaleString('en-IN')}</div>
                    <div className="text-xs text-green-600 mt-1">Updated live</div>
                </div>
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-500">New Customers</span>
                        <Users className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{newCustomers}</div>
                    <div className="text-xs text-gray-500 mt-1">This week</div>
                </div>
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-500">Credit Outstanding</span>
                        <CreditCard className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">—</div>
                    <div className="text-xs text-gray-500 mt-1">Coming soon</div>
                </div>
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-500">Avg. Transaction</span>
                        <ShoppingCart className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">₹{Math.round(avgTx).toLocaleString('en-IN')}</div>
                    <div className="text-xs text-gray-500 mt-1">This week</div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Daily Sales Trend</h3>
                <p className="text-sm text-gray-500 mb-6">Last 7 days performance</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesTrendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${Number(value)/1000}K`} />
                            <Tooltip formatter={(value) => [`₹${Math.round(Number(value))}`, 'Sales']} />
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#3B82F6" 
                                strokeWidth={2} 
                                dot={{ r: 4, fill: "#3B82F6", strokeWidth: 2, stroke: "#fff" }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Payment Mode Split</h3>
                    <p className="text-sm text-gray-500 mb-4">This week</p>
                    <div className="flex items-center">
                        <div className="h-48 w-48 flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentData}
                                        innerRadius={40}
                                        outerRadius={60}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {paymentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="ml-6 space-y-2">
                            {paymentData.map((item, idx) => (
                                <div key={idx} className="flex items-center">
                                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                                    <span className="text-sm text-gray-600">{item.name}</span>
                                    <span className="text-sm font-semibold ml-auto pl-4">₹{Math.round(item.value).toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Staff-wise Customer Referrals</h3>
                    <p className="text-sm text-gray-500 mb-4">This month</p>
                    <div className="space-y-4">
                        {[].map(() => null)}
                        <div className="text-sm text-gray-500">Coming soon</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
