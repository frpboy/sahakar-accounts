'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { AuditorBanner } from '@/components/auditor-banner';
import { useQuery } from '@tanstack/react-query';
import {
    Shield,
    Calendar,
    FileSpreadsheet,
    FileText,
    Building2,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DailyRecord {
    id: string;
    date: string;
    outlet_id: string;
    outlet?: { name: string; code: string };
    opening_cash: number;
    opening_upi: number;
    closing_cash: number;
    closing_upi: number;
    total_income: number;
    total_expense: number;
    status: string;
    submitted_by?: string;
    locked_by?: string;
    locked_at?: string;
}

interface OutletOption {
    id: string;
    name: string;
    code: string;
}

type ExportRow = {
    Date: string;
    Outlet: string;
    Code: string;
    'Opening Cash': number | string;
    'Opening UPI': number | string;
    'Total Income': number | string;
    'Total Expense': number | string;
    'Closing Cash': number | string;
    'Closing UPI': number | string;
    'Locked At': string;
};

export default function AuditorDashboard() {
    const { user } = useAuth();
    const [filters, setFilters] = useState({
        outletId: 'all',
        startDate: '',
        endDate: '',
        month: new Date().toISOString().slice(0, 7)
    });

    // Log access action
    const logAuditorAccess = useCallback(async (action: string, entity_id?: string) => {
        try {
            await fetch('/api/auditor/log-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    entity_type: 'daily_record',
                    entity_id,
                    outlet_id: filters.outletId !== 'all' ? filters.outletId : null
                })
            });
        } catch (error: unknown) {
            console.error('Failed to log access:', error);
        }
    }, [filters.outletId]);

    // Log dashboard access
    useEffect(() => {
        logAuditorAccess('view_dashboard');
    }, [logAuditorAccess]);

    // Fetch all outlets for filter
    const { data: outlets } = useQuery<OutletOption[]>({
        queryKey: ['outlets'],
        queryFn: async () => {
            const res = await fetch('/api/outlets');
            if (!res.ok) throw new Error('Failed to fetch outlets');
            return res.json();
        }
    });

    // Fetch locked records
    const { data: records, isLoading } = useQuery<DailyRecord[]>({
        queryKey: ['auditor-locked-records', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('status', 'locked');
            if (filters.outletId !== 'all') params.append('outlet_id', filters.outletId);
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate) params.append('end_date', filters.endDate);

            const res = await fetch(`/api/daily-records?${params}`);
            if (!res.ok) throw new Error('Failed to fetch records');
            return res.json();
        }
    });

    // Export to Excel with watermark
    const exportToExcel = () => {
        if (!records || records.length === 0) {
            alert('No data to export');
            return;
        }

        logAuditorAccess('export_excel');

        const exportData: ExportRow[] = records.map((record) => ({
            'Date': new Date(record.date).toLocaleDateString('en-IN'),
            'Outlet': record.outlet?.name || 'Unknown',
            'Code': record.outlet?.code || 'N/A',
            'Opening Cash': record.opening_cash,
            'Opening UPI': record.opening_upi,
            'Total Income': record.total_income,
            'Total Expense': record.total_expense,
            'Closing Cash': record.closing_cash,
            'Closing UPI': record.closing_upi,
            'Locked At': record.locked_at ? new Date(record.locked_at).toLocaleString('en-IN') : 'N/A'
        }));

        // Add watermark rows
        exportData.push({
            'Date': '',
            'Outlet': '',
            'Code': '',
            'Opening Cash': '',
            'Opening UPI': '',
            'Total Income': '',
            'Total Expense': '',
            'Closing Cash': '',
            'Closing UPI': '',
            'Locked At': ''
        });
        exportData.push({
            'Date': 'AUDIT EXPORT WATERMARK',
            'Outlet': `Exported by: ${user?.profile?.name || user?.email}`,
            'Code': `Date: ${new Date().toLocaleString('en-IN')}`,
            'Opening Cash': 'READ-ONLY AUDIT ACCESS',
            'Opening UPI': 'DO NOT MODIFY',
            'Total Income': '',
            'Total Expense': '',
            'Closing Cash': '',
            'Closing UPI': '',
            'Locked At': ''
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Locked Records');

        XLSX.writeFile(wb, `Audit_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Calculate totals
    const totals = records?.reduce((acc, record) => ({
        totalIncome: acc.totalIncome + (record.total_income || 0),
        totalExpense: acc.totalExpense + (record.total_expense || 0),
        recordCount: acc.recordCount + 1
    }), { totalIncome: 0, totalExpense: 0, recordCount: 0 }) || { totalIncome: 0, totalExpense: 0, recordCount: 0 };

    return (
        <ProtectedRoute allowedRoles={['auditor']}>
            <div className="max-w-7xl mx-auto p-6">
                {/* Auditor Banner */}
                <AuditorBanner
                    accessEndDate={user?.profile?.access_end_date || null}
                    userName={user?.profile?.name || user?.email || 'Auditor'}
                />

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Shield className="w-8 h-8 text-red-600" />
                        Audit Dashboard
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Review locked daily records across all outlets
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="text-sm text-gray-600">Total Locked Records</p>
                                <p className="text-2xl font-bold text-gray-900">{totals.recordCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-sm text-gray-600">Total Income</p>
                                <p className="text-2xl font-bold text-green-900">
                                    ₹{totals.totalIncome.toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-3">
                            <TrendingDown className="w-8 h-8 text-red-600" />
                            <div>
                                <p className="text-sm text-gray-600">Total Expense</p>
                                <p className="text-2xl font-bold text-red-900">
                                    ₹{totals.totalExpense.toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Export */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Outlet
                            </label>
                            <select
                                value={filters.outletId}
                                onChange={(e) => setFilters({ ...filters, outletId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                            >
                                <option value="all">All Outlets</option>
                                {outlets?.map((outlet) => (
                                    <option key={outlet.id} value={outlet.id}>
                                        {outlet.name} ({outlet.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                End Date
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                            />
                        </div>
                        <div className="flex-shrink-0 self-end">
                            <button
                                onClick={exportToExcel}
                                disabled={!records || records.length === 0}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <FileSpreadsheet className="w-5 h-5" />
                                Export Excel
                            </button>
                        </div>
                    </div>
                </div>

                {/* Records Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
                            <p className="mt-2 text-gray-600">Loading locked records...</p>
                        </div>
                    ) : records && records.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outlet</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Opening Cash</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Opening UPI</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expense</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Closing Cash</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Closing UPI</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Locked At</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {records.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(record.date).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{record.outlet?.name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500">{record.outlet?.code || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                                ₹{record.opening_cash.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                                ₹{record.opening_upi.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                                                ₹{record.total_income.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                                                ₹{record.total_expense.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                                ₹{record.closing_cash.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                                ₹{record.closing_upi.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                {record.locked_at ? new Date(record.locked_at).toLocaleString('en-IN') : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Locked Records Found</h3>
                            <p className="text-gray-600">
                                There are no locked records matching your filters.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
