'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { Lock, FileCheck, Eye, Download } from 'lucide-react';
import { createClientBrowser } from '@/lib/supabase-client';

export default function MonthEndPage() {
    const { user } = useAuth();
    const supabase = createClientBrowser();
    const isAdmin = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAdmin) {
            fetchSnapshots();
        }
    }, [isAdmin]);

    const fetchSnapshots = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('monthly_closure_snapshots')
                .select(`
                    id, 
                    month_date, 
                    version, 
                    created_at,
                    outlets (name)
                `)
                .order('month_date', { ascending: false });

            if (!error && data) {
                setSnapshots(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div>Loading...</div>;

    if (!isAdmin) {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
                <TopBar title="Month-End Close Report" />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                        <Lock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            This report is only available to Head Office Accountants and Administrators.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <TopBar title="Month-End Close Report" />

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Monthly Closures</h2>
                        <p className="text-gray-600">Track standardized monthly closure snapshots.</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center text-gray-500">Loading snapshots...</div>
                        ) : snapshots.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <FileCheck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p>No monthly closure snapshots found.</p>
                                <p className="text-xs text-gray-400 mt-1">Snapshots are generated automatically when a month is locked.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 font-medium text-gray-500">Month</th>
                                        <th className="px-6 py-3 font-medium text-gray-500">Outlet</th>
                                        <th className="px-6 py-3 font-medium text-gray-500">Version</th>
                                        <th className="px-6 py-3 font-medium text-gray-500">Created At</th>
                                        <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {snapshots.map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                {new Date(s.month_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                                            </td>
                                            <td className="px-6 py-4">{s.outlets?.name || 'Unknown Outlet'}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">v{s.version}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date(s.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => alert(`Raw Data: ${JSON.stringify(s.snapshot || {})}`)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-end gap-1"
                                                >
                                                    <Eye className="w-4 h-4" /> View Data
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
