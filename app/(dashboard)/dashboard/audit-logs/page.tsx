'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/protected-route';
import { Shield, Filter, Calendar, AlertTriangle } from 'lucide-react';

interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    entity: string;
    entity_id: string;
    old_data: Record<string, unknown> | null;
    new_data: Record<string, unknown> | null;
    reason: string;
    severity: string;
    ip_address: string;
    user_agent: string;
    created_at: string;
}

export default function AuditLogsViewer() {
    const [filters, setFilters] = useState({
        severity: 'all',
        action: 'all',
        startDate: '',
        endDate: ''
    });

    const { data: logs, isLoading } = useQuery<AuditLog[]>({
        queryKey: ['audit-logs', filters],
        queryFn: async () => {
            // TODO: Create API endpoint for audit logs
            const res = await fetch('/api/audit-logs');
            if (!res.ok) throw new Error('Failed to fetch audit logs');
            return res.json();
        }
    });

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <ProtectedRoute allowedRoles={['superadmin']}>
            <div className="max-w-7xl mx-auto p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Shield className="w-8 h-8 text-purple-600" />
                        Audit Logs
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Complete system activity and security audit trail
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Filter className="w-4 h-4 inline mr-1" />
                                Severity
                            </label>
                            <select
                                value={filters.severity}
                                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">All Severities</option>
                                <option value="critical">Critical</option>
                                <option value="warning">Warning</option>
                                <option value="normal">Normal</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Action
                            </label>
                            <select
                                value={filters.action}
                                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">All Actions</option>
                                <option value="submit_day">Submit Day</option>
                                <option value="lock_day">Lock Day</option>
                                <option value="unlock_day">Unlock Day</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                End Date
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                            <p className="mt-2 text-gray-600">Loading audit logs...</p>
                        </div>
                    ) : logs && logs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(log.created_at).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {log.entity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(log.severity || 'normal')}`}>
                                                    {log.severity || 'normal'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                                {log.reason || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                {log.ip_address || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit Logs Found</h3>
                            <p className="text-gray-600">
                                No logs match your current filters.
                            </p>
                        </div>
                    )}
                </div>

                {/* Info Banner */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-2">
                        <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-blue-900 mb-1">Audit Log Retention</p>
                            <p className="text-sm text-blue-700">
                                All system actions are logged indefinitely for compliance. Critical actions (unlocks, deletions) are flagged for immediate review.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
