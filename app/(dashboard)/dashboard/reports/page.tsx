'use client';

import React, { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Download, FileText, IndianRupee, ShoppingCart, Building2, Users, TrendingUp, Activity, List } from 'lucide-react';
import { createClientBrowser } from '@/lib/supabase-client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function ReportsPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
    const [exportType, setExportType] = useState<'customers' | 'transactions' | 'all'>('customers');
    const [exporting, setExporting] = useState(false);

    const isAdmin = ['superadmin', 'master_admin', 'ho_accountant'].includes(user?.profile?.role || '');

    const reportCards = [
        {
            title: 'Sales Reports',
            description: 'Analyze revenue, trends, and payment modes',
            icon: <ShoppingCart className="w-6 h-6 text-blue-600" />,
            color: 'border-blue-200 bg-blue-50/50',
            href: '/dashboard/reports/sales',
            dataPoints: ['Revenue Trends', 'Payment Modes', 'Top Products'],
            roles: ['admin', 'ho_accountant', 'outlet_manager']
        },
        {
            title: 'Financial Reports',
            description: 'Track daily closing balances and expenses',
            icon: <IndianRupee className="w-6 h-6 text-green-600" />,
            color: 'border-green-200 bg-green-50/50',
            href: '/dashboard/reports/financial',
            dataPoints: ['Daily Closing', 'Expense Analysis', 'Audit Logs'],
            roles: ['admin', 'ho_accountant', 'outlet_manager']
        },
        {
            title: 'Outlet Performance',
            description: 'Compare performance across different branches',
            icon: <Building2 className="w-6 h-6 text-purple-600" />,
            color: 'border-purple-200 bg-purple-50/50',
            href: '/dashboard/reports/outlets',
            dataPoints: ['Branch Comparison', 'Staff Performance', 'Target Tracking'],
            roles: ['admin', 'ho_accountant']
        },
        {
            title: 'Customer Insights',
            description: 'View customer growth and behavior',
            icon: <Users className="w-6 h-6 text-orange-600" />,
            color: 'border-orange-200 bg-orange-50/50',
            href: '/dashboard/reports/customers',
            dataPoints: ['Customer Growth', 'Top Spenders', 'Inactive Users'],
            roles: ['admin', 'ho_accountant', 'outlet_manager']
        },
        {
            title: 'Transaction Report',
            description: 'Detailed log of all system transactions',
            icon: <List className="w-6 h-6 text-teal-600" />,
            color: 'border-teal-200 bg-teal-50/50',
            href: '/dashboard/reports/transactions',
            dataPoints: ['Detailed Logs', 'Filter by Type', 'Export Data'],
            roles: ['admin', 'ho_accountant', 'outlet_manager']
        },
        {
            title: 'Trends & Analytics',
            description: 'Visual insights into business growth',
            icon: <TrendingUp className="w-6 h-6 text-indigo-600" />,
            color: 'border-indigo-200 bg-indigo-50/50',
            href: '/dashboard/reports/analytics',
            dataPoints: ['MoM Growth', 'Retention Rates', 'Forecasting'],
            roles: ['admin', 'ho_accountant']
        },
        {
            title: 'User Activity',
            description: 'Monitor staff actions and system usage',
            icon: <Activity className="w-6 h-6 text-pink-600" />,
            color: 'border-pink-200 bg-pink-50/50',
            href: '/dashboard/reports/users',
            dataPoints: ['Login History', 'Action Logs', 'Performance'],
            roles: ['admin', 'ho_accountant']
        }
    ].filter(card => {
        if (isAdmin) return true;
        const role = user?.profile?.role;
        return card.roles.includes(role || 'outlet_staff');
    });

    const handleExportAll = async () => {
        setExporting(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            let data: any[] = [];
            let fileName = `Export_${today}`;

            // Helper to apply outlet filter if not HO
            const applyOutletFilter = (query: any) => {
                if (!isAdmin && user?.profile?.outlet_id) {
                    return query.eq('outlet_id', user.profile.outlet_id);
                }
                return query;
            };

            if (exportType === 'customers') {
                const { data: customers } = await applyOutletFilter((supabase as any).from('customers').select('*')).order('name');
                data = customers || [];
                fileName = `Customers_Report_${today}`;
            } else if (exportType === 'transactions') {
                const { data: transactions } = await applyOutletFilter((supabase as any).from('transactions').select('*')).order('created_at', { ascending: false });
                data = transactions || [];
                fileName = `Transactions_Report_${today}`;
            } else if (exportType === 'all') {
                // Multi-sheet export for Excel only usually, but let's handle what we can
                const { data: customers } = await applyOutletFilter((supabase as any).from('customers').select('*'));
                const { data: transactions } = await applyOutletFilter((supabase as any).from('transactions').select('*')).limit(5000); // Limit to prevent crash
                const { data: outlets } = await (supabase as any).from('outlets').select('*');

                if (exportFormat === 'excel') {
                    const wb = XLSX.utils.book_new();
                    if (customers) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customers), "Customers");
                    if (transactions) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactions), "Transactions");
                    if (outlets) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(outlets), "Outlets");
                    XLSX.writeFile(wb, `Full_Database_Export_${today}.xlsx`);
                    setExporting(false);
                    return;
                } else {
                    // Fallback for CSV/PDF in 'All' -> Just export transactions as it's the main one
                    alert("For 'All Data', please use Excel format to get multiple sheets. Exporting Transactions only for now.");
                    const { data: txns } = await (supabase as any).from('transactions').select('*').order('created_at', { ascending: false });
                    data = txns || [];
                    fileName = `Full_Export_Transactions_${today}`;
                }
            }

            if (!data || data.length === 0) {
                alert('No data found to export.');
                setExporting(false);
                return;
            }

            // Generate File
            if (exportFormat === 'excel') {
                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Data");
                XLSX.writeFile(wb, `${fileName}.xlsx`);
            } else if (exportFormat === 'csv') {
                const ws = XLSX.utils.json_to_sheet(data);
                const csv = XLSX.utils.sheet_to_csv(ws);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `${fileName}.csv`;
                link.click();
            } else if (exportFormat === 'pdf') {
                const doc = new jsPDF();

                // Branding Header
                doc.setFillColor(37, 99, 235); // Blue-600
                doc.rect(0, 0, 210, 25, 'F');

                doc.setTextColor(255, 255, 255);
                doc.setFontSize(18);
                doc.text("SAHAKAR ACCOUNTS", 14, 12);

                doc.setFontSize(10);
                doc.text(fileName.replace(/_/g, ' '), 14, 20);

                doc.setTextColor(0, 0, 0); // Reset for table

                // Simple auto-table with keys
                const keys = Object.keys(data[0]);
                const body = data.map((row: any) => keys.map(k => {
                    const val = row[k];
                    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
                    return val;
                }));

                autoTable(doc, {
                    head: [keys],
                    body: body,
                    startY: 20,
                    styles: { fontSize: 8, cellWidth: 'wrap' }
                });
                doc.save(`${fileName}.pdf`);
            }

        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data');
        } finally {
            setExporting(false);
        }
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
                                        value={exportType}
                                        onChange={(e) => setExportType(e.target.value as any)}
                                        className="px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
                                    >
                                        <option value="customers">Customers Data</option>
                                        <option value="transactions">Transactions</option>
                                        <option value="all">All Data</option>
                                    </select>
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
                                        onClick={handleExportAll}
                                        disabled={exporting}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {exporting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Download className="h-4 w-4" />}
                                        Export
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reportCards.map((report, idx) => (
                            <Link
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
                            </Link>
                        ))}
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{reportCards.length}</div>
                                <div className="text-sm text-gray-600">Total Reports</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">23</div>
                                <div className="text-sm text-gray-600">Active Screens</div>
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
