'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import {
    IndianRupee,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    Lock,
    Unlock,
    FileText,
    Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/dashboard/metrics/metric-card';
import { getEditWindowDescription } from '@/lib/ledger-logic';
import { cn } from '@/lib/utils';

export default function LedgerDashboardPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalDebit: 0,
        totalCredit: 0,
        unbalancedDays: 0,
        lockedDays: 0
    });

    const roleDescription = getEditWindowDescription(user?.profile?.role || '');

    useEffect(() => {
        loadLedgerStats();
    }, [user]);

    const loadLedgerStats = async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        // Placeholder logic for stats - in real impl, query aggregate views
        // For now, fetching simple transaction sums for "This Month"
        try {
            // Fetch simplified stats
            // ... implementation pending deeper queries
            setStats({
                totalDebit: 0, // Placeholder
                totalCredit: 0,
                unbalancedDays: 0,
                lockedDays: 0
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Ledger Dashboard">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 hidden md:inline">
                        Edit Window: <span className="font-semibold text-blue-600">{roleDescription}</span>
                    </span>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export Snapshot
                    </Button>
                </div>
            </TopBar>

            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Debits (Month)"
                        value={`₹${stats.totalDebit.toLocaleString()}`}
                        icon={ArrowUpRight}
                        change="0%"
                        trend="neutral"
                    />
                    <MetricCard
                        title="Total Credits (Month)"
                        value={`₹${stats.totalCredit.toLocaleString()}`}
                        icon={ArrowDownRight}
                        change="0%"
                        trend="neutral"
                    />
                    <MetricCard
                        title="Cash Balance"
                        value="₹0" // Needs real fetching
                        icon={IndianRupee}
                        change="Calcuated"
                        trend="up"
                    />
                    <MetricCard
                        title="Bank / UPI"
                        value="₹0"
                        icon={IndianRupee}
                        change="Estimated"
                        trend="neutral"
                    />
                </div>

                {/* Status Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Account Health
                        </h3>
                        {stats.unbalancedDays > 0 ? (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                                ⚠️ <strong>{stats.unbalancedDays} Days</strong> have unbalanced internal records.
                            </div>
                        ) : (
                            <div className="p-4 bg-green-50 text-green-700 rounded-lg">
                                ✅ All processed days are balanced.
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-gray-500" />
                            Lock Status
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                            Transactions older than <strong>{roleDescription}</strong> are strictly Read-Only for your role.
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <p className="text-xs text-right mt-1 text-gray-500">System Enforcement Active</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
