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
                    .upsert(formData); // Upsert handles both create (if code unique) and update

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
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">
                            {editingType ? 'Edit Category' : 'New Category'}
                        </h3>
                        <button onClick={() => setIsTypeModalOpen(false)}><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Code (Internal ID)</label>
                            <input
                                className="w-full border rounded p-2"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                placeholder="e.g. hyper_pharmacy"
                                disabled={!!editingType} // Primary key cannot be changed on edit
                                required
                            />
                            {!!editingType && <p className="text-xs text-gray-500">Cannot change Code once created.</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                className="w-full border rounded p-2"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Hyper Pharmacy"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Short Code</label>
                            <input
                                className="w-full border rounded p-2"
                                value={formData.short_code}
                                onChange={e => setFormData({ ...formData, short_code: e.target.value.toUpperCase() })}
                                placeholder="e.g. HP"
                                maxLength={5}
                                required
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setIsTypeModalOpen(false)} className="flex-1 border p-2 rounded">Cancel</button>
                            <button type="submit" disabled={submitLoading} className="flex-1 bg-blue-600 text-white p-2 rounded flex justify-center items-center gap-2">
                                {submitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <TopBar title="Outlet Metadata" />

            <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
                <div className="bg-white rounded-lg shadow border overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b flex">
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'categories'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Tag className="w-4 h-4" />
                            Outlet Categories
                        </button>
                        <button
                            onClick={() => setActiveTab('outlets')}
                            className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'outlets'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Building2 className="w-4 h-4" />
                            Outlet Codes
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {activeTab === 'categories' ? 'Manage Categories (HP/SC)' : 'Manage Outlet Codes (MAK/MTR)'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {activeTab === 'categories'
                                        ? 'Define the types of outlets available in the system.'
                                        : 'View and manage registered outlets and their short codes.'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    if (activeTab === 'categories') {
                                        setEditingType(null);
                                        setIsTypeModalOpen(true);
                                    } else {
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
                                                        {/* Edit functionality for outlets is complex, just show placeholder or link */}
                                                        <span className="text-gray-400 text-xs text-italic">Managed via Outlets page</span>
                                                        {/*
                                                        <button className="p-1 hover:bg-gray-200 rounded text-blue-600">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        */}
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
            </div>

            {isTypeModalOpen && <CategoryModal />}
            <CreateOutletModal
                isOpen={isOutletModalOpen}
                onClose={() => setIsOutletModalOpen(false)}
                onSuccess={() => {
                    fetchData();
                    // Maybe show success toast
                }}
            />
        </div>
    );
}
