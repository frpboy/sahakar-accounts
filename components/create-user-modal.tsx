'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, UserPlus, Loader2 } from 'lucide-react';

interface CreateUserModalProps {
import { X, UserPlus, Loader2 } from 'lucide-react';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        role: 'outlet_staff',
        phone: '',
        outletId: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [approvalId, setApprovalId] = useState<string>('');
    const router = useRouter();
    const [outlets, setOutlets] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchOutlets();
        }
    }, [isOpen]);

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

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok && res.status !== 202) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create user');
            }

            if (res.status === 202) {
                const data = await res.json();
                setApprovalId(data.approvalId);
                setSuccess(`Pending approval created (ID: ${data.approvalId})`);
            } else {
                onSuccess();
                onClose();
            }

            // Reset form
            setFormData({
                email: '',
                fullName: '',
                role: 'outlet_staff',
                phone: '',
                outletId: '',
            });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
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
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-800">{success}</p>
                            {approvalId && (
                                <div className="mt-2">
                                    <button
                                        type="button"
                                        onClick={() => router.push(`/dashboard/admin?approvalId=${approvalId}#approvals`)}
                                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                        Approve
                                    </button>
                                </div>
                            )}
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
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="user@example.com"
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
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    {/* Outlet Selection */}
                    {(formData.role === 'outlet_staff' || formData.role === 'outlet_manager') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Assign Outlet *
                            </label>
                            <select
                                required
                                value={formData.outletId}
                                onChange={(e) => setFormData({ ...formData, outletId: e.target.value })}
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
                    )}

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
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    Create User
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
