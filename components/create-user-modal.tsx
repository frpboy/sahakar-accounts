'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { createClientBrowser } from '@/lib/supabase-client';


interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // User object for editing
}

export function CreateUserModal({ isOpen, onClose, onSuccess, initialData }: UserModalProps) {
    const supabase = createClientBrowser();
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('outlet_staff');
    const [phone, setPhone] = useState('');
    const [outletId, setOutletId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [approvalId, setApprovalId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({}); // kept for compatibility if needed, but we use individual states mostly
    const router = useRouter();
    const [outlets, setOutlets] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Reset or Populate
            if (initialData) {
                setEmail(initialData.email || '');
                setFullName(initialData.name || '');
                setRole(initialData.role || 'outlet_staff');
                setPhone(initialData.phone || '');
                setOutletId(initialData.outlet_id || '');
            } else {
                setEmail('');
                setFullName('');
                setRole('outlet_staff');
                setPhone('');
                setOutletId('');
            }
            setError('');
            setSuccess('');
            setApprovalId(null);
            fetchOutlets();
        }
    }, [isOpen, initialData]);

    const fetchOutlets = async () => {
        try {
            const res = await fetch('/api/outlets');
            if (res.ok) {
                const data = await res.json();
                setOutlets(data || []);
            }
        } catch (err) {
            console.error('Failed to fetch outlets:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        setApprovalId(null);

        try {
            const url = initialData ? `/api/users/${initialData.id}` : '/api/users';
            const method = initialData ? 'PATCH' : 'POST';

            const payload: any = {
                fullName,
                role,
                outletId: outletId || null,
                phone: phone || null, // Include phone in payload
            };

            // Only send email on create, or if we support email updates (backend currently doesn't for PATCH in our simplified version)
            if (!initialData) {
                payload.email = email;
            }
            // For patch, we map fullName to name
            if (initialData) {
                payload.name = fullName;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to ${initialData ? 'update' : 'create'} user`);
            }

            const result = await res.json();
            setSuccess(result.message || `User ${initialData ? 'updated' : 'created'} successfully!`);

            if (result.approvalId) {
                setApprovalId(result.approvalId);
            } else {
                onSuccess();
                if (initialData) {
                    onClose();
                } else {
                    // Reset form only on create
                    setEmail('');
                    setFullName('');
                    setRole('outlet_staff');
                    setPhone('');
                    setOutletId('');
                    // Close on create too? Usually yes or keep open for multiple. Let's close for now as per previous behavior.
                    onClose();
                }
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 transform transition-all duration-300 ease-out scale-100 opacity-100">
                <div className="flex justify-between items-center pb-3 border-b dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {initialData ? 'Edit User' : 'Create New User'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-800">{success}</p>
                        </div>
                    )}

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address *
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!!initialData ? 'bg-gray-100 opacity-75 cursor-not-allowed' : ''}`}
                            placeholder="user@example.com"
                            disabled={!!initialData}
                        />
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="John Doe"
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role *
                        </label>
                        <select
                            required
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="outlet_staff">Outlet Staff</option>
                            <option value="outlet_manager">Outlet Manager</option>
                            <option value="ho_accountant">HO Accountant</option>
                            <option value="master_admin">Master Admin</option>
                            <option value="auditor">Auditor</option>
                            <option value="superadmin">Superadmin</option>
                        </select>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    {/* Outlet Selection */}
                    {
                        (role === 'outlet_staff' || role === 'outlet_manager') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assign Outlet *
                                </label>
                                <select
                                    required
                                    value={outletId}
                                    onChange={(e) => setOutletId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="" disabled>Select an outlet...</option>
                                    {outlets.map((outlet) => (
                                        <option key={outlet.id} value={outlet.id}>
                                            {outlet.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    User will be restricted to this outlet
                                </p>
                            </div>
                        )
                    }

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            <strong>Default Password:</strong> Zabnix@2025
                            <br />
                            <span className="text-xs">User can change password after first login</span>
                        </p>
                    </div>

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
                            disabled={loading}
                            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-600 text-white border-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {initialData ? 'Saving...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    {initialData ? 'Save Changes' : 'Create User'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
