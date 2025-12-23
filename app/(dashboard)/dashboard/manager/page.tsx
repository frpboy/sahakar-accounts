'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { DailyRecordActions } from '@/components/daily-record-actions';
import { MonthlyReport } from '@/components/monthly-report';
import { BalanceSummary } from '@/components/balance-summary';
import { useQuery } from '@tanstack/react-query';

export default function ManagerDashboard() {
    const { user } = useAuth();

    // Get today's daily record
    const { data: dailyRecord } = useQuery({
        queryKey: ['daily-record-today'],
        queryFn: async () => {
            const res = await fetch('/api/daily-records/today');
            if (!res.ok) throw new Error('Failed to fetch daily record');
            return res.json();
        },
    });

    return (
        <ProtectedRoute allowedRoles={['outlet_manager']}>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
                    <p className="text-gray-600 mt-2">Welcome, {user?.profile?.name}</p>
                </div>

                {/* Balance Summary */}
                <div className="mb-8">
                    <BalanceSummary />
                </div>

                {/* Daily Record Actions */}
                {dailyRecord && (
                    <div className="mb-8">
                        <DailyRecordActions
                            recordId={dailyRecord.id}
                            status={dailyRecord.status}
                        />
                    </div>
                )}

                {/* Monthly Report */}
                <div className="mb-8">
                    <MonthlyReport />
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a
                            href="/dashboard/staff"
                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                        >
                            <div className="text-3xl mb-2">📝</div>
                            <h3 className="font-medium text-gray-900">Enter Transactions</h3>
                            <p className="text-sm text-gray-600 mt-1">Add today's entries</p>
                        </a>
                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                            <div className="text-3xl mb-2">📊</div>
                            <h3 className="font-medium text-gray-900">View Reports</h3>
                            <p className="text-sm text-gray-600 mt-1">Analyze performance</p>
                        </button>
                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
                            <div className="text-3xl mb-2">📤</div>
                            <h3 className="font-medium text-gray-900">Export Data</h3>
                            <p className="text-sm text-gray-600 mt-1">Download reports</p>
                        </button>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
