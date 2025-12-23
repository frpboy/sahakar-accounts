'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardCard } from '@/components/dashboard-card';
import { MonthlyReport } from '@/components/monthly-report';
import { BalanceSummary } from '@/components/balance-summary';

export default function AdminDashboard() {
    const { user } = useAuth();

    return (
        <ProtectedRoute allowedRoles={['superadmin']}>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Welcome, {user?.profile?.name}</p>
                </div>

                {/* System Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <DashboardCard
                        title="Total Outlets"
                        value="5"
                        colorClass="text-blue-600"
                        subtitle="Active"
                    />
                    <DashboardCard
                        title="Total Users"
                        value="12"
                        colorClass="text-green-600"
                        subtitle="Active"
                    />
                    <DashboardCard
                        title="Monthly Revenue"
                        value="₹2,45,000"
                        colorClass="text-purple-600"
                        subtitle="All outlets"
                    />
                    <DashboardCard
                        title="System Health"
                        value="98%"
                        colorClass="text-green-600"
                        subtitle="Uptime"
                    />
                </div>

                {/* Management Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* User Management */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">👥 User Management</h2>
                        <div className="space-y-3">
                            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <h3 className="font-medium text-gray-900">Create New User</h3>
                                <p className="text-sm text-gray-600">Add staff, manager, or accountant</p>
                            </button>
                            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <h3 className="font-medium text-gray-900">Manage Permissions</h3>
                                <p className="text-sm text-gray-600">Edit user roles and access</p>
                            </button>
                            <a href="/dashboard/users" className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block">
                                <h3 className="font-medium text-gray-900">View All Users</h3>
                                <p className="text-sm text-gray-600">12 active users</p>
                            </a>
                        </div>
                    </div>

                    {/* Outlet Management */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">🏪 Outlet Management</h2>
                        <div className="space-y-3">
                            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <h3 className="font-medium text-gray-900">Add New Outlet</h3>
                                <p className="text-sm text-gray-600">Create outlet location</p>
                            </button>
                            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <h3 className="font-medium text-gray-900">Configure Settings</h3>
                                <p className="text-sm text-gray-600">Update outlet details</p>
                            </button>
                            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <h3 className="font-medium text-gray-900">View All Outlets</h3>
                                <p className="text-sm text-gray-600">5 active outlets</p>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Balance Summary */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Outlet Balance Overview</h2>
                    <BalanceSummary />
                </div>

                {/* Monthly Report */}
                <div>
                    <MonthlyReport />
                </div>
            </div>
        </ProtectedRoute>
    );
}
