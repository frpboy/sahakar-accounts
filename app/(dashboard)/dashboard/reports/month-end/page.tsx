'use client';

import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { Lock } from 'lucide-react';

export default function MonthEndPage() {
    const { user } = useAuth();
    const isAdmin = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');

    if (!user) {
        return <div>Loading...</div>;
    }

    // Access control - HO only
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
                <div className="max-w-7xl mx-auto">
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-8 text-center">
                        <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Month-End Close Report with reconciliation tracking and approval workflow
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
