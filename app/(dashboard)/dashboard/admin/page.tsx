'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardCard } from '@/components/dashboard-card';
import { MonthlyReport } from '@/components/monthly-report';
import { BalanceSummary } from '@/components/balance-summary';
import { CreateUserModal } from '@/components/create-user-modal';
import { CreateOutletModal } from '@/components/create-outlet-modal';
import { ManagePermissionsModal } from '@/components/manage-permissions-modal';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, Building2, Settings } from 'lucide-react';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [showCreateOutlet, setShowCreateOutlet] = useState(false);
    const [showManagePermissions, setShowManagePermissions] = useState(false);

    // Fetch users count
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await fetch('/api/users');
            if (!res.ok) return [];
            return res.json();
        },
    });

    // Fetch outlets count
    const { data: outlets } = useQuery({
        queryKey: ['outlets'],
        queryFn: async () => {
            const res = await fetch('/api/outlets');
            if (!res.ok) return [];
            return res.json();
        },
    });

    const handleUserCreated = () => {
        // Refetch users list
        window.location.reload();
    };

    const handleOutletCreated = () => {
        // Refetch outlets list
        window.location.reload();
    };

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
                        value={outlets?.length?.toString() || '0'}
                        colorClass="text-blue-600"
                        subtitle="Active"
                    />
                    <DashboardCard
                        title="Total Users"
                        value={users?.length?.toString() || '0'}
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
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5" /> User Management
                        </h2>
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowCreateUser(true)}
                                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            >
                                <h3 className="font-medium text-gray-900">Create New User</h3>
                                <p className="text-sm text-gray-600">Add staff, manager, or accountant</p>
                            </button>
                            <button
                                onClick={() => setShowManagePermissions(true)}
                                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                            >
                                <h3 className="font-medium text-gray-900">Manage Permissions</h3>
                                <p className="text-sm text-gray-600">Edit user roles and access</p>
                            </button>
                            <a
                                href="/dashboard/users"
                                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
                            >
                                <h3 className="font-medium text-gray-900">View All Users</h3>
                                <p className="text-sm text-gray-600">{users?.length || 0} active users</p>
                            </a>
                        </div>
                    </div>

                    {/* Outlet Management */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5" /> Outlet Management
                        </h2>
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowCreateOutlet(true)}
                                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                            >
                                <h3 className="font-medium text-gray-900">Add New Outlet</h3>
                                <p className="text-sm text-gray-600">Create outlet location</p>
                            </button>
                            <a
                                href="/dashboard/outlets"
                                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
                            >
                                <h3 className="font-medium text-gray-900">View All Outlets</h3>
                                <p className="text-sm text-gray-600">{outlets?.length || 0} active outlets</p>
                            </a>
                            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                    <Settings className="w-4 h-4" /> Configure Settings
                                </h3>
                                <p className="text-sm text-gray-600">Update outlet details</p>
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
                    <MonthlyReport showActions={true} />
                </div>
            </div>

            {/* Modals */}
            <CreateUserModal
                isOpen={showCreateUser}
                onClose={() => setShowCreateUser(false)}
                onSuccess={handleUserCreated}
            />
            <CreateOutletModal
                isOpen={showCreateOutlet}
                onClose={() => setShowCreateOutlet(false)}
                onSuccess={handleOutletCreated}
            />
            <ManagePermissionsModal
                isOpen={showManagePermissions}
                onClose={() => setShowManagePermissions(false)}
                onSuccess={handleUserCreated}
            />
        </ProtectedRoute>
    );
}
