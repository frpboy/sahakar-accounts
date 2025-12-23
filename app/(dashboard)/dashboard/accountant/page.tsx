'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { MonthlyReport } from '@/components/monthly-report';
import { BalanceSummary } from '@/components/balance-summary';

export default function AccountantDashboard() {
    const { user } = useAuth();

    return (
        <ProtectedRoute allowedRoles={['ho_accountant']}>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">HO Accountant Dashboard</h1>
                    <p className="text-gray-600 mt-2">Welcome, {user?.profile?.name}</p>
                </div>

                {/* Balance Summary */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">All Outlets Balance</h2>
                    <BalanceSummary />
                </div>

                {/* Monthly Report */}
                <div className="mb-8">
                    <MonthlyReport />
                </div>

                {/* Reports Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">📄 Financial Reports</h2>
                        <div className="space-y-3">
                            <a href="/dashboard/monthly" className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block">
                                <h3 className="font-medium text-gray-900">Monthly P&L Statement</h3>
                                <p className="text-sm text-gray-600">Profit and Loss breakdown</p>
                            </a>
                            <a href="/dashboard/cash-flow" className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block">
                                <h3 className="font-medium text-gray-900">Cash Flow Report</h3>
                                <p className="text-sm text-gray-600">Cash movement analysis</p>
                            </a>
                            <a href="/dashboard/reports" className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block">
                                <h3 className="font-medium text-gray-900">Category Summary</h3>
                                <p className="text-sm text-gray-600">Income/Expense by category</p>
                            </a>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Google Sheets</h2>
                        <div className="space-y-3">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h3 className="font-medium text-green-900 mb-2">✓ Auto-Sync Enabled</h3>
                                <p className="text-sm text-green-700">
                                    Daily records are automatically synced to Google Sheets when locked.
                                </p>
                            </div>
                            <a
                                href={process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center block"
                            >
                                📂 Open Google Sheets
                            </a>
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await fetch('/api/sync/google-sheets', { method: 'POST' });
                                        const data = await res.json();
                                        if (data.success) {
                                            alert(`✅ Synced ${data.recordCount} records successfully!`);
                                        } else {
                                            alert(`⚠️ ${data.message || 'Sync failed'}`);
                                        }
                                    } catch (error) {
                                        alert('❌ Sync error. Please check configuration.');
                                    }
                                }}
                                className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                🔄 Manual Sync
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
