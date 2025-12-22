'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardCard } from '@/components/dashboard-card';
import { useQuery } from '@tanstack/react-query';

export default function AdminDashboard() {
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
        <ProtectedRoute allowedRoles={['superadmin']}>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Welcome, {user?.profile?.name}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <DashboardCard
                        title="Total Stores"
                        value={isLoading ? '...' : stats?.totalStores || 0}
                        colorClass="text-blue-600"
                    />

                    <DashboardCard
                        title="Active Users"
                        value={isLoading ? '...' : stats?.activeUsers || 0}
                        colorClass="text-green-600"
                    />

                    <DashboardCard
                        title="Pending Submissions"
                        value={isLoading ? '...' : stats?.pendingSubmissions || 0}
                        colorClass="text-orange-600"
                    />

                    <DashboardCard
                        title="Locked Days (7d)"
                        value={isLoading ? '...' : stats?.lockedDays || 0}
                        colorClass="text-purple-600"
                    />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 font-semibold mb-2">✅ Phase 1 Complete - Authentication working!</p>
                    <p className="text-blue-700 text-sm">
                        📊 Phase 2 in progress - Dashboard metrics: {stats?.totalStores || 0} stores, {stats?.activeUsers || 0} users
                        <br />
                        🚀 Phase 3 will add transaction management
                    </p>
                </div>
            </div>
        </ProtectedRoute>
    );
}
