'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface CashFlowData {
    date: string;
    cash_in: number;
    cash_out: number;
    upi_in: number;
    upi_out: number;
    net_cash: number;
    net_upi: number;
}

export default function CashFlowReportPage() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    // Mock data - replace with actual API call
    const { data: cashFlowData, isLoading } = useQuery<CashFlowData[]>({
        queryKey: ['cash-flow', selectedMonth],
        queryFn: async () => {
            const res = await fetch(`/api/reports/cash-flow?month=${selectedMonth}`);
            if (!res.ok) throw new Error('Failed to fetch cash flow data');
            return res.json();
        },
    });

    const totalCashIn = cashFlowData?.reduce((sum, d) => sum + d.cash_in, 0) || 0;
    const totalCashOut = cashFlowData?.reduce((sum, d) => sum + d.cash_out, 0) || 0;
    const totalUPIIn = cashFlowData?.reduce((sum, d) => sum + d.upi_in, 0) || 0;
    const totalUPIOut = cashFlowData?.reduce((sum, d) => sum + d.upi_out, 0) || 0;
    const netCashFlow = totalCashIn - totalCashOut + totalUPIIn - totalUPIOut;

    return (
        <ProtectedRoute allowedRoles={['master_admin', 'ho_accountant', 'outlet_manager']}>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Cash Flow Report</h1>
                    <p className="text-gray-600 mt-2">Track cash and UPI movements</p>
                </div>

                {/* Month Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <p className="text-sm text-green-600 font-medium mb-2">💵 Cash Inflow</p>
                        <p className="text-2xl font-bold text-green-900">
                            ₹{totalCashIn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <p className="text-sm text-red-600 font-medium mb-2">💸 Cash Outflow</p>
                        <p className="text-2xl font-bold text-red-900">
                            ₹{totalCashOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <p className="text-sm text-blue-600 font-medium mb-2">📱 UPI Inflow</p>
                        <p className="text-2xl font-bold text-blue-900">
                            ₹{totalUPIIn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className={`border rounded-lg p-6 ${netCashFlow >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className={`text-sm font-medium mb-2 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {netCashFlow >= 0 ? '📈' : '📉'} Net Cash Flow
                        </p>
                        <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                            ₹{Math.abs(netCashFlow).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Cash Flow Table */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">Daily Cash Flow</h2>
                    </div>

                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                            <p className="mt-2 text-gray-600">Loading cash flow data...</p>
                        </div>
                    ) : cashFlowData && cashFlowData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cash In</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cash Out</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">UPI In</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">UPI Out</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {cashFlowData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(row.date).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                                                ₹{row.cash_in.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                                                ₹{row.cash_out.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">
                                                ₹{row.upi_in.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                                                ₹{row.upi_out.toLocaleString('en-IN')}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${(row.net_cash + row.net_upi) >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                ₹{(row.net_cash + row.net_upi).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="text-6xl mb-4">📊</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                            <p className="text-gray-600">
                                Cash flow data will appear here once daily records are locked for the selected month.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
