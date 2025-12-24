'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CreateUserModal } from '@/components/create-user-modal';
import { ManagePermissionsModal } from '@/components/manage-permissions-modal';
import { UserPlus, Settings } from 'lucide-react';

export default function UsersPage() {
    const supabase = createClientComponentClient();
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [showManagePermissions, setShowManagePermissions] = useState(false);

    const { data: users, isLoading, refetch } = useQuery({
        queryKey: ['users-list'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('name');
            if (error) throw error;
            return data;
        },
    });

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Users</h1>
                    <p className="text-gray-600 mt-2">Manage system users and access.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowCreateUser(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <UserPlus size={20} />
                        Add User
                    </button>
                    <button
                        onClick={() => setShowManagePermissions(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Settings size={20} />
                        Manage Permissions
                    </button>
                </div>
            </div>

            {/* Modals */}
            <CreateUserModal
                isOpen={showCreateUser}
                onClose={() => setShowCreateUser(false)}
                onSuccess={() => {
                    setShowCreateUser(false);
                    refetch();
                }}
            />
            <ManagePermissionsModal
                isOpen={showManagePermissions}
                onClose={() => setShowManagePermissions(false)}
                onSuccess={() => setShowManagePermissions(false)}
            />

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Outlet ID
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users?.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users?.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.name || user.full_name || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'master_admin' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'outlet_manager' ? 'bg-green-100 text-green-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.outlet_id ? (
                                                <span className="font-mono text-xs">{user.outlet_id}</span>
                                            ) : (
                                                <span className="text-red-500 text-xs">Unassigned</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
