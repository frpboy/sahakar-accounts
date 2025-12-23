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
                    {dailyRecord && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-sm font-medium text-blue-800">
                                Outlet ID: {dailyRecord.outlet_id || 'Not Assigned'}
                            </span>
                        </div>
                    )}
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
