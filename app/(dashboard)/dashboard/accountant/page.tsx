'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardCard } from '@/components/dashboard-card';
import { useQuery } from '@tanstack/react-query';

export default function AccountantDashboard() {
    const { user } = useAuth();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        },
    });

    return (
        <ProtectedRoute allowedRoles={['ho_accountant']}>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">HO Accountant Dashboard</h1>
                    <p className="text-gray-600 mt-2">Welcome, {user?.profile?.name}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <DashboardCard
                        title="Pending Verifications"
                        value={isLoading ? '...' : stats?.pendingVerifications || 0}
                        colorClass="text-orange-600"
                    />

                    <DashboardCard
                        title="Locked Today"
                        value={isLoading ? '...' : stats?.lockedToday || 0}
                        colorClass="text-green-600"
                    />

                    <DashboardCard
                        title="Flagged Entries"
                        value={isLoading ? '...' : stats?.flaggedEntries || 0}
                        colorClass="text-red-600"
                    />

                    <DashboardCard
                        title="Late Submissions"
                        value={isLoading ? '...' : stats?.lateSubmissions || 0}
                        colorClass="text-yellow-600"
                    />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 font-semibold mb-2">
                        ⏰ Locking window: 2:00 AM - 6:59 AM IST
                    </p>
                    <p className="text-yellow-700 text-sm">
                        📊 Phase 5 will add the pending queue and lock/unlock functionality
                    </p>
                </div>
            </div>
        </ProtectedRoute>
    );
}
