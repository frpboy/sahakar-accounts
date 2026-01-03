'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import {
    IndianRupee,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    Lock,
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
    const [calculatedBalances, setCalculatedBalances] = useState({ cash: 0, bank: 0 });

    const roleDescription = getEditWindowDescription(user?.profile?.role || '');

    const loadLedgerStats = useCallback(async () => {
        if (!user?.profile.outlet_id) return;
        setLoading(true);
        try {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            const startStr = `${startOfMonth.toISOString().split('T')[0]}T07:00:00`;

            const { data, error } = await (supabase as any)
                .from('transactions')
                .select('type, amount, payment_modes')
                .eq('outlet_id', user.profile.outlet_id)
                .gte('created_at', startStr);

            if (error) throw error;

            let dr = 0, cr = 0, cash = 0, bank = 0;
            data?.forEach((t: any) => {
                const amt = Number(t.amount);
                if (t.type === 'income') cr += amt;
                else dr += amt;

                const isIncome = t.type === 'income';
                if (t.payment_modes === 'Cash') cash += isIncome ? amt : -amt;
                else if (['UPI', 'Card', 'Bank Transfer'].includes(t.payment_modes)) bank += isIncome ? amt : -amt;
            });

            const { count: lockedCount } = await (supabase as any)
                .from('day_locks')
                .select('*', { count: 'exact', head: true })
                .eq('outlet_id', user.profile.outlet_id)
                .eq('status', 'locked');

            setStats({
                totalDebit: dr,
                totalCredit: cr,
                unbalancedDays: 0,
                lockedDays: lockedCount || 0
            });
            setCalculatedBalances({ cash, bank });

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    useEffect(() => {
        loadLedgerStats();
    }, [loadLedgerStats]);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Ledger Dashboard" />

            <div className="flex-1 overflow-auto p-6 space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-sm text-gray-500 hidden md:inline">
                        Edit Window: <span className="font-semibold text-blue-600">{roleDescription}</span>
                    </span>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export Snapshot
                    </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Monthly Exp (Dr)"
                        value={`₹${stats.totalDebit.toLocaleString()}`}
                        icon={<ArrowUpRight className="w-4 h-4" />}
                        trendValue={`${stats.lockedDays} Locked Days`}
                        trend="neutral"
                    />
                    <MetricCard
                        title="Monthly Rev (Cr)"
                        value={`₹${stats.totalCredit.toLocaleString()}`}
                        icon={<ArrowDownRight className="w-4 h-4" />}
                        trendValue="Synced"
                        trend="neutral"
                    />
                    <MetricCard
                        title="Cash in Hand"
                        value={`₹${calculatedBalances.cash.toLocaleString()}`}
                        icon={<IndianRupee className="w-4 h-4" />}
                        trendValue="Live Balance"
                        trend={calculatedBalances.cash >= 0 ? "up" : "down"}
                    />
                    <MetricCard
                        title="Bank/UPI Bal"
                        value={`₹${calculatedBalances.bank.toLocaleString()}`}
                        icon={<IndianRupee className="w-4 h-4" />}
                        trendValue="Digital Vault"
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
