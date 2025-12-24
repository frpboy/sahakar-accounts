'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { useQuery } from '@tanstack/react-query';
import { CreateOutletModal } from '@/components/create-outlet-modal';

interface Outlet {
    id: string;
    name: string;
    code: string;
    address: string | null;
    created_at: string;
}

export default function OutletsPage() {
    const { user } = useAuth();
    const [showCreateOutlet, setShowCreateOutlet] = useState(false);

    // Fetch all outlets
    const { data: outlets, isLoading, refetch } = useQuery<Outlet[]>({
        queryKey: ['outlets'],
        queryFn: async () => {
            const res = await fetch('/api/outlets');
            if (!res.ok) throw new Error('Failed to fetch outlets');
            return res.json();
        },
    });

    return (
        <ProtectedRoute allowedRoles={['master_admin', 'superadmin']}>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Outlet Management</h1>
                    <p className="text-gray-600 mt-2">Manage store locations and settings</p>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">🏪</div>
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Total Outlets</p>
                                <p className="text-2xl font-bold text-blue-900">{outlets?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">✅</div>
                            <div>
                                <p className="text-sm text-green-600 font-medium">Active</p>
                                <p className="text-2xl font-bold text-green-900">{outlets?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">👥</div>
                            <div>
                                <p className="text-sm text-purple-600 font-medium">Staff Assigned</p>
                                <p className="text-2xl font-bold text-purple-900">--</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Outlets List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">All Outlets</h2>
                            <button
                                onClick={() => setShowCreateOutlet(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                + Add New Outlet
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                                <p className="mt-2 text-gray-600">Loading outlets...</p>
                            </div>
                        ) : outlets && outlets.length > 0 ? (
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {outlets.map((outlet) => (
                                        <tr key={outlet.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                                                    {outlet.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">🏪</span>
                                                    <span className="font-medium text-gray-900">{outlet.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600">{outlet.address || 'Not specified'}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(outlet.created_at).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">
                                                        Edit
                                                    </button>
                                                    <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded">
                                                        View Stats
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="text-6xl mb-4">🏪</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No outlets found</h3>
                                <p className="text-gray-600 mb-4">Get started by adding your first outlet</p>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    + Add First Outlet
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Outlet Modal */}
                <CreateOutletModal
                    isOpen={showCreateOutlet}
                    onClose={() => {
                        setShowCreateOutlet(false);
                        refetch();
                    }}
                />
            </div>
        </ProtectedRoute>
    );
}
