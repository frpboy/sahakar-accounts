'use client';

import React, { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { createClientBrowser } from '@/lib/supabase-client';
import { Plus, Edit, Trash2, Tag, Building2, Save, X, Loader2 } from 'lucide-react';
import { CreateOutletModal } from '@/components/create-outlet-modal';

interface OutletType {
    code: string;
    name: string;
    short_code: string;
}

interface Outlet {
    id: string;
    name: string;
    code: string;
    type: string;
    location: string;
    address?: string;
    phone?: string;
    email?: string;
}

export default function OutletMetadataPage() {
    const supabase = createClientBrowser();
    const [activeTab, setActiveTab] = useState<'categories' | 'outlets'>('categories');

    // Data States
    const [types, setTypes] = useState<OutletType[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [loading, setLoading] = useState(true);

    // Editing States
    const [editingType, setEditingType] = useState<OutletType | null>(null);
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

    // Outlet Modal States
    const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
    const [isOutletModalOpen, setIsOutletModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'categories') {
                const { data, error } = await (supabase as any)
                    .from('outlet_types')
                    .select('*')
                    .order('name');
                if (error) throw error;
                setTypes(data || []);
            } else {
                const { data, error } = await (supabase as any)
                    .from('outlets')
                    .select('*')
                    .order('name');
                if (error) throw error;
                setOutlets(data || []);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    // --- Category Handlers ---
    const handleDeleteType = async (code: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            const { error } = await (supabase as any).from('outlet_types').delete().eq('code', code);
            if (error) throw error;
            fetchData();
        } catch (err) {
            alert('Failed to delete category');
        }
    };

    // --- Components ---
    const CategoryModal = () => {
        const [formData, setFormData] = useState<OutletType>(
            editingType || { code: '', name: '', short_code: '' }
        );
        const [submitLoading, setSubmitLoading] = useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setSubmitLoading(true);
            try {
                const { error } = await (supabase as any)
                    .from('outlet_types')
                    .upsert(formData);
                if (error) throw error;
                setIsTypeModalOpen(false);
                setEditingType(null);
                fetchData();
            } catch (err: any) {
                alert('Error processing category: ' + err.message);
            } finally {
                setSubmitLoading(false);
            }
        };

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                    <div className="flex justify-between items-center p-6 border-b">
                        <h3 className="text-lg font-bold">{editingType ? 'Edit Category' : 'Add Category'}</h3>
                        <button onClick={() => setIsTypeModalOpen(false)}><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                className="w-full border rounded p-2"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Code (Generic)</label>
                                <input
                                    className="w-full border rounded p-2"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    required
                                    disabled={!!editingType} // PK cannot change
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Short Code (Prefix)</label>
                                <input
                                    className="w-full border rounded p-2"
                                    value={formData.short_code}
                                    onChange={e => setFormData({ ...formData, short_code: e.target.value.toUpperCase() })}
                                    required
                                    maxLength={3}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={submitLoading}
                            className="w-full bg-blue-600 text-white rounded p-2 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitLoading ? 'Saving...' : 'Save Category'}
                        </button>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <TopBar title="Metadata Management" />
            <div className="flex-1 overflow-auto bg-gray-50 p-6">
                <div className="max-w-5xl mx-auto space-y-6">

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'categories' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Outlet Categories
                            {activeTab === 'categories' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('outlets')}
                            className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'outlets' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Registered Outlets
                            {activeTab === 'outlets' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-lg shadow border p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {activeTab === 'categories' ? 'Outlet Categories' : 'Outlets List'}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {activeTab === 'categories'
                                        ? 'Define types of outlets (e.g. Hypermarket, Supercenter) and their ID prefixes.'
                                        : 'View and manage registered outlets and their short codes.'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    if (activeTab === 'categories') {
                                        setEditingType(null);
                                        setIsTypeModalOpen(true);
                                    } else {
                                        setSelectedOutlet(null);
                                        setIsOutletModalOpen(true);
                                    }
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4" />
                                Add New
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                Loading...
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            {activeTab === 'categories' ? (
                                                <>
                                                    <th className="px-4 py-3 font-medium text-gray-500">Short Code</th>
                                                    <th className="px-4 py-3 font-medium text-gray-500">Name</th>
                                                    <th className="px-4 py-3 font-medium text-gray-500">Internal Code</th>
                                                    <th className="px-4 py-3 font-medium text-gray-500 text-right">Actions</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="px-4 py-3 font-medium text-gray-500">Code</th>
                                                    <th className="px-4 py-3 font-medium text-gray-500">Outlet Name</th>
                                                    <th className="px-4 py-3 font-medium text-gray-500">Type</th>
                                                    <th className="px-4 py-3 font-medium text-gray-500">Location</th>
                                                    <th className="px-4 py-3 font-medium text-gray-500 text-right">Actions</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {activeTab === 'categories' ? (
                                            types.map((type) => (
                                                <tr key={type.code} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{type.short_code}</td>
                                                    <td className="px-4 py-3 font-medium">{type.name}</td>
                                                    <td className="px-4 py-3 text-gray-500">{type.code}</td>
                                                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingType(type);
                                                                setIsTypeModalOpen(true);
                                                            }}
                                                            className="p-1 hover:bg-gray-200 rounded text-blue-600"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteType(type.code)}
                                                            className="p-1 hover:bg-gray-200 rounded text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            outlets.map((outlet) => (
                                                <tr key={outlet.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-mono font-bold text-green-600">{outlet.code}</td>
                                                    <td className="px-4 py-3 font-medium">{outlet.name}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                                            {outlet.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500">{outlet.location}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedOutlet(outlet);
                                                                setIsOutletModalOpen(true);
                                                            }}
                                                            className="p-1 hover:bg-gray-200 rounded text-blue-600"
                                                            title="Edit Outlet"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        {((activeTab === 'categories' && types.length === 0) || (activeTab === 'outlets' && outlets.length === 0)) && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                                                    No items found. Click "Add New" to create one.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modals */}
                {isTypeModalOpen && <CategoryModal />}
                {isOutletModalOpen && (
                    <CreateOutletModal
                        isOpen={isOutletModalOpen}
                        onClose={() => {
                            setIsOutletModalOpen(false);
                            setSelectedOutlet(null);
                        }}
                        onSuccess={() => {
                            setIsOutletModalOpen(false);
                            fetchData();
                        }}
                        initialData={selectedOutlet}
                    />
                )}
            </div>
        </div>
    );
}
