'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Link as LinkIcon, Save, PlusCircle } from 'lucide-react';

//
import { useQuery } from '@tanstack/react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CreateUserModal } from '@/components/create-user-modal';
import { ManagePermissionsModal } from '@/components/manage-permissions-modal';
import { AssignOutletModal } from '@/components/assign-outlet-modal';
import { useRealtimeUsers, useRealtimeOutlets } from '@/hooks/use-realtime';
import { UserPlus, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
//

type UsersListRow = {
    id: string;
    email: string;
    name?: string | null;
    full_name?: string | null;
    role: string;
    outlet_id?: string | null;
};

export default function UsersPage() {
    const supabase = createClientComponentClient();
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [showManagePermissions, setShowManagePermissions] = useState(false);
    const [outlets, setOutlets] = useState<Array<{ id: string; name: string; code: string; drive_folder_url?: string | null }>>([]);
    const [selectedOutletId, setSelectedOutletId] = useState<string>('');
    const [driveFolderUrl, setDriveFolderUrl] = useState<string>('');
    const [assignMessage, setAssignMessage] = useState<string>('');
    const [assignUser, setAssignUser] = useState<{ id: string; name?: string | null; email: string } | null>(null);

    const { status: usersRt } = useRealtimeUsers(() => refetch());
    const { status: outletsRt } = useRealtimeOutlets(async () => {
        const r = await fetch('/api/outlets');
        if (r.ok) setOutlets(await r.json());
    });
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            const allowed = ['superadmin', 'master_admin'];
            if (!allowed.includes(user.profile.role)) {
                router.replace('/dashboard');
            }
        }
    }, [loading, user, router]);

    const { data: users, isLoading, refetch, error } = useQuery<UsersListRow[]>({
        queryKey: ['users-list'],
        queryFn: async () => {
            const res = await fetch('/api/users', { method: 'GET' });
            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                throw new Error(payload?.error || `Failed to load users (${res.status})`);
            }
            const data = (await res.json()) as UsersListRow[];
            return data ?? [];
        },
    });

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/outlets');
                if (!res.ok) return;
                const data = await res.json();
                setOutlets(data || []);
            } catch {}
        })();
    }, []);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const allowed = ['superadmin', 'master_admin'];
    if (!allowed.includes(user.profile.role)) {
        return null;
    }

    return (
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Users</h1>
                    <p className="text-gray-600 mt-2">Manage system users and access.</p>
                </div>
                <div className="flex gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${usersRt === 'online' ? 'bg-green-100 text-green-800' : usersRt === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>Live: {usersRt}</span>
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
            <AssignOutletModal
                isOpen={!!assignUser}
                user={assignUser}
                outlets={outlets}
                onClose={() => setAssignUser(null)}
                onSuccess={() => refetch()}
            />

            {/* Assign Google Drive Folder to Outlet */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" /> Assign Google Drive Folder
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Outlet</label>
                        <select
                            value={selectedOutletId}
                            onChange={(e) => setSelectedOutletId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="">Select outlet</option>
                            {outlets.map((o) => (
                                <option key={o.id} value={o.id}>{o.code} — {o.name}</option>
                            ))}
                        </select>
                        {selectedOutletId && (
                            <p className="text-xs text-gray-500 mt-1">Current: {outlets.find(o => o.id === selectedOutletId)?.drive_folder_url || 'Not set'}</p>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Google Drive Folder URL</label>
                        <div className="flex gap-2">
                            <input
                                value={driveFolderUrl}
                                onChange={(e) => setDriveFolderUrl(e.target.value)}
                                placeholder="https://drive.google.com/drive/folders/..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                            />
                            <button
                                onClick={async () => {
                                    setAssignMessage('');
                                    try {
                                        const res = await fetch('/api/outlets/drive-folder', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ outletId: selectedOutletId, driveFolderUrl }),
                                        });
                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);
                                        setAssignMessage('Folder assigned successfully');
                                        // Refresh outlets list to reflect the change
                                        const r = await fetch('/api/outlets');
                                        if (r.ok) setOutlets(await r.json());
                                    } catch (e) {
                                        setAssignMessage((e as Error).message);
                                    }
                                }}
                                disabled={!selectedOutletId || !driveFolderUrl}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Assign
                            </button>
                        </div>
                        {assignMessage && (
                            <p className="text-xs mt-2 text-gray-700 flex items-center gap-1"><LinkIcon className="w-4 h-4" /> {assignMessage}</p>
                        )}
                    </div>
                </div>
            </div>

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
                            ) : error ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-red-600">
                                        {(error as Error).message}
                                    </td>
                                </tr>
                            ) : users?.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users?.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.name || 'N/A'}
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
                                                <button
                                                    onClick={() => setAssignUser({ id: user.id, name: user.name || null, email: user.email })}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    <PlusCircle className="w-3 h-3" /> Assign Outlet
                                                </button>
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
