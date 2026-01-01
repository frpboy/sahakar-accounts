'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { createClientBrowser } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';
import { AlertTriangle, CheckCircle2, ShieldAlert, Eye, Filter, RefreshCw, History as HistoryIcon, IndianRupee } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/metrics/metric-card';
import { ReportTable } from '@/components/dashboard/reports/report-table';
import { cn } from '@/lib/utils';

export default function AnomaliesPage() {
    const supabase = createClientBrowser();
    const { user } = useAuth();

    const [anomalies, setAnomalies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        critical: 0,
        open: 0,
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('anomalies')
                .select('*, outlets(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const items = data || [];
            setAnomalies(items);

            setStats({
                total: items.length,
                critical: items.filter((a: any) => a.severity === 'critical').length,
                open: items.filter((a: any) => a.status === 'open').length,
            });

        } catch (err) {
            console.error('Error loading anomalies:', err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        if (user) loadData();
    }, [user, loadData]);

    const handleAcknowledge = async (id: string) => {
        try {
            const { error } = await (supabase as any)
                .from('anomalies')
                .update({ status: 'acknowledged' })
                .eq('id', id);

            if (error) throw error;
            loadData();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const columns = [
        {
            header: 'Detected',
            accessor: (a: any) => new Date(a.detected_at || a.created_at).toLocaleDateString()
        },
        {
            header: 'Severity',
            accessor: (a: any) => (
                <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    a.severity === 'critical' ? "bg-red-100 text-red-700" :
                        a.severity === 'warning' ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                )}>
                    {a.severity}
                </span>
            )
        },
        {
            header: 'Outlet',
            accessor: (a: any) => a.outlets?.name || 'All'
        },
        {
            header: 'Issue',
            accessor: (a: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900">{a.title}</span>
                    <p className="text-xs text-gray-500 max-w-sm">{a.description}</p>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: (a: any) => (
                <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-medium",
                    a.status === 'open' ? "bg-red-50 text-red-600 border border-red-100" :
                        a.status === 'acknowledged' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                            "bg-green-50 text-green-600 border border-green-100"
                )}>
                    {a.status}
                </span>
            )
        },
        {
            header: 'Action',
            accessor: (a: any) => (
                <div className="flex items-center gap-2">
                    {a.status === 'open' && (
                        <button
                            onClick={() => handleAcknowledge(a.id)}
                            className="p-1 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                            title="Acknowledge"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        className="p-1 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
            <TopBar title="Anomaly Detection" />

            <main className="p-4 lg:p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-red-600" />
                            Anomaly Review Center
                        </h1>
                        <p className="text-sm text-gray-500">Review system-flagged suspicious activities</p>
                    </div>
                    <button
                        onClick={loadData}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md text-sm hover:bg-gray-50"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        title="Total Flags"
                        value={stats.total.toString()}
                        icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
                    />
                    <MetricCard
                        title="Critical Issues"
                        value={stats.critical.toString()}
                        icon={<ShieldAlert className="w-5 h-5 text-red-600" />}
                    />
                    <MetricCard
                        title="Open for Review"
                        value={stats.open.toString()}
                        icon={<HistoryIcon className="w-5 h-5 text-blue-600" />}
                    />
                </div>

                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Recent Flags</h3>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Filter: All</span>
                        </div>
                    </div>

                    <ReportTable
                        columns={columns}
                        data={anomalies}
                        loading={loading}
                        emptyMessage="No anomalies detected. System is running cleanly."
                    />
                </div>
            </main>
        </div>
    );
}