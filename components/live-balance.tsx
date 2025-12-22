'use client';

import React from 'react';

interface LiveBalanceProps {
    cashBalance: number;
    upiBalance: number;
}

export function LiveBalance({ cashBalance, upiBalance }: LiveBalanceProps) {
    const totalBalance = cashBalance + upiBalance;

    return (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold opacity-90">Live Balance</h2>
                <svg className="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>

            <div className="space-y-3">
                {/* Total Balance */}
                <div className="pb-3 border-b border-white/20">
                    <p className="text-sm opacity-80 mb-1">Total Balance</p>
                    <p className="text-3xl font-bold">
                        ₹{totalBalance.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </p>
                </div>

                {/* Cash Balance */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">💵</span>
                        <span className="text-sm opacity-80">Cash</span>
                    </div>
                    <span className="text-xl font-semibold">
                        ₹{cashBalance.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </span>
                </div>

                {/* UPI Balance */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">📱</span>
                        <span className="text-sm opacity-80">UPI</span>
                    </div>
                    <span className="text-xl font-semibold">
                        ₹{upiBalance.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </span>
                </div>
            </div>

            {/* Live indicator */}
            <div className="mt-4 flex items-center gap-2 text-xs opacity-75">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span>Live updates</span>
            </div>
        </div>
    );
}
