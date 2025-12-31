'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { TransactionForm } from '@/components/transaction-form';
import { TransactionList } from '@/components/transaction-list';
import { LiveBalance } from '@/components/live-balance';
import { DailyRecordActions } from '@/components/daily-record-actions';
import { OpeningBalanceModal } from '@/components/opening-balance-modal';
import { TransactionSummary } from '@/components/transaction-summary';
import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { PresenceIndicator } from '@/components/presence-indicator';
import { ChatRoom } from '@/components/chat-room';
import { AnnotationsPanel } from '@/components/annotations-panel';
import { useRealtimeDailyRecords, useRealtimeTransactions } from '@/hooks/use-realtime';

export default function StaffDashboard() {
    const { user } = useAuth();
    const [showOpeningModal, setShowOpeningModal] = useState(false);

    // Get today's daily record
    const { data: dailyRecord, isLoading: recordLoading, isError: recordError, error, refetch: refetchRecord } = useQuery({
        queryKey: ['daily-record-today'],
        queryFn: async () => {
            const res = await fetch('/api/daily-records/today');
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                // If profile missing, retry once after a short delay (self-healing)
                if (errorData.code === 'PROFILE_MISSING') {
                     throw new Error('User profile incomplete. Please contact admin.');
                }
                throw new Error(errorData.error || 'Failed to fetch daily record');
            }
            return res.json();
        },
        staleTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        retry: 1
    });

    // Fetch outlet information
    const { data: outlet } = useQuery({
        queryKey: ['outlet', user?.profile?.outlet_id],
        queryFn: async () => {
            if (!user?.profile?.outlet_id) return null;
            const res = await fetch(`/api/outlets?id=${user.profile.outlet_id}`);
            if (!res.ok) return null;
            const outlets = await res.json();
            return outlets[0] || null;
        },
        enabled: !!user?.profile?.outlet_id,
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

    const { status: drRt } = useRealtimeDailyRecords(user?.profile?.outlet_id || null, () => {
        window.location.reload();
    });
    const { status: trRt } = useRealtimeTransactions(dailyRecord?.id || null, () => {
        window.location.reload();
    });

    return (
        <ProtectedRoute allowedRoles={['outlet_staff', 'outlet_manager']}>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
                    <p className="text-gray-600 mt-2">Welcome, {user?.profile?.name}</p>
                    <div className="mt-2 text-xs text-gray-600">
                        <span className={`px-2 py-1 rounded-full ${drRt === 'online' ? 'bg-green-100 text-green-800' : drRt === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>Records: {drRt}</span>
                        <span className={`ml-2 px-2 py-1 rounded-full ${trRt === 'online' ? 'bg-green-100 text-green-800' : trRt === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>Transactions: {trRt}</span>
                    </div>
                    {outlet && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                                {outlet.name} ({outlet.code})
                            </span>
                        </div>
                    )}
                    <div className="mt-2">
                        <PresenceIndicator outletId={user?.profile?.outlet_id || null} />
                    </div>
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
                        {recordError ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                                <p className="text-red-700 font-medium">Failed to load daily record</p>
                                <p className="text-red-600 text-sm mt-1">{error instanceof Error ? error.message : 'Please ensure your user is assigned to an outlet.'}</p>
                                <button 
                                    onClick={() => {
                                        window.location.reload(); 
                                        refetchRecord();
                                    }} 
                                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                                >
                                    Retry Loading
                                </button>
                            </div>
                        ) : dailyRecord ? (
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                        <div>
                            <TransactionSummary dailyRecordId={dailyRecord.id} />
                        </div>
                        <div>
                            <TransactionList dailyRecordId={dailyRecord.id} />
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ChatRoom outletId={user?.profile?.outlet_id || null} />
                                <AnnotationsPanel outletId={user?.profile?.outlet_id || null} pageKey="staff" />
                            </div>
                        </div>
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
        </ProtectedRoute >
    );
}
