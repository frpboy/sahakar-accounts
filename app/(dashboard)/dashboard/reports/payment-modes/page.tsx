'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { useQuery } from '@tanstack/react-query';
import { Download, Calendar, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function PaymentModeAnalysisPage() {
    const supabase = createClientBrowser();
    const { user } = useAuth();
    const isAdmin = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');

    const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

    // Fetch payment mode data
    const { data: paymentData, isLoading } = useQuery({
        queryKey: ['payment-modes', dateFrom, dateTo, user?.profile?.outlet_id],
        queryFn: async () => {
            let query = (supabase as any)
                .from('transactions')
                .select('payment_mode, amount, created_at, type')
                .gte('created_at', dateFrom)
                .lte('created_at', dateTo)
                .eq('type', 'income'); // Only income transactions

            if (!isAdmin && user?.profile?.outlet_id) {
                query = query.eq('outlet_id', user.profile.outlet_id);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        enabled: !!user
    });

    // Process data for charts
    const modeBreakdown = paymentData?.reduce((acc: any, t: any) => {
        const mode = t.payment_modes || 'Unknown';
        if (!acc[mode]) {
            acc[mode] = { mode, amount: 0, count: 0 };
        }
        acc[mode].amount += t.amount;
        acc[mode].count += 1;
        return acc;
    }, {});

    const pieData = Object.values(modeBreakdown || {}).map((item: any) => ({
        name: item.mode,
        value: item.amount,
        count: item.count
    }));

    const totalAmount = pieData.reduce((sum, item) => sum + item.value, 0);

    // Trend data (last 7 days)
    const trendData = paymentData?.reduce((acc: any, t: any) => {
        const date = new Date(t.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = { date, Cash: 0, UPI: 0, Card: 0, Credit: 0 };
        }
        const mode = t.payment_modes || 'Unknown';
        acc[date][mode] = (acc[date][mode] || 0) + t.amount;
        return acc;
    }, {});

    const lineData = Object.values(trendData || {}).slice(-7);

    const handleExport = (format: 'excel' | 'pdf') => {
        const data = Object.values(modeBreakdown || {});
        const today = new Date().toISOString().split('T')[0];

        if (format === 'excel') {
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Payment Modes');
            XLSX.writeFile(wb, `Payment_Mode_Analysis_${today}.xlsx`);
        } else {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text('Payment Mode Analysis', 14, 20);
            doc.setFontSize(10);
            doc.text(`Period: ${dateFrom} to ${dateTo}`, 14, 28);

            autoTable(doc, {
                startY: 35,
                head: [['Payment Mode', 'Transactions', 'Total Amount', 'Percentage']],
                body: data.map((item: any) => [
                    item.mode,
                    item.count,
                    `₹${item.amount.toLocaleString('en-IN')}`,
                    `${((item.amount / totalAmount) * 100).toFixed(1)}%`
                ]),
            });

            doc.save(`Payment_Mode_Analysis_${today}.pdf`);
        }
    };

    // Access denied for non-authorized users (if needed)
    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <TopBar title="Payment Mode Analysis" />

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Filters */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium mb-2">From Date</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium mb-2">To Date</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleExport('excel')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Excel
                                </button>
                                <button
                                    onClick={() => handleExport('pdf')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {Object.values(modeBreakdown || {}).map((item: any, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.mode}</div>
                                        <div className="text-2xl font-bold mt-2">₹{item.amount.toLocaleString('en-IN')}</div>
                                        <div className="text-sm text-gray-500 mt-1">{item.count} transactions</div>
                                        <div className="text-sm font-medium text-blue-600 mt-1">
                                            {((item.amount / totalAmount) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Pie Chart */}
                                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                                    <h3 className="text-lg font-semibold mb-4">Payment Mode Distribution</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) => `${entry.name}: ${((entry.value / totalAmount) * 100).toFixed(1)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Trend Line Chart */}
                                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" />
                                        7-Day Trend
                                    </h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={lineData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" fontSize={12} />
                                            <YAxis fontSize={12} />
                                            <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                                            <Legend />
                                            <Line type="monotone" dataKey="Cash" stroke="#3b82f6" />
                                            <Line type="monotone" dataKey="UPI" stroke="#10b981" />
                                            <Line type="monotone" dataKey="Card" stroke="#f59e0b" />
                                            <Line type="monotone" dataKey="Credit" stroke="#ef4444" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-slate-800 border-b dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Payment Mode</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Transactions</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Amount</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg Amount</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                            {Object.values(modeBreakdown || {}).map((item: any, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{item.mode}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">{item.count}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                                                        ₹{item.amount.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        ₹{(item.amount / item.count).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-blue-600">
                                                        {((item.amount / totalAmount) * 100).toFixed(1)}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 dark:bg-slate-800 border-t dark:border-slate-700">
                                            <tr>
                                                <td className="px-6 py-4 font-bold">Total</td>
                                                <td className="px-6 py-4 text-right font-bold">
                                                    {pieData.reduce((sum, item) => sum + item.count, 0)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold">
                                                    ₹{totalAmount.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-6 py-4"></td>
                                                <td className="px-6 py-4 text-right font-bold">100%</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
