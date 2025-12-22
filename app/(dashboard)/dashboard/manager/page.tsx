'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardCard } from '@/components/dashboard-card';
import { TransactionForm } from '@/components/transaction-form';
import { TransactionList } from '@/components/transaction-list';
import { useQuery } from '@tanstack/react-query';

export default function ManagerDashboard() {
    const { user } = useAuth();

    // Get today's daily record
    const { data: dailyRecord, isLoading: recordLoading } = useQuery({
        queryKey: ['daily-record-today'],
        queryFn: async () => {
            const res = await fetch('/api/daily-records/today');
            if (!res.ok) throw new Error('Failed to fetch daily record');
            return res.json();
        },
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        },
    });

    const todayIncome = dailyRecord?.total_income ?? 0;
    const todayExpense = dailyRecord?.total_expense ?? 0;

    return (
        <ProtectedRoute allowedRoles={['outlet_manager']}>
            <div className="p-6 max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Store Manager Dashboard</h1>
                    <p className="text-gray-600 mt-2">Welcome, {user?.profile?.name}</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <DashboardCard
                        title="Today's Status"
                        value={recordLoading ? '...' : (dailyRecord?.status || 'No Data').toUpperCase()}
                        colorClass={
                            dailyRecord?.status === 'draft' ? 'text-blue-600' :
                                dailyRecord?.status === 'submitted' ? 'text-orange-600' :
                                    'text-green-600'
                        }
                        subtitle={dailyRecord?.status === 'draft' ? 'Not submitted yet' : ''}
                    />

                    <DashboardCard
                        title="Today's Income"
                        value={recordLoading ? '...' : `₹${todayIncome.toLocaleString('en-IN')}`}
                        colorClass="text-green-600"
                    />

                    <DashboardCard
                        title="Today's Expense"
                        value={recordLoading ? '...' : `₹${todayExpense.toLocaleString('en-IN')}`}
                        colorClass="text-red-600"
                    />

                    <DashboardCard
                        title="Net Today"
                        value={recordLoading ? '...' : `₹${(todayIncome - todayExpense).toLocaleString('en-IN')}`}
                        colorClass={(todayIncome - todayExpense) >= 0 ? 'text-green-600' : 'text-red-600'}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Transaction Form */}
                    <div>
                        {dailyRecord && dailyRecord.status === 'draft' ? (
                            <TransactionForm dailyRecordId={dailyRecord.id} />
                        ) : dailyRecord && dailyRecord.status !== 'draft' ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                                <p className="text-yellow-800 font-semibold mb-2">
                                    ⚠️ Day {dailyRecord.status.toUpperCase()}
                                </p>
                                <p className="text-yellow-700 text-sm">
                                    No new transactions can be added after submission.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white p-6 rounded-lg shadow text-center">
                                <p className="text-gray-500">Loading...</p>
                            </div>
                        )}

                        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-green-800 font-semibold mb-2">
                                📝 Manager Responsibilities
                            </p>
                            <ul className="text-green-700 text-sm space-y-1 list-disc list-inside">
                                <li>Review all transactions before 1:30 AM</li>
                                <li>Verify closing balances match physical count</li>
                                <li>Submit day by 1:59 AM deadline</li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column - Transaction List */}
                    <div>
                        {dailyRecord && (
                            <TransactionList dailyRecordId={dailyRecord.id} />
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
