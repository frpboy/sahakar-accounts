'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { ReportFilters } from '@/components/dashboard/reports/report-filters';
import { ReportTable } from '@/components/dashboard/reports/report-table';
import { createClientBrowser } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';
import { UserCog, History as HistoryIcon, ShieldCheck, Search, Filter, FileSpreadsheet, FileText, ShoppingCart, UserPlus, File, RefreshCcw } from 'lucide-react';
import { exportUtils } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function UserActivityPage() {
    const supabase = createClientBrowser();
    const { user } = useAuth();

    // Filters
    const today = new Date().toISOString().split('T')[0];
    const [dateRange, setDateRange] = useState({ from: today, to: today });
    const [outletId, setOutletId] = useState('all');
    const [userId, setUserId] = useState('all');

    const [users, setUsers] = useState<any[]>([]);
    const [outlets, setOutlets] = useState<any[]>([]);

    // Data
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isHO = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Load users and outlets for filters
            if (isHO) {
                if (users.length === 0) {
                    const { data: uData } = await (supabase as any).from('users').select('id, name, email').order('name');
                    setUsers(uData || []);
                }
                if (outlets.length === 0) {
                    const { data: oData } = await (supabase as any).from('outlets').select('id, name');
                    setOutlets(oData || []);
                }
            }

            // 2. Query audit_logs
            let query = (supabase as any)
                .from('audit_logs')
                .select('*, users(name, email), outlets(name)')
                .gte('created_at', `${dateRange.from}T00:00:00`)
                .lte('created_at', `${dateRange.to}T23:59:59`)
                .order('created_at', { ascending: false });

            if (userId !== 'all') {
                query = query.eq('user_id', userId);
            }
            if (outletId !== 'all') {
                query = query.eq('outlet_id', outletId);
            } else if (!isHO && user?.profile?.outlet_id) {
                query = query.eq('outlet_id', user.profile.outlet_id);
            }

            const { data, error } = await query;
            if (error) throw error;

            setLogs(data || []);

        } catch (err) {
            console.error('Error loading audit logs:', err);
        } finally {
            setLoading(false);
        }
    }, [dateRange, outletId, userId, isHO, user, supabase, users.length, outlets.length]);

    const handleExportExcel = () => {
        const data = logs.map(l => ({
            'Timestamp': new Date(l.created_at).toLocaleString(),
            'User': l.users?.name || 'Unknown',
            'Email': l.users?.email || '-',
            'Action': l.action,
            'Entity': l.entity_type,
            'Details': JSON.stringify(l.details || l.entity_id).substring(0, 150),
            'Outlet': l.outlets?.name || '-'
        }));

        exportUtils.toExcel(data, {
            filename: `Audit_Log_${dateRange.from}`,
            title: 'User Activity Audit Log'
        });
    };

    const handleExportPDF = () => {
        const data = logs.map(l => [
            new Date(l.created_at).toLocaleTimeString(),
            l.users?.name || 'Unknown',
            l.action,
            l.entity_type,
            l.outlets?.name || '-'
        ]);

        exportUtils.toPDF(
            ['Time', 'User', 'Action', 'Resource', 'Outlet'],
            data,
            {
                filename: `Audit_Log_${dateRange.from}`,
                title: 'Sahakar Accounts - User Activity Log',
                subtitle: `Date: ${dateRange.from} | Exported by: ${user?.profile?.name}`
            }
        );
    };

    useEffect(() => {
        if (user) loadData();
    }, [user, loadData]);

    const columns = [
        {
            header: 'Date & Time',
            accessor: (l: any) => (
                <div className="text-xs font-mono text-gray-500 whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    })}
                </div>
            )
        },
        {
            header: 'User',
            accessor: (l: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white">{l.users?.name || 'Unknown'}</span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">{l.users?.email}</span>
                </div>
            )
        },
        {
            header: 'Action',
            accessor: (l: any) => (
                <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight",
                    l.action === 'CREATE' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        l.action === 'UPDATE' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                            l.action === 'DELETE' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400"
                )}>
                    {l.action}
                </span>
            )
        },
        {
            header: 'Resource / Detail',
            accessor: (l: any) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-tighter">{l.entity_type}</span>
                    <p className="text-xs text-gray-500 dark:text-slate-500 truncate max-w-xs">{JSON.stringify(l.details || l.entity_id).substring(0, 100)}</p>
                </div>
            )
        },
        {
            header: 'Outlet',
            accessor: (l: any) => l.outlets?.name || '-',
            className: isHO ? '' : 'hidden'
        }
    ];

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
            <TopBar title="User Activity Log" />

            <main className="p-4 lg:p-6 space-y-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        href="/dashboard/sales"
                        className="bg-white dark:bg-slate-900 p-6 rounded-xl border dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 group"
                    >
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full group-hover:scale-110 transition-transform">
                            <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">New Sale</span>
                    </Link>

                    <Link
                        href="/dashboard/returns?type=sales"
                        className="bg-white dark:bg-slate-900 p-6 rounded-xl border dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 group"
                    >
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-full group-hover:scale-110 transition-transform">
                            <RefreshCcw className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">Sales Return</span>
                    </Link>

                    <Link
                        href="/dashboard/customers"
                        className="bg-white dark:bg-slate-900 p-6 rounded-xl border dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 group"
                    >
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full group-hover:scale-110 transition-transform">
                            <UserPlus className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">Add Customer</span>
                    </Link>

                    <Link
                        href="/dashboard/drafts"
                        className="bg-white dark:bg-slate-900 p-6 rounded-xl border dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 group"
                    >
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full group-hover:scale-110 transition-transform">
                            <File className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">View Drafts</span>
                    </Link>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5 flex-1 min-w-[150px]">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase">Date</label>
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange({ from: e.target.value, to: e.target.value })}
                                className="block w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-md text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {isHO && (
                            <>
                                <div className="space-y-1.5 min-w-[180px]">
                                    <label className="text-xs font-bold text-gray-500 uppercase">User</label>
                                    <select
                                        value={userId}
                                        onChange={(e) => setUserId(e.target.value)}
                                        className="block w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-md text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Users</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5 min-w-[180px]">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Outlet</label>
                                    <select
                                        value={outletId}
                                        onChange={(e) => setOutletId(e.target.value)}
                                        className="block w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-md text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Outlets</option>
                                        {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        <button
                            onClick={loadData}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                        >
                            <Search className="w-4 h-4" />
                            Filter Logs
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-red-600 dark:text-red-400" />
                            System Audit Trail
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/10 transition-all shadow-sm"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Excel
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-all shadow-sm"
                            >
                                <FileText className="w-4 h-4" />
                                PDF
                            </button>
                        </div>
                    </div>

                    <ReportTable
                        columns={columns}
                        data={logs}
                        loading={loading}
                        emptyMessage="No activity logs found for this criteria."
                    />
                </div>
            </main>
        </div>
    );
}
