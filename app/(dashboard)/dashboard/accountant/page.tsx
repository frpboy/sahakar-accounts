'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { MonthlyReport } from '@/components/monthly-report';
import { BalanceSummary } from '@/components/balance-summary';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Lock, Calendar, Building2, Clock, AlertCircle, X } from 'lucide-react';

interface DailyRecord {
    id: string;
    date: string;
    outlet_id: string;
    outlet?: { name: string; code: string };
    opening_cash: number;
    opening_upi: number;
    total_income: number;
    total_expense: number;
    status: string;
    submitted_at?: string;
}

interface OutletOption {
    id: string;
    name: string;
    code: string;
}

export default function AccountantDashboard() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState({
        outletId: 'all',
        startDate: '',
        endDate: ''
    });
    const [selectedRecord, setSelectedRecord] = useState<DailyRecord | null>(null);
    const [lockReason, setLockReason] = useState('');

    // Fetch all outlets
    const { data: outlets } = useQuery<OutletOption[]>({
        queryKey: ['outlets'],
        queryFn: async () => {
            const res = await fetch('/api/outlets');
            if (!res.ok) return [];
            return res.json();
        }
    });

    // Fetch submitted records
    const { data: submittedRecords, isLoading } = useQuery<DailyRecord[]>({
        queryKey: ['submitted-records', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('status', 'submitted');
            if (filters.outletId !== 'all') params.append('outlet_id', filters.outletId);
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate) params.append('end_date', filters.endDate);

            const res = await fetch(`/api/daily-records?${params}`);
            if (!res.ok) return [];
            return res.json();
        }
    });

    // Lock record mutation
    const lockMutation = useMutation({
        mutationFn: async ({ recordId, reason }: { recordId: string; reason: string }) => {
            const res = await fetch(`/api/daily-records/${recordId}/lock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reason || 'Reviewed and approved by HO Accountant' })
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to lock record');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['submitted-records'] });
            setSelectedRecord(null);
            setLockReason('');
        }
    });

    return (
        <ProtectedRoute allowedRoles={['ho_accountant', 'superadmin']}>
            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">HO Accountant Dashboard</h1>
                    <p className="text-gray-600 mt-2">Welcome, {user?.profile?.name}</p>
                </div>

                {/* Submitted Records Review Queue */}
                <div className="mb-8">
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-yellow-600" />
                                        Pending Review Queue
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {submittedRecords?.length || 0} record(s) waiting for approval
                                    </p>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-4 pt-4">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Building2 className="w-4 h-4 inline mr-1" />
                                        Outlet
                                    </label>
                                    <select
                                        value={filters.outletId}
                                        onChange={(e) => setFilters({ ...filters, outletId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
                                        From
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                                <div className="flex-1 min-w-[150px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        To
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Records Table */}
                        <div className="overflow-x-auto">
                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                                    <p className="mt-2 text-gray-600">Loading records...</p>
                                </div>
                            ) : submittedRecords && submittedRecords.length > 0 ? (
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outlet</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expense</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Submitted</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {submittedRecords.map((record) => (
                                            <tr key={record.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(record.date).toLocaleDateString('en-IN')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{record.outlet?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-gray-500">{record.outlet?.code || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                                                    ₹{record.total_income?.toLocaleString('en-IN') || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                                                    ₹{record.total_expense?.toLocaleString('en-IN') || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 text-center">
                                                    {record.submitted_at ? new Date(record.submitted_at).toLocaleString('en-IN') : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => setSelectedRecord(record)}
                                                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1 mx-auto"
                                                    >
                                                        <Lock className="w-4 h-4" />
                                                        Lock
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center">
                                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
                                    <p className="text-gray-600">
                                        No pending records to review. All submitted records have been processed.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Balance Summary */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">All Outlets Balance</h2>
                    <BalanceSummary />
                </div>

                {/* Monthly Report */}
                <div className="mb-8">
                    <MonthlyReport showActions={true} />
                </div>

                {/* Reports Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">📄 Financial Reports</h2>
                        <div className="space-y-3">
                            <a href="/dashboard/monthly" className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block">
                                <h3 className="font-medium text-gray-900">Monthly P&L Statement</h3>
                                <p className="text-sm text-gray-600">Profit and Loss breakdown</p>
                            </a>
                            <a href="/dashboard/cash-flow" className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block">
                                <h3 className="font-medium text-gray-900">Cash Flow Report</h3>
                                <p className="text-sm text-gray-600">Cash movement analysis</p>
                            </a>
                            <a href="/dashboard/reports" className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block">
                                <h3 className="font-medium text-gray-900">Category Summary</h3>
                                <p className="text-sm text-gray-600">Income/Expense by category</p>
                            </a>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Google Sheets</h2>
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                            Google Sheets integration has been stopped. Exports and reports are available within the app.
                        </div>
                    </div>
                </div>

                {/* Lock Confirmation Modal */}
                {selectedRecord && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Lock Daily Record</h3>
                                <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-600">Date: <span className="font-medium text-gray-900">{new Date(selectedRecord.date).toLocaleDateString('en-IN')}</span></p>
                                <p className="text-sm text-gray-600">Outlet: <span className="font-medium text-gray-900">{selectedRecord.outlet?.name}</span></p>
                                <p className="text-sm text-gray-600">Income: <span className="font-medium text-green-600">₹{selectedRecord.total_income?.toLocaleString('en-IN')}</span></p>
                                <p className="text-sm text-gray-600">Expense: <span className="font-medium text-red-600">₹{selectedRecord.total_expense?.toLocaleString('en-IN')}</span></p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason (Optional)
                                </label>
                                <textarea
                                    value={lockReason}
                                    onChange={(e) => setLockReason(e.target.value)}
                                    placeholder="e.g., All transactions verified, balances correct"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    rows={3}
                                />
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                <div className="flex gap-2">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                    <p className="text-sm text-yellow-800">
                                        Once locked, this record cannot be modified without superadmin intervention.
                                    </p>
                                </div>
                            </div>

                            {lockMutation.isError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                    <p className="text-sm text-red-800">
                                        {lockMutation.error.message}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedRecord(null)}
                                    disabled={lockMutation.isPending}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => lockMutation.mutate({ recordId: selectedRecord.id, reason: lockReason })}
                                    disabled={lockMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                                >
                                    {lockMutation.isPending ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            Locking...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            Lock Record
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
