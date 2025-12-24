'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LiveBalanceProps {
    cashBalance: number;
    upiBalance: number;
    openingCash?: number;
    openingUpi?: number;
}

export function LiveBalance({ cashBalance, upiBalance, openingCash = 0, openingUpi = 0 }: LiveBalanceProps) {
    const totalBalance = cashBalance + upiBalance;
    const totalOpening = openingCash + openingUpi;

    const cashChange = cashBalance - openingCash;
    const upiChange = upiBalance - openingUpi;
    const totalChange = totalBalance - totalOpening;

    const getCashProgress = () => {
        if (openingCash === 0) return 100;
        return Math.min((cashBalance / openingCash) * 100, 200);
    };

    const getUpiProgress = () => {
        if (openingUpi === 0) return 100;
        return Math.min((upiBalance / openingUpi) * 100, 200);
    };

    const getChangeIcon = (change: number) => {
        if (change > 0) return <TrendingUp className="w-4 h-4 text-green-300" />;
        if (change < 0) return <TrendingDown className="w-4 h-4 text-red-300" />;
        return <Minus className="w-4 h-4 text-gray-300" />;
    };

    const getChangeColor = (change: number) => {
        if (change > 0) return 'text-green-300';
        if (change < 0) return 'text-red-300';
        return 'text-gray-300';
    };

    return (
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold opacity-90">Live Balance</h2>
                <div className="flex items-center gap-2 text-xs opacity-75">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span>Live</span>
                </div>
            </div>

            {/* Total Balance */}
            <div className="mb-6 pb-4 border-b border-white/20">
                <p className="text-sm opacity-80 mb-1">Total Balance</p>
                <div className="flex items-baseline justify-between">
                    <p className="text-4xl font-bold">
                        ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div className={`flex items-center gap-1 text-sm ${getChangeColor(totalChange)}`}>
                        {getChangeIcon(totalChange)}
                        <span>₹{Math.abs(totalChange).toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                {/* Cash Balance with Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">💵</span>
                            <span className="text-sm opacity-90">Cash</span>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold">
                                ₹{cashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <div className={`flex items-center gap-1 text-xs ${getChangeColor(cashChange)}`}>
                                {getChangeIcon(cashChange)}
                                <span>₹{Math.abs(cashChange).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                    {openingCash > 0 && (
                        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${cashChange >= 0 ? 'bg-green-400' : 'bg-red-400'
                                    }`}
                                style={{ width: `${Math.min(getCashProgress(), 100)}%` }}
                            ></div>
                        </div>
                    )}
                </div>

                {/* UPI Balance with Progress */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📱</span>
                            <span className="text-sm opacity-90">UPI</span>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold">
                                ₹{upiBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <div className={`flex items-center gap-1 text-xs ${getChangeColor(upiChange)}`}>
                                {getChangeIcon(upiChange)}
                                <span>₹{Math.abs(upiChange).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                    {openingUpi > 0 && (
                        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${upiChange >= 0 ? 'bg-blue-400' : 'bg-red-400'
                                    }`}
                                style={{ width: `${Math.min(getUpiProgress(), 100)}%` }}
                            ></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Opening Balance Reference (if set) */}
            {totalOpening > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex justify-between text-xs opacity-75">
                        <span>Opening:</span>
                        <span>₹{totalOpening.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
