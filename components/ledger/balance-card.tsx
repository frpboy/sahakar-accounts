import React from 'react';
import { Lock, AlertTriangle, TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetricCard } from '@/components/dashboard/metrics/metric-card';

interface BalanceCardProps {
    closingBalance: number;
    cash: number;
    bank: number;
    credit: number;
    lastLockedDate: string | Date; // '2026-01-01'
    isBalanced?: boolean; // Default true
}

export function BalanceCard({
    closingBalance,
    cash,
    bank,
    credit,
    lastLockedDate,
    isBalanced = true
}: BalanceCardProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Main Closing Balance */}
            <div className={cn(
                "md:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between",
                !isBalanced && "from-amber-500 to-amber-600"
            )}>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-blue-100 font-medium text-sm uppercase tracking-wider">Closing Balance</p>
                        <h2 className="text-3xl font-bold mt-1 font-mono">₹{closingBalance.toLocaleString()}</h2>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">
                        <IndianRupee className="w-6 h-6 text-white" />
                    </div>
                </div>

                {!isBalanced && (
                    <div className="mt-4 flex items-center gap-2 bg-red-900/30 p-2 rounded text-xs font-bold text-white border border-red-400/50">
                        <AlertTriangle className="w-4 h-4" />
                        Ledger Imbalance Detected
                    </div>
                )}
            </div>

            {/* Breakdown */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-4 font-bold">Breakdown</p>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Cash</span>
                        <span className="font-mono font-medium">₹{cash.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Bank / UPI</span>
                        <span className="font-mono font-medium">₹{bank.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Credit</span>
                        <span className="font-mono font-medium">₹{credit.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Lock Status */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700 flex flex-col justify-center items-center text-center">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full mb-3">
                    <Lock className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-xs text-gray-400 uppercase font-bold">Last Locked Day</p>
                <p className="text-lg font-bold text-gray-800 dark:text-white mt-1">
                    {lastLockedDate
                        ? new Date(lastLockedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Never Locked'
                    }
                </p>
            </div>
        </div>
    );
}
