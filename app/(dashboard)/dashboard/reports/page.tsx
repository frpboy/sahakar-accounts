'use client';

import React, { useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Download, FileText, IndianRupee, ShoppingCart, Building2, Users, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
    const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');

    const reportCards = [
        {
            title: 'Sales Report',
            description: 'Comprehensive sales data with customer details',
            icon: <ShoppingCart className="h-8 w-8 text-blue-600" />,
            color: 'bg-blue-50 border-blue-200',
            href: '/dashboard/reports/sales',
            dataPoints: ['Daily sales', 'Product-wise breakdown', 'Customer purchase history']
        },
        {
            title: 'Financial Report',
            description: 'Revenue, expenses, and profit analysis',
            icon: <IndianRupee className="h-8 w-8 text-green-600" />,
            color: 'bg-green-50 border-green-200',
            href: '/dashboard/reports/financial',
            dataPoints: ['Income vs Expenses', 'Payment mode breakdown', 'Credit outstanding']
        },
        {
            title: 'Outlet Performance',
            description: 'Compare performance across all outlets',
            icon: <Building2 className="h-8 w-8 text-purple-600" />,
            color: 'bg-purple-50 border-purple-200',
            href: '/dashboard/reports/outlets',
            dataPoints: ['Revenue by outlet', 'Staff productivity', 'Monthly targets']
        },
        {
            title: 'User Activity',
            description: 'User transactions and system usage',
            icon: <Users className="h-8 w-8 text-orange-600" />,
            color: 'bg-orange-50 border-orange-200',
            href: '/dashboard/reports/users',
            dataPoints: ['User-wise transactions', 'Login activity', 'Audit logs']
        },
        {
            title: 'Transaction Report',
            description: 'All transactions with full details',
            icon: <FileText className="h-8 w-8 text-indigo-600" />,
            color: 'bg-indigo-50 border-indigo-200',
            href: '/dashboard/reports/transactions',
            dataPoints: ['Sales & purchases', 'Returns & refunds', 'Credit transactions']
        },
        {
            title: 'Trends & Analytics',
            description: 'Growth trends and forecasting',
            icon: <TrendingUp className="h-8 w-8 text-rose-600" />,
            color: 'bg-rose-50 border-rose-200',
            href: '/dashboard/reports/analytics',
            dataPoints: ['Month-over-month growth', 'Customer retention', 'Revenue forecasts']
        },
    ];

    const handleExportAll = (format: 'excel' | 'csv' | 'pdf') => {
        alert(`Exporting all data as ${format.toUpperCase()}...`);
        // TODO: Implement actual export logic
    };

    return (
        <div className="flex flex-col h-full">
            <TopBar title="Reports & Analytics" />

            <div className="flex-1 overflow-auto bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Business Reports</h2>
                                <p className="text-gray-600 mt-1">
                                    Access comprehensive reports and export data in multiple formats
                                </p>
                            </div>
                        </div>

                        {/* Export All Section */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Export All Data</h3>
                                    <p className="text-sm text-gray-600">
                                        Download complete database export in your preferred format
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value as any)}
                                        className="px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="excel">Excel (.xlsx)</option>
                                        <option value="csv">CSV (.csv)</option>
                                        <option value="pdf">PDF (.pdf)</option>
                                    </select>
                                    <button
                                        onClick={() => handleExportAll(exportFormat)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export All
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reportCards.map((report, idx) => (
                            <a
                                key={idx}
                                href={report.href}
                                className={`block p-6 rounded-lg border-2 hover:shadow-lg transition-all ${report.color} hover:scale-105`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-white rounded-lg shadow-sm">
                                        {report.icon}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {report.title}
                                </h3>

                                <p className="text-sm text-gray-600 mb-4">
                                    {report.description}
                                </p>

                                <div className="space-y-1">
                                    {report.dataPoints.map((point, i) => (
                                        <div key={i} className="flex items-center text-xs text-gray-700">
                                            <span className="mr-2">•</span>
                                            {point}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 flex items-center text-sm font-medium text-blue-600">
                                    View Report
                                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">156</div>
                                <div className="text-sm text-gray-600">Total Reports</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">23</div>
                                <div className="text-sm text-gray-600">This Month</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">4</div>
                                <div className="text-sm text-gray-600">Active Outlets</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">11</div>
                                <div className="text-sm text-gray-600">Active Users</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
