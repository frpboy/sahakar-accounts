'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardCard } from '@/components/dashboard-card';
import { TransactionForm } from '@/components/transaction-form';
import { TransactionList } from '@/components/transaction-list';
import { LiveBalance } from '@/components/live-balance';
import { DailyRecordActions } from '@/components/daily-record-actions';
import { OpeningBalanceModal } from '@/components/opening-balance-modal';
import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';

export default function StaffDashboard() {
    const { user } = useAuth();
    const [showOpeningModal, setShowOpeningModal] = useState(false);

    // Get today's daily record
    const { data: dailyRecord, isLoading: recordLoading } = useQuery({
        queryKey: ['daily-record-today'],
        queryFn: async () => {
            const res = await fetch('/api/daily-records/today');
            if (!res.ok) throw new Error('Failed to fetch daily record');
            return res.json();
        },
    });

    // Fetch outlet information
    const { data: outlet } = useQuery({
        queryKey: ['outlet', user?.profile?.outlet_id as string],
        queryFn: async () => {
            if (!user?.profile?.outlet_id) return null;
            const res = await fetch(`/api/outlets?id=${(user.profile as any).outlet_id}`);
            if (!res.ok) return null;
            const outlets = await res.json();
            return outlets[0] || null;
        },
        enabled: !!(user?.profile as any)?.outlet_id,
    });

    const cashBalance = dailyRecord?.closing_cash ?? dailyRecord?.opening_cash ?? 0;
    const upiBalance = dailyRecord?.closing_upi ?? dailyRecord?.opening_upi ?? 0;

    // Auto-show opening balance modal if needed
    useEffect(() => {
        if (dailyRecord && dailyRecord.status === 'draft') {
            const hasOpeningBalances = (dailyRecord.opening_cash || 0) > 0 || (dailyRecord.opening_upi || 0) > 0;
            if (!hasOpeningBalances) {
                setShowOpeningModal(true);
            }
        }
    }, [dailyRecord]);

    return (
        <ProtectedRoute allowedRoles={['outlet_staff', 'outlet_manager']}>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
                    <p className="text-gray-600 mt-2">Welcome, {user?.profile?.name}</p>
                    {outlet && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                                {outlet.name} ({outlet.code})
                            </span>
                        </div>
                    )}
                </div>

                {/* Daily Record Status */}
                {dailyRecord && (
                    <div className="mb-6">
                        <DailyRecordActions
                            recordId={dailyRecord.id}
                            status={dailyRecord.status}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Live Balance - Takes 1 column */}
                    <div>
                        {recordLoading ? (
                            <div className="bg-gray-100 rounded-lg h-64 animate-pulse"></div>
                        ) : (
                            <LiveBalance
                                cashBalance={cashBalance}
                                upiBalance={upiBalance}
                                openingCash={dailyRecord?.opening_cash || 0}
                                openingUpi={dailyRecord?.opening_upi || 0}
                            />
                        )}
                    </div>

                    {/* Transaction Form - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        {dailyRecord ? (
                            <TransactionForm dailyRecordId={dailyRecord.id} />
                        ) : (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <p className="text-gray-600">Loading daily record...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Transaction List */}
                {dailyRecord && (
                    <div className="mt-8">
                        <TransactionList dailyRecordId={dailyRecord.id} />
                    </div>
                )}

                {/* Opening Balance Modal */}
                {dailyRecord && (
                    <OpeningBalanceModal
                        isOpen={showOpeningModal}
                        onClose={() => setShowOpeningModal(false)}
                        recordId={dailyRecord.id}
                        date={dailyRecord.date}
                        previousClosingCash={0}
                        previousClosingUpi={0}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
}
