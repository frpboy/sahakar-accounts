'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { detectAnomalies, Anomaly } from '@/lib/anomaly-detection';
import { AlertTriangle, AlertCircle, Info, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AnomaliesPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAnomalies = async () => {
        if (!user?.profile?.outlet_id) return;
        setLoading(true);
        try {
            const results = await detectAnomalies(supabase, user.profile.outlet_id);
            setAnomalies(results);
        } catch (error) {
            console.error('Failed to fetch anomalies:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnomalies();
    }, [user]);

    const stats = {
        high: anomalies.filter(a => a.severity === 'high').length,
        medium: anomalies.filter(a => a.severity === 'medium').length,
        low: anomalies.filter(a => a.severity === 'low').length,
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <TopBar title="Anomaly Detection" />

            <div className="p-6 max-w-7xl mx-auto w-full space-y-6">

                {/* Header Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-blue-600" />
                            System Health Check
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 mt-2 max-w-xl">
                            We automatically scan your transaction history for unusual patterns, potential errors, or compliance risks.
                            Regularly review these items to ensure accounting accuracy.
                        </p>
                    </div>
                    <button
                        onClick={fetchAnomalies}
                        disabled={loading}
                        className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-bold hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Scanning...' : 'Scan Now'}
                    </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-6 rounded-xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">High Risk Issues</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.high}</p>
                        </div>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-6 rounded-xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Medium Warnings</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.medium}</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-6 rounded-xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <Info className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Low Priority</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.low}</p>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b dark:border-slate-800">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Detected Anomalies</h3>
                    </div>

                    {anomalies.length === 0 && !loading && (
                        <div className="p-12 text-center">
                            <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">All Clear!</h4>
                            <p className="text-gray-500">No anomalies detected in your recent data.</p>
                        </div>
                    )}

                    {loading && anomalies.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            Analyzing transaction patterns...
                        </div>
                    )}

                    <div className="divide-y dark:divide-slate-800">
                        {anomalies.map((anomaly) => (
                            <div key={anomaly.id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${anomaly.severity === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                                                anomaly.severity === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                                            }`} />
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-gray-900 dark:text-white font-bold text-lg">
                                                    {anomaly.type === 'post_lock_edit' ? 'Locked Day Modification' :
                                                        anomaly.type === 'zero_cash_day' ? 'Zero Cash Sales' :
                                                            anomaly.type === 'high_credit_day' ? 'Unusual Credit Volume' :
                                                                'Anomaly Detected'}
                                                </h4>
                                                <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wide ${anomaly.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        anomaly.severity === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {anomaly.severity} Priority
                                                </span>
                                            </div>
                                            <p className="text-gray-600 dark:text-slate-300 mb-2">
                                                {anomaly.description}
                                            </p>
                                            <div className="text-sm text-gray-400 flex items-center gap-4">
                                                <span>Date: {new Date(anomaly.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                {/* Optional: Add link to verify if possible */}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Link
                                            href={`/dashboard/reports/transactions?date=${anomaly.date}`}
                                            className="px-4 py-2 bg-white dark:bg-slate-800 border dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-blue-600 transition-colors"
                                        >
                                            Investigate
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
