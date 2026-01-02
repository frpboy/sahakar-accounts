'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { useQuery } from '@tanstack/react-query';
import { Download, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DailySummaryPage() {
    const supabase = createClientBrowser();
    const { user } = useAuth();
    const isAdmin = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Fetch daily records for selected date
    const { data: dailyRecords, isLoading } = useQuery({
        queryKey: ['daily-summary', selectedDate, user?.profile?.outlet_id],
        queryFn: async () => {
            let query = (supabase as any)
                .from('daily_records')
                .select('*, outlets(name)')
                .eq('date', selectedDate);

            if (!isAdmin && user?.profile?.outlet_id) {
                query = query.eq('outlet_id', user.profile.outlet_id);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: !!user
    });

    // Summary stats
    const totalOpeningBalance = dailyRecords?.reduce((sum, r) => sum + (r.opening_balance || 0), 0) || 0;
    const totalExpectedClosing = dailyRecords?.reduce((sum, r) => sum + (r.expected_closing_balance || 0), 0) || 0;
    const totalPhysicalCash = dailyRecords?.reduce((sum, r) => sum + (r.physical_cash || 0), 0) || 0;
    const totalVariance = totalPhysicalCash - totalExpectedClosing;
    const recordsWithVariance = dailyRecords?.filter(r =>
        Math.abs((r.physical_cash || 0) - (r.expected_closing_balance || 0)) > 10
    ).length || 0;

    const handleExport = (format: 'excel' | 'pdf') => {
        const data = dailyRecords?.map(r => ({
            Date: r.date,
            Outlet: r.outlets?.name || 'Unknown',
            OpeningBalance: r.opening_balance || 0,
            ExpectedClosing: r.expected_closing_balance || 0,
            PhysicalCash: r.physical_cash || 0,
            PhysicalUPI: r.physical_upi || 0,
            Variance: (r.physical_cash || 0) - (r.expected_closing_balance || 0),
            Status: r.status,
            Comments: r.comments || '-'
        })) || [];

        if (format === 'excel') {
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Daily Summary');
            XLSX.writeFile(wb, `Daily_Summary_${selectedDate}.xlsx`);
        } else {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text('Daily Summary Report', 14, 20);
            doc.setFontSize(10);
            doc.text(`Date: ${selectedDate}`, 14, 28);

            autoTable(doc, {
                startY: 35,
                head: [['Outlet', 'Opening', 'Expected', 'Physical', 'Variance', 'Status']],
                body: data.map(r => [
                    r.Outlet,
                    `₹${r.OpeningBalance.toLocaleString('en-IN')}`,
                    `₹${r.ExpectedClosing.toLocaleString('en-IN')}`,
                    `₹${r.PhysicalCash.toLocaleString('en-IN')}`,
                    `₹${r.Variance.toLocaleString('en-IN')}`,
                    r.Status
                ]),
            });

            doc.save(`Daily_Summary_${selectedDate}.pdf`);
        }
    };

    const getStatusIcon = (record: any) => {
        const variance = Math.abs((record.physical_cash || 0) - (record.expected_closing_balance || 0));
        if (variance <= 10) {
            return <CheckCircle className="w-5 h-5 text-green-500" />;
        } else if (variance <= 100) {
            return <AlertCircle className="w-5 h-5 text-orange-500" />;
        }
        return <XCircle className="w-5 h-5 text-red-500" />;
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <TopBar title="Daily Summary Report" />

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Opening</div>
                            <div className="text-2xl font-bold mt-2">₹{totalOpeningBalance.toLocaleString('en-IN')}</div>
                            <div className="text-sm text-gray-500 mt-1">{dailyRecords?.length || 0} outlets</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Expected Closing</div>
                            <div className="text-2xl font-bold mt-2">₹{totalExpectedClosing.toLocaleString('en-IN')}</div>
                            <div className="text-sm text-blue-500 mt-1">Digital calculation</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Physical Cash</div>
                            <div className="text-2xl font-bold mt-2">₹{totalPhysicalCash.toLocaleString('en-IN')}</div>
                            <div className="text-sm text-green-500 mt-1">Tallied amount</div>
                        </div>
                        <div className={`bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border ${Math.abs(totalVariance) > 100 ? 'border-red-200 dark:border-red-900/50' :
                                Math.abs(totalVariance) > 10 ? 'border-orange-200 dark:border-orange-900/50' :
                                    'border-green-200 dark:border-green-900/50'
                            }`}>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Variance</div>
                            <div className={`text-2xl font-bold mt-2 ${Math.abs(totalVariance) > 100 ? 'text-red-600' :
                                    Math.abs(totalVariance) > 10 ? 'text-orange-600' :
                                        'text-green-600'
                                }`}>
                                {totalVariance >= 0 ? '+' : ''}₹{totalVariance.toLocaleString('en-IN')}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                {recordsWithVariance} with variance
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Select Date
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
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

                    {/* Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800 border-b dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                        {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Outlet</th>}
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Opening</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expected Closing</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Physical Cash</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Physical UPI</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Variance</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Comments</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={isAdmin ? 8 : 7} className="px-6 py-8 text-center text-gray-400">
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : dailyRecords?.length === 0 ? (
                                        <tr>
                                            <td colSpan={isAdmin ? 8 : 7} className="px-6 py-8 text-center text-gray-400">
                                                No daily records found for {selectedDate}
                                            </td>
                                        </tr>
                                    ) : (
                                        dailyRecords?.map(record => {
                                            const variance = (record.physical_cash || 0) - (record.expected_closing_balance || 0);
                                            return (
                                                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getStatusIcon(record)}
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                                                            {record.outlets?.name || 'Unknown'}
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        ₹{(record.opening_balance || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                                                        ₹{(record.expected_closing_balance || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-green-600">
                                                        ₹{(record.physical_cash || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-blue-600">
                                                        ₹{(record.physical_upi || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${Math.abs(variance) <= 10 ? 'text-green-600' :
                                                            Math.abs(variance) <= 100 ? 'text-orange-600' :
                                                                'text-red-600'
                                                        }`}>
                                                        {variance >= 0 ? '+' : ''}₹{variance.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                        {record.comments || '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4">
                        <h4 className="text-sm font-semibold mb-2">Variance Status Legend</h4>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Perfect Match (≤₹10)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                <span>Minor Variance (₹10-₹100)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span>Major Variance (\u003e₹100)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
