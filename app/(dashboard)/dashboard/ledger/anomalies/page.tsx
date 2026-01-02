'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { ShieldAlert, Zap, Clock, Users, ChevronRight, AlertTriangle, Info, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AnomalyDashboardPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [anomalies, setAnomalies] = useState<any[]>([]);

    const loadAnomalies = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch anomalies from DB (Rules Engine populated)
            const { data, error } = await (supabase as any)
                .from('anomalies')
                .select('*, outlets(name), users:assigned_to(name)')
                .order('detected_at', { ascending: false });

            if (error) throw error;
            setAnomalies(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        loadAnomalies();
    }, [loadAnomalies]);

    const stats = useMemo(() => {
        return {
            critical: anomalies.filter(a => a.severity === 'critical' && a.status === 'open').length,
            warning: anomalies.filter(a => a.severity === 'warning').length,
            info: anomalies.filter(a => a.severity === 'info').length
        };
    }, [anomalies]);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Fraud & Anomaly Signals (Blueprint 4)" />

            <div className="p-6 overflow-auto">
                <div className="max-w-7xl mx-auto">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                        <AnomalyStatCard
                            title="Critical Signals"
                            count={stats.critical}
                            color="red"
                            icon={<ShieldAlert className="w-6 h-6" />}
                            desc="High fraud risk"
                        />
                        <AnomalyStatCard
                            title="Policy Warnings"
                            count={stats.warning}
                            color="amber"
                            icon={<AlertTriangle className="w-6 h-6" />}
                            desc="Process violations"
                        />
                        <AnomalyStatCard
                            title="Temporal Shifts"
                            count={stats.info}
                            color="blue"
                            icon={<Clock className="w-6 h-6" />}
                            desc="Midnight activity"
                        />
                        <div className="bg-gray-900 rounded-3xl p-6 text-white flex flex-col justify-between shadow-xl">
                            <Zap className="w-8 h-8 text-yellow-400 opacity-50" />
                            <div>
                                <h3 className="text-sm font-bold opacity-75">Rules Active</h3>
                                <p className="text-3xl font-black">12</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Feed */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-gray-400" />
                                    Live Anomaly Feed
                                </h2>
                                <Button variant="ghost" size="sm">History ▶</Button>
                            </div>

                            <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {loading ? (
                                        <div className="p-20 text-center animate-pulse">Scanning Ledger for Anomalies...</div>
                                    ) : anomalies.length === 0 ? (
                                        <div className="p-20 text-center text-gray-400 italic">No suspicious behavior detected. System healthy.</div>
                                    ) : (
                                        anomalies.map((a) => (
                                            <AnomalyRow key={a.id} anomaly={a} />
                                        ))
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Rules Engine Quick-Config */}
                        <div className="space-y-6">
                            <Card className="rounded-3xl border-none shadow-xl bg-white dark:bg-gray-800">
                                <CardHeader className="border-b">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-400">Rules Engine (Thresholds)</CardTitle>
                                    <CardDescription>Adjust detection sensitivity</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6 font-medium">
                                    <RuleConfigItem label="Cash Sale Spike" value="₹50,000" />
                                    <RuleConfigItem label="Daily Reversal Limit" value="3 Entries" />
                                    <RuleConfigItem label="Midnight Window" value="00:01 - 06:59" />
                                    <RuleConfigItem label="Refund/Sale Ratio" value="> 15%" />
                                    <Button className="w-full mt-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200">
                                        Update Thresholds
                                    </Button>
                                </CardContent>
                            </Card>

                            <div className="p-6 bg-gradient-to-br from-red-600 to-red-800 rounded-3xl text-white shadow-xl shadow-red-500/20">
                                <h3 className="font-black text-lg mb-2">Audit Lock Trigger</h3>
                                <p className="text-sm opacity-80 mb-6">3 consecutive critical anomalies will auto-lock the outlet ledger pending review.</p>
                                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white w-1/3" />
                                </div>
                                <p className="text-[10px] mt-2 font-bold opacity-60">Currently: 1/3 (Safe)</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

function AnomalyStatCard({ title, count, color, icon, desc }: any) {
    const variants = {
        red: "bg-red-50 text-red-600",
        amber: "bg-amber-50 text-amber-600",
        blue: "bg-blue-50 text-blue-600"
    };
    return (
        <Card className="rounded-3xl border-none shadow-xl">
            <CardContent className="p-6">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", variants[color as keyof typeof variants])}>
                    {icon}
                </div>
                <h3 className="text-sm font-bold text-gray-500 uppercase">{title}</h3>
                <p className="text-3xl font-black">{count}</p>
                <p className="text-[10px] text-gray-400 mt-1">{desc}</p>
            </CardContent>
        </Card>
    );
}

function AnomalyRow({ anomaly }: { anomaly: any }) {
    return (
        <div className="p-6 flex items-start justify-between hover:bg-gray-50 transition-colors group">
            <div className="flex items-start gap-4">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    anomaly.severity === 'critical' ? "bg-red-100 text-red-600" :
                        anomaly.severity === 'warning' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                )}>
                    {anomaly.severity === 'critical' ? <ShieldAlert className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{anomaly.title}</span>
                        <span className={cn(
                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded",
                            anomaly.status === 'open' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-400"
                        )}>{anomaly.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{anomaly.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {format(new Date(anomaly.detected_at), 'HH:mm')} • {anomaly.outlets?.name || 'Global'}
                        </span>
                        {anomaly.users?.name && (
                            <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                <Users className="w-3 h-3" /> {anomaly.users.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <Button size="icon" variant="ghost" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5" />
            </Button>
        </div>
    );
}

function RuleConfigItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-xs text-gray-600">{label}</span>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{value}</span>
        </div>
    );
}

function Activity(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}
