'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardCard } from '@/components/dashboard-card';
import { MonthClosureActions } from '@/components/month-closure-actions';

interface MonthlyReportProps {
    showActions?: boolean;
}

export function MonthlyReport({ showActions = false }: MonthlyReportProps) {
    const [month, setMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const { data: summary, isLoading, refetch } = useQuery({
        queryKey: ['monthly-report', month],
        queryFn: async () => {
            const res = await fetch(`/api/reports/monthly?month=${month}`);
            if (!res.ok) throw new Error('Failed to fetch report');
            return res.json();
        },
    });

    if (isLoading) {
        return <div className="text-center py-8">Loading report...</div>;
    }

    return (
        <div className="space-y-6">
            {summary && showActions && (
                <MonthClosureActions
                    outletId={summary.outlet_id}
                    month={month}
                    status={summary.closure_status}
                    onStatusChange={refetch}
                />
            )}

            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Monthly Report</h2>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total Income"
                    value={`₹${summary?.total_income?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`}
                    colorClass="text-green-600"
                    subtitle={`${summary?.days_count || 0} days`}
                />
                <DashboardCard
                    title="Total Expense"
                    value={`₹${summary?.total_expense?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`}
                    colorClass="text-red-600"
                    subtitle={`${summary?.days_count || 0} days`}
                />
                <DashboardCard
                    title="Net Profit"
                    value={`₹${summary?.net_profit?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`}
                    colorClass={summary?.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}
                    subtitle="Income - Expense"
                />
                <DashboardCard
                    title="Closing Balance"
                    value={`₹${summary?.closing_balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`}
                    colorClass="text-blue-600"
                    subtitle="Cash + UPI"
                />
            </div>
        </div>
    );
}
