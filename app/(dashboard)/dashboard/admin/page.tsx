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
import { UserPlus, Building2, Settings, Database, Shield, Check, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import { useRealtimeApprovals, useRealtimeUsers, useRealtimeOutlets } from '@/hooks/use-realtime';

function formatINR(n: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function MonthlyRevenueKPI() {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { data } = useQuery({
        queryKey: ['aggregate-monthly', month],
        queryFn: async () => {
            const res = await fetch(`/api/reports/aggregate-monthly?month=${month}`);
            if (!res.ok) return { totalIncome: 0, totalExpense: 0, netProfit: 0 };
            return res.json();
        }
    });
    const value = formatINR(Number(data?.totalIncome || 0));
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <DashboardCard
                title="Monthly Revenue"
                value={value}
                colorClass="text-purple-600"
                subtitle="All outlets"
            />
        </div>
    );
}

function LiveIndicators() {
    const { status: usersRt } = useRealtimeUsers(() => {});
    const { status: outletsRt } = useRealtimeOutlets(() => {});
    return (
        <div className="flex gap-2">
            <span className={`px-2 py-1 rounded-full ${usersRt === 'online' ? 'bg-green-100 text-green-800' : usersRt === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>Users: {usersRt}</span>
            <span className={`px-2 py-1 rounded-full ${outletsRt === 'online' ? 'bg-green-100 text-green-800' : outletsRt === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>Outlets: {outletsRt}</span>
        </div>
    );
}

function LiveApprovalsIndicator() {
    const { status } = useRealtimeApprovals(() => {});
    return (
        <span className={`px-2 py-1 rounded-full text-xs ${status === 'online' ? 'bg-green-100 text-green-800' : status === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>Live: {status}</span>
    );
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [showCreateOutlet, setShowCreateOutlet] = useState(false);
    const [showManagePermissions, setShowManagePermissions] = useState(false);
    const [seedLoading, setSeedLoading] = useState(false);
    const [seedMessage, setSeedMessage] = useState<string>('');
    const queryClient = useQueryClient();

    // Fetch users count
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await fetch('/api/users');
            if (!res.ok) return [];
            return res.json();
        },
        staleTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
    });

    // Fetch outlets count
    const { data: outlets } = useQuery({
        queryKey: ['outlets'],
        queryFn: async () => {
            const res = await fetch('/api/outlets');
            if (!res.ok) return [];
            return res.json();
        },
        staleTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
    });

    // Fetch pending superadmin approvals
    const { data: approvals, refetch: refetchApprovals, isLoading: approvalsLoading } = useQuery({
        queryKey: ['role-approvals'],
        queryFn: async () => {
            const res = await fetch('/api/admin/role-approvals');
            if (!res.ok) return [];
            return res.json();
        },
    });
    const searchParams = useSearchParams();
    const highlightId = searchParams.get('approvalId');

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
                    <div className="mt-2 text-xs text-gray-600">
                        <LiveIndicators />
                    </div>
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
                    {/* Monthly revenue moved to KPI below */}
                    <DashboardCard
                        title="System Health"
                        value="98%"
                        colorClass="text-green-600"
                        subtitle="Uptime"
                    />
                </div>

                {/* Fetch monthly revenue */}
                <MonthlyRevenueKPI />

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
                            <button
                                onClick={async () => {
                                    setSeedMessage('');
                                    setSeedLoading(true);
                                    try {
                                        const res = await fetch('/api/seed/demo', { method: 'POST' });
                                        const data = await res.json();
                                        if (!res.ok) {
                                            throw new Error(data?.error || `Failed (${res.status})`);
                                        }
                                        setSeedMessage(`Seeded: outlets=${data.outletsCreated}, users=${data.usersUpserted}`);
                                    } catch (e) {
                                        setSeedMessage((e as Error).message);
                                    } finally {
                                        setSeedLoading(false);
                                    }
                                }}
                                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                disabled={seedLoading}
                            >
                                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                    <Database className="w-4 h-4" /> {seedLoading ? 'Seeding Demo Data…' : 'Seed Demo Data'}
                                </h3>
                                <p className="text-sm text-gray-600">Create demo outlet and users</p>
                                {seedMessage && (
                                    <p className="text-xs mt-2 text-gray-700">{seedMessage}</p>
                                )}
                            </button>
                            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                    <Settings className="w-4 h-4" /> Configure Settings
                                </h3>
                                <p className="text-sm text-gray-600">Update outlet details</p>
                            </button>
                            <div className="p-3 border border-gray-200 rounded-lg bg-yellow-50 text-yellow-800">
                                Google Sheets integration has been discontinued.
                            </div>
                        </div>
                    </div>

                    {/* Role Approvals */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5" /> Pending Superadmin Role Approvals
                        </h2>
                        <LiveApprovalsIndicator />
                        {approvalsLoading ? (
                            <p className="text-sm text-gray-600">Loading approvals…</p>
                        ) : (approvals && approvals.length > 0) ? (
                            <div className="space-y-3">
                                {approvals.map((a: any) => (
                                    <div key={a.id} className={`p-3 border rounded-lg ${highlightId === a.id ? 'border-green-400 bg-green-50' : 'border-gray-200'}`} id={`approval-${a.id}`}>
                                        <p className="text-sm text-gray-900">Request for user: <span className="font-mono text-xs">{a.target_user_id}</span></p>
                                        <p className="text-xs text-gray-600">Requested by: <span className="font-mono">{a.requested_by}</span> • {new Date(a.requested_at).toLocaleString('en-IN')}</p>
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={async () => {
                                                    const res = await fetch('/api/admin/role-approvals', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ approvalId: a.id, approve: true }),
                                                    });
                                                    if (res.ok) {
                                                        await refetchApprovals();
                                                        queryClient.invalidateQueries({ queryKey: ['users'] });
                                                    }
                                                }}
                                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                                            >
                                                <Check className="w-4 h-4" /> Approve
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const res = await fetch('/api/admin/role-approvals', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ approvalId: a.id, approve: false }),
                                                    });
                                                    if (res.ok) {
                                                        await refetchApprovals();
                                                    }
                                                }}
                                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                                            >
                                                <X className="w-4 h-4" /> Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">No pending approvals.</p>
                        )}
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
