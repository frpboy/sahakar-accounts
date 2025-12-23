'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Loader2, User, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ManagePermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ManagePermissionsModal({ isOpen, onClose, onSuccess }: ManagePermissionsModalProps) {
    const [selectedUser, setSelectedUser] = useState('');
    const [newRole, setNewRole] = useState('');
    const [newOutletId, setNewOutletId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch users
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await fetch('/api/users');
            if (!res.ok) return [];
            return res.json();
        },
        enabled: isOpen,
    });

    // Fetch outlets
    const { data: outlets } = useQuery({
        queryKey: ['outlets'],
        queryFn: async () => {
            const res = await fetch('/api/outlets');
            if (!res.ok) return [];
            return res.json();
        },
        enabled: isOpen,
    });

    const selectedUserData = users?.find((u: any) => u.id === selectedUser);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Note: This would require a new API endpoint to update user permissions
            // For now, we'll show a message that this needs to be done via SQL
            setError('Permission updates currently require SQL. Use: UPDATE users SET role = \'...\', outlet_id = \'...\' WHERE id = \'...\'');

            // TODO: Implement PATCH /api/users/[id] endpoint
            // const res = await fetch(`/api/users/${selectedUser}`, {
            //   method: 'PATCH',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ role: newRole, outlet_id: newOutletId }),
            // });

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedUserData) {
            setNewRole(selectedUserData.role || '');
            setNewOutletId(selectedUserData.outlet_id || '');
        }
    }, [selectedUserData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        <h2 className="text-xl font-bold text-gray-900">Manage Permissions</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800 whitespace-pre-wrap">{error}</p>
                        </div>
                    )}

                    {/* Select User */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Select User *
                        </label>
                        <select
                            required
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">Choose a user...</option>
                            {users?.map((user: any) => (
                                <option key={user.id} value={user.id}>
                                    {user.full_name || user.name || user.email} ({user.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedUser && (
                        <>
                            {/* Current Info */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-600 mb-1">Current Settings:</p>
                                <p className="text-sm font-medium">Role: <span className="text-blue-600">{selectedUserData?.role}</span></p>
                                <p className="text-sm font-medium">Outlet: <span className="text-blue-600">{selectedUserData?.outlet_id || 'None'}</span></p>
                            </div>

                            {/* New Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Role
                                </label>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Keep current role</option>
                                    <option value="outlet_staff">Outlet Staff</option>
                                    <option value="outlet_manager">Outlet Manager</option>
                                    <option value="ho_accountant">HO Accountant</option>
                                    <option value="master_admin">Master Admin</option>
                                    <option value="auditor">Auditor</option>
                                    <option value="superadmin">Superadmin</option>
                                </select>
                            </div>

                            {/* Assign Outlet */}
                            {(newRole === 'outlet_staff' || newRole === 'outlet_manager' || selectedUserData?.role?.includes('outlet')) && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                        <Building2 className="w-4 h-4" />
                                        Assign Outlet
                                    </label>
                                    <select
                                        value={newOutletId}
                                        onChange={(e) => setNewOutletId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">No outlet assigned</option>
                                        {outlets?.map((outlet: any) => (
                                            <option key={outlet.id} value={outlet.id}>
                                                {outlet.name} ({outlet.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* SQL Command Preview */}
                            {(newRole || newOutletId) && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs font-medium text-blue-800 mb-2">SQL Command to Run:</p>
                                    <code className="text-xs text-blue-900 block whitespace-pre-wrap">
                                        {`UPDATE users SET\n${newRole ? `  role = '${newRole}'` : ''}${newRole && newOutletId ? ',\n' : ''}${newOutletId ? `  outlet_id = '${newOutletId}'` : ''}\nWHERE id = '${selectedUser}';`}
                                    </code>
                                </div>
                            )}
                        </>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedUser}
                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Shield className="w-4 h-4" />
                                    Show SQL Command
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
