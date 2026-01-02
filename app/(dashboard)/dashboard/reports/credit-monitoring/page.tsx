'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { useQuery } from '@tanstack/react-query';
import { Download, AlertTriangle } from 'lucide-react';

export default function CreditMonitoringPage() {
    const supabase = createClientBrowser();
    const { user } = useAuth();
    const isAdmin = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');

    // Fetch customers approaching credit limit
    const { data: customers, isLoading } = useQuery({
        queryKey: ['credit-monitoring', user?.profile?.outlet_id],
        queryFn: async () => {
            let query = (supabase as any)
                .from('customers')
                .select('*')
                .gt('outstanding_balance', 0);

            if (!isAdmin && user?.profile?.outlet_id) {
                const { data, error } = await (supabase as any)
                    .from('customers')
                    .select(`
                        *,
                        profiles!customers_added_by_fkey(outlet_id)
                    `)
                    .gt('outstanding_balance', 0);

                if (error) throw error;
                return (data || []).filter((c: any) => c.profiles?.outlet_id === user.profile.outlet_id);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        enabled: !!user
    });

    // Filter high utilization customers
    const highUtilization = customers?.filter(c => {
        const utilization = c.credit_limit > 0 ? (c.outstanding_balance / c.credit_limit) * 100 : 0;
        return utilization >= 80;
    }).sort((a, b) => {
        const aUtil = (a.outstanding_balance / a.credit_limit) * 100;
        const bUtil = (b.outstanding_balance / b.credit_limit) * 100;
        return bUtil - aUtil;
    }) || [];

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <TopBar title="Credit Limit Monitoring" />

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Alert Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-red-200 dark:border-red-900/50">
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertTriangle className="w-4 h-4" />
                                Critical ({'>'}100%)
                            </div>
                            <div className="text-2xl font-bold mt-2 text-red-600">
                                {highUtilization.filter(c => (c.outstanding_balance / c.credit_limit) * 100 >= 100).length}
                            </div>
                            <div className="text-sm text-red-500 mt-1">Limit exceeded</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-orange-200 dark:border-orange-900/50">
                            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                                <AlertTriangle className="w-4 h-4" />
                                Warning (80-100%)
                            </div>
                            <div className="text-2xl font-bold mt-2 text-orange-600">
                                {highUtilization.filter(c => {
                                    const util = (c.outstanding_balance / c.credit_limit) * 100;
                                    return util >= 80 && util < 100;
                                }).length}
                            </div>
                            <div className="text-sm text-orange-500 mt-1">Approaching limit</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-800">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Monitored</div>
                            <div className="text-2xl font-bold mt-2">{customers?.length || 0}</div>
                            <div className="text-sm text-gray-500 mt-1">With credit</div>
                        </div>
                    </div>

                    {/* High Utilization Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-6 py-4 border-b dark:border-slate-700">
                            <h3 className="text-lg font-semibold">High Utilization Customers (≥80%)</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800 border-b dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Outstanding</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Limit</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Utilization</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Alert</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading...</td>
                                        </tr>
                                    ) : highUtilization.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                                No customers with high credit utilization
                                            </td>
                                        </tr>
                                    ) : (
                                        highUtilization.map(c => {
                                            const utilization = (c.outstanding_balance / c.credit_limit) * 100;
                                            const isCritical = utilization >= 100;
                                            return (
                                                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{c.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold">
                                                        ₹{c.outstanding_balance.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500">
                                                        ₹{c.credit_limit.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${isCritical ? 'text-red-600' : 'text-orange-600'
                                                        }`}>
                                                        {utilization.toFixed(1)}%
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {isCritical ? (
                                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                                🔴 Critical
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                                                🟡 Warning
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
