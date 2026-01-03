'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { MetricCard } from '@/components/dashboard/metrics/metric-card';
import {
    Scale,
    BookOpen,
    AlertTriangle,
    FileText,
    TrendingUp,
    History,
    Search,
    IndianRupee,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function AuditorDashboard() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();

    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        anomaliesCount: 0,
        pendingClosures: 0,
        outletsCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAuditData = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];

                // 1. Total Revenue Today (Global or Outlet specific)
                let txQuery = supabase.from('transactions').select('amount').eq('category', 'sales').gte('created_at', today);
                if (user?.profile?.outlet_id) {
                    txQuery = txQuery.eq('outlet_id', user.profile.outlet_id);
                }
                const { data: revData } = await txQuery;
                const totalRev = revData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

                // 2. Anomalies
                const { count: anomalies } = await (supabase as any)
                    .from('anomalies' as any)
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'detected');

                // 3. Pending Closures (Open business days relative to yesterday)
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                const { count: pending } = await supabase
                    .from('daily_records')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'open')
                    .lte('date', yesterdayStr);

                // 4. Outlets Count
                const { count: outlets } = await supabase
                    .from('outlets')
                    .select('*', { count: 'exact', head: true });

                setMetrics({
                    totalRevenue: totalRev,
                    anomaliesCount: anomalies || 0,
                    pendingClosures: pending || 0,
                    outletsCount: outlets || 0
                });

            } catch (error) {
                console.error('Audit Load Error:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAuditData();
    }, [user, supabase]);

    const auditActions = [
        { label: 'Trial Balance', href: '/dashboard/ledger/trial-balance', icon: <Scale className="w-5 h-5" />, color: 'bg-emerald-600', description: 'Check ledger equilibrium' },
        { label: 'Day Book', href: '/dashboard/ledger/day-book', icon: <BookOpen className="w-5 h-5" />, color: 'bg-blue-600', description: 'Review daily chronologies' },
        { label: 'Anomaly Logs', href: '/dashboard/ledger/anomalies', icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-rose-600', description: 'Review risk flags' },
        { label: 'Audit Logs', href: '/dashboard/ledger/export', icon: <FileText className="w-5 h-5" />, color: 'bg-slate-700', description: 'Export for external audit' },
    ];

    if (loading) {
        return <div className="p-20 text-center animate-pulse text-slate-400 font-bold">Initializing Auditor Secure View...</div>;
    }

    return (
        <div className="p-8 space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">Auditor Command Center</h1>
                <p className="text-slate-500 font-medium mt-1">Institutional Integrity & Compliance Overview</p>
            </div>

            {/* Audit Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                    title="Global Revenue (Today)"
                    value={`₹${metrics.totalRevenue.toLocaleString()}`}
                    subtitle="Sales income"
                    icon={<IndianRupee className="w-5 h-5 text-emerald-600" />}
                />
                <MetricCard
                    title="Risk Anomalies"
                    value={metrics.anomaliesCount}
                    subtitle="Detected flags"
                    trend={metrics.anomaliesCount > 0 ? 'down' : 'neutral'}
                    icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
                />
                <MetricCard
                    title="Open Days (Delayed)"
                    value={metrics.pendingClosures}
                    subtitle="Awaiting closure"
                    icon={<History className="w-5 h-5 text-amber-600" />}
                />
                <MetricCard
                    title="Tracked Outlets"
                    value={metrics.outletsCount}
                    subtitle="Auditable units"
                    icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
                />
            </div>

            {/* Audit Quick Links */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-6 bg-slate-900 dark:bg-slate-400 rounded-full" />
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                        Core Audit Controls
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {auditActions.map((action) => (
                        <Link
                            key={action.label}
                            href={action.href}
                            className="group bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col items-start gap-4"
                        >
                            <div className={cn("p-4 rounded-2xl text-white shadow-lg", action.color)}>
                                {action.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">{action.label}</h3>
                                <p className="text-xs text-slate-500 mt-1">{action.description}</p>
                            </div>
                            <div className="mt-auto pt-4 flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                                Access Portal <ArrowRight className="w-3 h-3" />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Compliance Banner */}
            <div className="bg-slate-900 dark:bg-slate-950 rounded-[40px] p-10 text-white relative overflow-hidden group border border-slate-800 shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                            <Scale className="w-3 h-3" /> System Integrity Rule
                        </div>
                        <h2 className="text-4xl font-black mb-4 leading-tight">Auditor View Restricted</h2>
                        <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
                            You are in <span className="text-blue-400 font-bold">Institutional Auditor Mode</span>. Transactional creation and mutation are strictly disabled to prevent conflicts of interest. All ledger movements are traceable via the append-only audit trail.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl">
                            <Search className="w-10 h-10 text-blue-400" />
                        </div>
                    </div>
                </div>
                {/* Visual decorations */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />
            </div>
        </div>
    );
}
