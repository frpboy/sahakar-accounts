'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flag, TrendingUp, TrendingDown, Target, ArrowUp, ArrowDown } from 'lucide-react';

interface BalanceSummaryProps {
    outletId?: string;
}

interface DailyRecord {
    id: string;
    date: string;
    opening_cash: number;
    opening_upi: number;
    closing_cash: number;
    closing_upi: number;
    total_income: number;
    total_expense: number;
    status: 'draft' | 'submitted' | 'locked';
}

export function BalanceSummary({ outletId }: BalanceSummaryProps) {
    // Fetch today's daily record
    const { data: dailyRecord, isLoading } = useQuery<DailyRecord>({
        queryKey: ['daily-record-today', outletId],
        queryFn: async () => {
            const url = outletId
                ? `/api/daily-records/today?outletId=${outletId}`
                : '/api/daily-records/today';
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch daily record');
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!dailyRecord) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800">No daily record found. Please create today&apos;s entry.</p>
            </div>
        );
    }

    const openingTotal = dailyRecord.opening_cash + dailyRecord.opening_upi;
    const closingTotal = dailyRecord.closing_cash + dailyRecord.closing_upi;
    const netChange = closingTotal - openingTotal;

    const balanceCards = [
        {
            label: 'Opening Balance',
            value: openingTotal,
            Icon: Flag,
            color: 'from-green-500 to-emerald-600',
            breakdown: `Cash: ₹${dailyRecord.opening_cash.toLocaleString('en-IN')} | UPI: ₹${dailyRecord.opening_upi.toLocaleString('en-IN')}`,
        },
        {
            label: 'Total Income',
            value: dailyRecord.total_income,
            Icon: TrendingUp,
            color: 'from-blue-500 to-cyan-600',
            breakdown: null,
        },
        {
            label: 'Total Expense',
            value: dailyRecord.total_expense,
            Icon: TrendingDown,
            color: 'from-red-500 to-pink-600',
            breakdown: null,
        },
        {
            label: 'Closing Balance',
            value: closingTotal,
            Icon: Target,
            color: 'from-purple-500 to-indigo-600',
            breakdown: `Cash: ₹${dailyRecord.closing_cash.toLocaleString('en-IN')} | UPI: ₹${dailyRecord.closing_upi.toLocaleString('en-IN')}`,
        },
    ];

    return (
        <div className="space-y-4">
            {/* Balance Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {balanceCards.map((card, index) => (
                    <div
                        key={index}
                        className={`bg-gradient-to-br ${card.color} rounded-lg shadow-lg p-6 text-white`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm opacity-90 font-medium">{card.label}</p>
                            <card.Icon className="w-6 h-6" />
                        </div>
                        <p className="text-3xl font-bold mb-1">
                            ₹{card.value.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                        {card.breakdown && (
                            <p className="text-xs opacity-75 mt-2">{card.breakdown}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Net Change Indicator */}
            <div className={`rounded-lg p-4 ${netChange >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {netChange >= 0 ? (
                            <ArrowUp className="w-6 h-6 text-green-600" />
                        ) : (
                            <ArrowDown className="w-6 h-6 text-red-600" />
                        )}
                        <span className={`font-medium ${netChange >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                            Net Change Today
                        </span>
                    </div>
                    <span className={`text-2xl font-bold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {netChange >= 0 ? '+' : ''}₹{netChange.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </span>
                </div>
                <p className={`text-sm mt-2 ${netChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    Formula: Closing Balance - Opening Balance = (Opening + Income - Expense)
                </p>
            </div>

            {/* Status Badge */}
            <div className="flex justify-end">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${dailyRecord.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    dailyRecord.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                    Status: {dailyRecord.status.toUpperCase()}
                </span>
            </div>
        </div>
    );
}
