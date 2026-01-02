'use client';

import React, { useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { useQuery } from '@tanstack/react-query';
import { Users, Activity, Clock, Shield } from 'lucide-react';

export default function UserActivityPage() {
    const supabase = createClientBrowser();
    const { user } = useAuth();
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const isAdmin = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');

    // Fetch users
    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['users-list'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('profiles')
                .select('id, email, full_name, role, last_login_at, is_active')
                .order('full_name');
            if (error) throw error;
            return data;
        },
        enabled: isAdmin // Only fetch if admin
    });

    // Fetch activity for selected user or recent activity for all
    const { data: activity, isLoading: activityLoading } = useQuery({
        queryKey: ['user-activity', selectedUser],
        queryFn: async () => {
            let query: any = supabase
                .from('audit_logs') // Assuming audit_logs table exists based on plan, or fallback to transactions/logs
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (selectedUser) {
                query = query.eq('user_id', selectedUser);
            }

            // Using transaction logs as proxy if audit_logs doesn't fully exist/populated yet
            // Or better, let's look at transactions created by users
            const { data: txns, error } = await supabase
                .from('transactions')
                .select('id, created_at, amount, transaction_type, description, created_by')
                .order('created_at', { ascending: false })
                .limit(50);

            if (selectedUser) {
                return txns?.filter((t: any) => t.created_by === selectedUser) || [];
            }
            return txns || [];
        }
    });

    if (!isAdmin) {
        return (
            <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
                <TopBar title="Access Denied" />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-2">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">HO Exclusive Audit</h2>
                        <p className="text-gray-600 max-w-sm mx-auto">
                            System user activity logs and audit trails are only accessible to Head Office accounts and Administrators.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <TopBar title="User Activity Report" />

            <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Total Users</span>
                        </div>
                        <div className="text-2xl font-bold">{users?.length || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                <Activity className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-medium text-gray-500">Active Today</span>
                        </div>
                        {/* Placeholder logic for active today */}
                        <div className="text-2xl font-bold">{users?.filter((u: any) => new Date(u.last_login_at || '').getDate() === new Date().getDate()).length || 0}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User List */}
                    <div className="bg-white rounded-xl border shadow-sm p-4 overflow-hidden flex flex-col h-[600px]">
                        <h3 className="font-bold text-gray-900 mb-4 px-2">System Users</h3>
                        <div className="overflow-y-auto flex-1 space-y-2">
                            {usersLoading ? (
                                <div className="text-center py-4">Loading users...</div>
                            ) : users?.map((u: any) => (
                                <button
                                    key={u.id}
                                    onClick={() => setSelectedUser(u.id === selectedUser ? null : u.id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${selectedUser === u.id
                                        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                        : 'hover:bg-gray-50 border-transparent hover:border-gray-200'
                                        }`}
                                >
                                    <div>
                                        <div className="font-medium text-gray-900">{u.full_name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500">{u.email}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                                            u.role === 'outlet_manager' ? 'bg-orange-100 text-orange-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {u.role?.replace('_', ' ')}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6 h-[600px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-900">
                                {selectedUser ? 'User Activity Log' : 'Recent System Transactions'}
                            </h3>
                            {selectedUser && (
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Show All
                                </button>
                            )}
                        </div>

                        <div className="overflow-y-auto flex-1 pr-2 space-y-4">
                            {activityLoading ? (
                                <div className="text-center py-10 text-gray-500">Loading activity...</div>
                            ) : activity?.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">No recent activity found.</div>
                            ) : activity?.map((log: any) => (
                                <div key={log.id} className="flex gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                                    <div className={`mt-1 p-2 rounded-full ${log.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        }`}>
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="font-medium text-gray-900">{log.description || 'No description'}</p>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between text-sm">
                                            <span className="text-gray-600">
                                                ID: {log.id.slice(0, 8)}...
                                            </span>
                                            <span className={`font-bold ${log.type === 'income' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {log.type === 'income' ? '+' : '-'}₹{log.amount}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
