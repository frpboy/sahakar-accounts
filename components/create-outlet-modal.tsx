'use client';

import { useState, useEffect } from 'react';
import { X, Building2, Loader2, Edit } from 'lucide-react';
import { createClientBrowser } from '@/lib/supabase-client';

interface CreateOutletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

interface OutletType {
    code: string;
    name: string;
    short_code: string;
}

export function CreateOutletModal({ isOpen, onClose, onSuccess, initialData }: CreateOutletModalProps) {
    const supabase = createClientBrowser();
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        location: '',
        phone: '',
        email: '',
        type: '',
        is_active: true
    });
    const [outletTypes, setOutletTypes] = useState<OutletType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchTypes();
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    code: initialData.code || '',
                    location: initialData.location || '', // Use location field, fallback to address if needed
                    phone: initialData.phone || '',
                    email: initialData.email || '',
                    type: initialData.type || '',
                    is_active: initialData.is_active !== undefined ? initialData.is_active : true
                });
            } else {
                setFormData({
                    name: '',
                    code: '',
                    location: '',
                    phone: '',
                    email: '',
                    type: '',
                    is_active: true
                });
            }
            setError('');
        }
    }, [isOpen, initialData]);

    const fetchTypes = async () => {
        const { data } = await (supabase as any).from('outlet_types').select('*').order('name');
        if (data) setOutletTypes(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const url = initialData ? `/api/outlets/${initialData.id}` : '/api/outlets';
            const method = initialData ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Failed to ${initialData ? 'update' : 'create'} outlet`);
            }

            // Success
            onSuccess();
            onClose();

            // Reset form only if creating
            if (!initialData) {
                setFormData({
                    name: '',
                    code: '',
                    location: '',
                    phone: '',
                    email: '',
                    type: '',
                    is_active: true,
                });
            }
        } catch (err: any) {
            setError(err instanceof Error ? err.message : `Failed to ${initialData ? 'update' : 'create'} outlet`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-green-600" />
                        <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Outlet' : 'Add New Outlet'}</h2>
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
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Outlet Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Outlet Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                            placeholder="MAIN BRANCH"
                        />
                    </div>

                    {/* Outlet Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Outlet Code *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                            placeholder="MB001"
                            maxLength={10}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Unique code (auto-converted to uppercase)
                        </p>
                    </div>

                    {/* Outlet Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Outlet Type *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            required
                        >
                            <option value="" disabled>Select Type</option>
                            {outletTypes.map(t => (
                                <option key={t.code} value={t.code}>{t.name} ({t.short_code})</option>
                            ))}
                        </select>
                    </div>

                    {/* Location/Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location/Address
                        </label>
                        <textarea
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent uppercase"
                            placeholder="STREET, CITY, STATE, PIN"
                            rows={3}
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            inputMode="numeric"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="9876543210"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="outlet@example.com"
                        />
                    </div>



                    {/* Status */}
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={(formData as any).is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked } as any)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                            Outlet is Active
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t mt-6">
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
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {initialData ? 'Saving...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    {initialData ? <Edit className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                                    {initialData ? 'Save Changes' : 'Create Outlet'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
