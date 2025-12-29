'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download, FileDown, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '@/lib/auth-context';
import { AuditorBanner } from '@/components/auditor-banner';

// Extend jsPDF type
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: Record<string, unknown>) => void;
    }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

type CategoryReportRow = {
    category: string;
    type: 'income' | 'expense';
    total: number;
    count: number;
};

export default function ReportsPage() {
    const { user } = useAuth();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Fetch report data
    const { data: reportData, isLoading } = useQuery<CategoryReportRow[]>({
        queryKey: ['category-report', startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const res = await fetch(`/api/reports/category?${params}`);
            if (!res.ok) throw new Error('Failed to fetch report');
            return (await res.json()) as CategoryReportRow[];
        },
    });

    // Transform data for charts
    const incomeData = reportData?.filter((r) => r.type === 'income') || [];
    const expenseData = reportData?.filter((r) => r.type === 'expense') || [];


    // Export to Excel with optional watermark
    const exportToExcel = () => {
        if (!reportData) return;

        const isAuditor = user?.profile?.role === 'auditor';

        const data: Array<{
            Category: string;
            Type: string;
            'Total Amount': string;
            Transactions: number | string;
        }> = reportData.map((r) => ({
            Category: r.category,
            Type: r.type,
            'Total Amount': `₹${r.total.toLocaleString('en-IN')}`,
            Transactions: r.count,
        }));

        if (isAuditor) {
            data.push({
                Category: '',
                Type: '',
                'Total Amount': '',
                Transactions: ''
            });
            data.push({
                Category: 'AUDIT EXPORT WATERMARK',
                Type: `Exported by: ${user?.profile?.name || user?.email}`,
                'Total Amount': `Date: ${new Date().toLocaleString('en-IN')}`,
                Transactions: 'DO NOT MODIFY'
            });
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Category Report');

        const filename = `${isAuditor ? 'Audit_' : ''}category-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    // Export to PDF with optional watermark
    const exportToPDF = () => {
        if (!reportData) return;

        const isAuditor = user?.profile?.role === 'auditor';
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Category-wise Financial Report', 14, 22);

        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
        if (startDate && endDate) {
            doc.text(`Period: ${startDate} to ${endDate}`, 14, 36);
        }

        if (isAuditor) {
            doc.setTextColor(200, 0, 0);
            doc.setFontSize(10);
            doc.text('READ-ONLY AUDIT EXPORT - FOR COMPLIANCE ONLY', 14, 42);
            doc.setTextColor(0, 0, 0);
        }

        const tableData = reportData.map((r) => [
            r.category,
            r.type,
            `₹${r.total.toLocaleString('en-IN')}`,
            r.count,
        ]);

        doc.autoTable({
            startY: isAuditor ? 48 : 45,
            head: [['Category', 'Type', 'Total Amount', 'Transactions']],
            body: tableData,
        });

        if (isAuditor) {
            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Audit Watermark: Exported by ${user?.profile?.name || user?.email} on ${new Date().toLocaleString('en-IN')}`, 14, pageHeight - 10);
        }

        const filename = `${isAuditor ? 'Audit_' : ''}category-report-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {user?.profile?.role === 'auditor' && (
                <AuditorBanner
                    accessEndDate={user?.profile?.access_end_date || null}
                    userName={user?.profile?.name || user?.email || 'Auditor'}
                />
            )}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
                <p className="text-gray-600 mt-2">Category-wise breakdown and analysis.</p>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-700">Filter by Date:</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={exportToExcel}
                    disabled={!reportData || reportData.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    <Download className="w-4 h-4" />
                    Export to Excel
                </button>
                <button
                    onClick={exportToPDF}
                    disabled={!reportData || reportData.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    <FileDown className="w-4 h-4" />
                    Export to PDF
                </button>
            </div>

            {isLoading ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading report data...</p>
                </div>
            ) : !reportData || reportData.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                    <p className="text-yellow-800">No data available for the selected period.</p>
                </div>
            ) : (
                <>
                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Income Pie Chart */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Income Breakdown</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={incomeData}
                                        dataKey="total"
                                        nameKey="category"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {incomeData.map((_, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Expense Pie Chart */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Expense Breakdown</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={expenseData}
                                        dataKey="total"
                                        nameKey="category"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {expenseData.map((_, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bar Chart Comparison */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Category Comparison</h2>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={reportData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="total" fill="#8884d8" name="Amount" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Transactions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reportData.map((row, index: number) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {row.category}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.type === 'income'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {row.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ₹{row.total.toLocaleString('en-IN', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {row.count}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
