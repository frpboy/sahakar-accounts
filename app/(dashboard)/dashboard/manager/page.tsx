'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardCard } from '@/components/dashboard-card';
import { MonthlyReport } from '@/components/monthly-report';
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

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <DashboardCard
                        title="Today's Income"
                        value={`₹${(dailyRecord?.total_income || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                        colorClass="text-green-600"
                        subtitle="Cash + UPI"
                    />
                    <DashboardCard
                        title="Today's Expense"
                        value={`₹${(dailyRecord?.total_expense || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                        colorClass="text-red-600"
                        subtitle="Cash + UPI"
                    />
                    <DashboardCard
                        title="Cash Balance"
                        value={`₹${(dailyRecord?.closing_cash || dailyRecord?.opening_cash || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                        colorClass="text-blue-600"
                        subtitle="Current"
                    />
                    <DashboardCard
                        title="UPI Balance"
                        value={`₹${(dailyRecord?.closing_upi || dailyRecord?.opening_upi || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                        colorClass="text-purple-600"
                        subtitle="Current"
                    />
                </div>

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
