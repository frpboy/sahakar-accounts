'use client';

import React, { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Building2, Plus, Edit, Trash2, Search, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';

export default function OutletManagementPage() {
    const supabase = createClientBrowser();
    const { user } = useAuth();
    const [outlets, setOutlets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        loadOutlets();
    }, []);

    const loadOutlets = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('outlets')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setOutlets(data || []);
        } catch (err) {
            console.error('Error loading outlets:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredOutlets = outlets.filter(o =>
        o.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            <TopBar title="Outlet Management" />

            <div className="flex-1 overflow-auto bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Outlet Management</h2>
                                <p className="text-gray-600 mt-1">
                                    Manage outlet locations and settings
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                Add New Outlet
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search outlets by name or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Outlets Grid */}
                    {loading ? (
                        <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-400">
                            Loading outlets...
                        </div>
                    ) : filteredOutlets.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-400">
                            No outlets found
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredOutlets.map((outlet) => (
                                <div key={outlet.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <Building2 className="h-8 w-8 text-blue-600" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 hover:bg-gray-100 rounded-md">
                                                <Edit className="h-4 w-4 text-blue-600" />
                                            </button>
                                            <button className="p-2 hover:bg-gray-100 rounded-md">
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                                        {outlet.name}
                                    </h3>

                                    {outlet.location && (
                                        <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <span>{outlet.location}</span>
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-gray-500">Status</div>
                                            <div className="text-sm font-semibold text-green-600">Active</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500">Type</div>
                                            <div className="text-sm font-semibold text-gray-900 capitalize">
                                                {outlet.outlet_type || 'HP'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="text-xs text-gray-500 mb-1">Outlet ID</div>
                                        <div className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                            {outlet.id.substring(0, 20)}...
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{outlets.length}</div>
                            <div className="text-sm text-gray-600">Total Outlets</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {outlets.filter(o => o.outlet_type === 'hyper_pharmacy' || !o.outlet_type).length}
                            </div>
                            <div className="text-sm text-gray-600">Hyper Pharmacies</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {outlets.filter(o => o.outlet_type === 'smart_clinic').length}
                            </div>
                            <div className="text-sm text-gray-600">Smart Clinics</div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">{outlets.length}</div>
                            <div className="text-sm text-gray-600">Active Outlets</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
