'use client';

import React, { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Download, FileText, IndianRupee, ShoppingCart, Building2, Users, TrendingUp } from 'lucide-react';
import { createClientBrowser } from '@/lib/supabase-client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
    const [exportType, setExportType] = useState<'customers' | 'transactions' | 'all'>('customers');
    const [exporting, setExporting] = useState(false);

    // ... existing reportCards ...

    const handleExportAll = async () => {
        setExporting(true);
        try {
            if (exportType === 'customers' || exportType === 'all') {
                // Export Customers
                const { data: customers } = await supabase
                    .from('customers')
                    .select('*')
                    .order('name');

                if (customers) {
                    if (exportFormat === 'excel') {
                        const ws = XLSX.utils.json_to_sheet(customers);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Customers");
                        XLSX.writeFile(wb, `Customers_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
                    } else if (exportFormat === 'pdf') {
                        const doc = new jsPDF();
                        doc.text("Customer Report", 14, 15);
                        autoTable(doc, {
                            head: [["ID", "Name", "Phone", "Balance", "Status"]],
                            body: customers.map((c: any) => [
                                c.internal_customer_id || c.customer_code,
                                c.name,
                                c.phone,
                                c.outstanding_balance,
                                c.is_active ? 'Active' : 'Inactive'
                            ]),
                            startY: 20
                        });
                        doc.save(`Customers_Report_${new Date().toISOString().split('T')[0]}.pdf`);
                    } else {
                        // CSV logic (can use XLSX for CSV too)
                        const ws = XLSX.utils.json_to_sheet(customers);
                        const csv = XLSX.utils.sheet_to_csv(ws);
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = `Customers_Report_${new Date().toISOString().split('T')[0]}.csv`;
                        link.click();
                    }
                }
            }

            // TODO: Add logic for 'transactions' and 'all' if needed, for now 'customers' is the request
            if (exportType === 'all') {
                // Placeholder for full export
                alert('Full database export coming soon. Customer data exported.');
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
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value as any)}
                                        className="px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="excel">Excel (.xlsx)</option>
                                        <option value="csv">CSV (.csv)</option>
                                        <option value="pdf">PDF (.pdf)</option>
                                    </select>
                                    <select
                                        value={exportType}
                                        onChange={(e) => setExportType(e.target.value as any)}
                                        className="px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
                                    >
                                        <option value="customers">Customers Data</option>
                                        <option value="transactions">Transactions (Coming Soon)</option>
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
