'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardCard } from '@/components/dashboard-card';
import { TransactionForm } from '@/components/transaction-form';
import { TransactionList } from '@/components/transaction-list';
import { LiveBalance } from '@/components/live-balance';
import { DailyRecordActions } from '@/components/daily-record-actions';
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
        <ProtectedRoute allowedRoles={['outlet_staff', 'outlet_manager']}>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
                    <p className="text-gray-600 mt-2">Welcome, {user?.profile?.name}</p>
                </div>

                {/* Daily Record Status */}
                {dailyRecord && (
                    <div className="mb-6">
                        <DailyRecordActions
                            recordId={dailyRecord.id}
                            status={dailyRecord.status}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Live Balance - Takes 1 column */}
                    <div>
                        {recordLoading ? (
                            <div className="bg-gray-100 rounded-lg h-64 animate-pulse"></div>
                        ) : (
                            <LiveBalance cashBalance={cashBalance} upiBalance={upiBalance} />
                        )}
                    </div>

                    {/* Transaction Form - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        {dailyRecord ? (
                            <TransactionForm dailyRecordId={dailyRecord.id} />
                        ) : (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <p className="text-gray-600">Loading daily record...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Transaction List */}
                {dailyRecord && (
                    <div className="mt-8">
                        <TransactionList dailyRecordId={dailyRecord.id} />
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
