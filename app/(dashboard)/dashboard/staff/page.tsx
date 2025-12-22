'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardCard } from '@/components/dashboard-card';
import { TransactionForm } from '@/components/transaction-form';
import { TransactionList } from '@/components/transaction-list';
import { useQuery } from '@tanstack/react-query';

export default function StaffDashboard() {
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

    const cashBalance = dailyRecord?.closing_cash ?? dailyRecord?.opening_cash ?? 0;
    const upiBalance = dailyRecord?.closing_upi ?? dailyRecord?.opening_upi ?? 0;

    return (
        <ProtectedRoute allowedRoles={['outlet_staff']}>
            <div className="p-6 max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Store User Dashboard</h1>
                    <p className="text-gray-600 mt-2">Welcome, {user?.profile?.name}</p>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <DashboardCard
                        title="Cash Balance"
                        value={recordLoading ? '...' : `₹${cashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                        colorClass="text-green-600"
                        subtitle="Current day total"
                    />

                    <DashboardCard
                        title="UPI Balance"
                        value={recordLoading ? '...' : `₹${upiBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                        colorClass="text-blue-600"
                        subtitle="Current day total"
                    />
                </div>

                {/* Transaction Form */}
                {dailyRecord && dailyRecord.status === 'draft' && (
                    <div className="mb-8">
                        <TransactionForm dailyRecordId={dailyRecord.id} />
                    </div>
                )}

                {recordLoading && (
                    <div className="bg-white p-6 rounded-lg shadow text-center">
                        <p className="text-gray-500">Loading today's record...</p>
                    </div>
                )}

                {dailyRecord && dailyRecord.status !== 'draft' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                        <p className="text-yellow-800">
                            ⚠️ Today's entries have been {dailyRecord.status}. No new transactions can be added.
                        </p>
                    </div>
                )}

                {/* Transaction List */}
                {dailyRecord && (
                    <div className="mb-8">
                        <TransactionList dailyRecordId={dailyRecord.id} />
                    </div>
                )}

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-purple-800 font-semibold mb-2">
                        💡 Quick Tips
                    </p>
                    <ul className="text-purple-700 text-sm space-y-1 list-disc list-inside">
                        <li>Add transactions as they happen for accurate records</li>
                        <li>Select the correct category and payment mode</li>
                        <li>Manager will review and submit at end of day</li>
                    </ul>
                </div>
            </div>
        </ProtectedRoute>
    );
}
