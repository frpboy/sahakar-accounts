'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { useQuery } from '@tanstack/react-query';
import { CreateOutletModal } from '@/components/create-outlet-modal';
import { Edit, Building2, MapPin, Phone, Mail } from 'lucide-react';

interface Outlet {
    id: string;
    name: string;
    code: string;
    address: string | null;
    created_at: string;
    location?: string;
    phone?: string;
    email?: string;
    type?: string;
}

export default function OutletsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);

    // Fetch all outlets
    const { data: outlets, isLoading, refetch } = useQuery<Outlet[]>({
        queryKey: ['outlets'],
        queryFn: async () => {
            const res = await fetch('/api/outlets');
            if (!res.ok) throw new Error('Failed to fetch outlets');
            return res.json();
        },
    });

    const handleEdit = (outlet: Outlet) => {
        setSelectedOutlet(outlet);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedOutlet(null);
        setIsModalOpen(true);
    };

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
                </div>

                {/* Outlets List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">All Outlets</h2>
                            <button
                                onClick={handleCreate}
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
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
                                                    <Building2 className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium text-gray-900">{outlet.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="truncate max-w-xs" title={outlet.location || outlet.address || ''}>
                                                        {outlet.location || outlet.address || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 text-sm text-gray-600">
                                                    {outlet.phone && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="w-3 h-3" />
                                                            {outlet.phone}
                                                        </div>
                                                    )}
                                                    {outlet.email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="w-3 h-3" />
                                                            {outlet.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleEdit(outlet)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Edit Outlet"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                No outlets found. Create your first one!
                            </div>
                        )}
                    </div>
                </div>

                {/* Create/Edit Outlet Modal */}
                <CreateOutletModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedOutlet(null);
                    }}
                    onSuccess={() => {
                        refetch();
                    }}
                    initialData={selectedOutlet}
                />
            </div>
        </ProtectedRoute>
    );
}
