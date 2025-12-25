'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';

interface Auditor {
    id: string;
    email: string;
    name: string;
    role: string;
    auditor_access_granted_at: string | null;
    auditor_access_expires_at: string | null;
    auditor_access_granted_by: string | null;
}

export default function AuditorManagementPage() {
    const queryClient = useQueryClient();
    const [selectedAuditor, setSelectedAuditor] = useState<string | null>(null);
    const [accessDays, setAccessDays] = useState<number>(30);

    // Fetch all auditors
    const { data: auditors, isLoading } = useQuery<Auditor[]>({
        queryKey: ['auditors'],
        queryFn: async () => {
            const res = await fetch('/api/users?role=auditor');
            if (!res.ok) throw new Error('Failed to fetch auditors');
            return res.json();
        }
    });

    // Grant access mutation
    const grantAccessMutation = useMutation({
        mutationFn: async ({ auditor_id, days }: { auditor_id: string; days: number }) => {
            const res = await fetch('/api/admin/auditors/grant-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ auditor_id, days })
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to grant access');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auditors'] });
            setSelectedAuditor(null);
            setAccessDays(30);
        }
    });

    // Revoke access mutation
    const revokeAccessMutation = useMutation({
        mutationFn: async (auditor_id: string) => {
            const res = await fetch('/api/admin/auditors/revoke-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ auditor_id })
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to revoke access');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auditors'] });
        }
    });

    const handleGrantAccess = (auditorId: string) => {
        if (confirm(`Grant ${accessDays} days of access to this auditor?`)) {
            grantAccessMutation.mutate({ auditor_id: auditorId, days: accessDays });
        }
    };

    const handleRevokeAccess = (auditorId: string) => {
        if (confirm('Revoke access for this auditor? This will expire their access immediately.')) {
            revokeAccessMutation.mutate(auditorId);
        }
    };

    const getAccessStatus = (auditor: Auditor) => {
        if (!auditor.auditor_access_expires_at) {
            return { status: 'no_access', color: 'gray', label: 'No Access' };
        }

        const expiresAt = new Date(auditor.auditor_access_expires_at);
        const now = new Date();

        if (expiresAt < now) {
            return { status: 'expired', color: 'red', label: 'Expired' };
        }

        const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { status: 'active', color: 'green', label: `Active (${daysRemaining}d remaining)` };
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Shield className="w-8 h-8 text-blue-600" />
                    Auditor Access Management
                </h1>
                <p className="text-gray-600 mt-2">
                    Grant or revoke time-bound access for auditors to view locked financial records
                </p>
            </div>

            {/* Grant Access Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Grant Access</h2>
                <div className="flex items-end gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Auditor
                        </label>
                        <select
                            value={selectedAuditor || ''}
                            onChange={(e) => setSelectedAuditor(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Choose an auditor...</option>
                            {auditors?.map((auditor) => (
                                <option key={auditor.id} value={auditor.id}>
                                    {auditor.name} ({auditor.email})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Access Duration (days)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="365"
                            value={accessDays}
                            onChange={(e) => setAccessDays(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={() => selectedAuditor && handleGrantAccess(selectedAuditor)}
                        disabled={!selectedAuditor || grantAccessMutation.isPending}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {grantAccessMutation.isPending ? 'Granting...' : 'Grant Access'}
                    </button>
                </div>
                {grantAccessMutation.isError && (
                    <p className="mt-2 text-sm text-red-600">
                        Error: {grantAccessMutation.error.message}
                    </p>
                )}
                {grantAccessMutation.isSuccess && (
                    <p className="mt-2 text-sm text-green-600">
                        Access granted successfully!
                    </p>
                )}
            </div>

            {/* Auditors Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Auditor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Access Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Granted At
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Expires At
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {auditors && auditors.length > 0 ? (
                            auditors.map((auditor) => {
                                const accessStatus = getAccessStatus(auditor);
                                return (
                                    <tr key={auditor.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Shield className="w-5 h-5 text-gray-400 mr-3" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {auditor.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {auditor.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${accessStatus.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    accessStatus.status === 'expired' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {accessStatus.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {auditor.auditor_access_granted_at ? (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(auditor.auditor_access_granted_at).toLocaleDateString()}
                                                </div>
                                            ) : (
                                                'Never'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {auditor.auditor_access_expires_at ? (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(auditor.auditor_access_expires_at).toLocaleDateString()}
                                                </div>
                                            ) : (
                                                'N/A'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {accessStatus.status === 'active' ? (
                                                <button
                                                    onClick={() => handleRevokeAccess(auditor.id)}
                                                    disabled={revokeAccessMutation.isPending}
                                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                >
                                                    Revoke Access
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">No active access</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No auditors found. Create auditor users first.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
