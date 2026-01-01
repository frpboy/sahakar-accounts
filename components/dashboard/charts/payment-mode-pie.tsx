'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PaymentModePieProps {
    data: Array<{
        name: string;
        value: number;
    }>;
    loading?: boolean;
    title?: string;
}

const COLORS = {
    'Cash': '#10b981',  // green
    'UPI': '#3b82f6',   // blue
    'Card': '#8b5cf6',  // purple
    'Credit': '#f59e0b' // amber
};

export function PaymentModePie({ data, loading, title = 'Payment Modes Distribution' }: PaymentModePieProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
                <div className="h-64 flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">Loading chart...</div>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                    No payment data available
                </div>
            </div>
        );
    }

    const total = data.reduce((sum, entry) => sum + entry.value, 0);

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number) => [
                            `₹${value.toFixed(2)} (${((value / total) * 100).toFixed(1)}%)`,
                            'Amount'
                        ]}
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px 12px'
                        }}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
