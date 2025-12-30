'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { AnomalyDashboard } from '@/components/anomaly-dashboard';
import { AlertTriangle } from 'lucide-react';

export default function AdminAnomaliesPage() {
    return (
        <ProtectedRoute allowedRoles={['superadmin', 'master_admin', 'ho_accountant', 'auditor']}>
            <div className="max-w-7xl mx-auto p-6">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Anomaly Management</h1>
                            <p className="text-gray-600">Monitor, analyze, and export system anomalies across all outlets</p>
                        </div>
                    </div>
                </div>

                <AnomalyDashboard />
            </div>
        </ProtectedRoute>
    );
}