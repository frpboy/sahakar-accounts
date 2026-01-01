'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Search, Download, Edit2, Filter, FileSpreadsheet, FileText, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { CustomerModal } from '@/components/customer-modal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CustomerReportsPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();

    // Data state
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Filters & Search
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [balanceFilter, setBalanceFilter] = useState<'all' | 'with_balance' | 'zero_balance'>('all');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, [user]);

    async function loadCustomers() {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setCustomers(data || []);
        } catch (error) {
            console.error('Failed to load customers:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            // Search
            const searchLower = search.toLowerCase();
            const matchesSearch =
                c.name?.toLowerCase().includes(searchLower) ||
                c.phone?.includes(search) ||
                c.email?.toLowerCase().includes(searchLower) ||
                c.internal_customer_id?.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;

            // Status Filter
            if (statusFilter === 'active' && !c.is_active) return false;
            if (statusFilter === 'inactive' && c.is_active) return false;

            // Balance Filter
            if (balanceFilter === 'with_balance' && (!c.outstanding_balance || c.outstanding_balance <= 0)) return false;
            if (balanceFilter === 'zero_balance' && c.outstanding_balance > 0) return false;

            return true;
        });
    }, [customers, search, statusFilter, balanceFilter]);

    // Selection Logic
    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredCustomers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredCustomers.map(c => c.id)));
        }
    };

    const handleExport = (type: 'excel' | 'pdf') => {
        if (selectedIds.size === 0) {
            alert('Please select at least one customer to export.');
            return;
        }

        setExporting(true);
        try {
            const dataToExport = customers.filter(c => selectedIds.has(c.id));

            if (type === 'excel') {
                const ws = XLSX.utils.json_to_sheet(dataToExport.map(c => ({
                    'Sahakar ID': c.internal_customer_id,
                    'ERP Code': c.customer_code,
                    'Name': c.name,
                    'Phone': c.phone,
                    'Email': c.email,
                    'Address': c.address,
                    'Referred By': c.referred_by,
                    'Credit Limit': c.credit_limit,
                    'Outstanding Balance': c.outstanding_balance,
                    'Status': c.is_active ? 'Active' : 'Inactive',
                    'Notes': c.notes,
                    'Created At': c.created_at ? new Date(c.created_at).toLocaleDateString() : ''
                })));
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Customer Report");
                XLSX.writeFile(wb, `Customer_Report_Selected_${new Date().toISOString().split('T')[0]}.xlsx`);
            } else {
                const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns
                doc.text("Customer Comprehensive Report", 14, 15);
                doc.setFontSize(10);
                doc.text(`Generated on ${new Date().toLocaleDateString()} - ${dataToExport.length} records`, 14, 20);

                autoTable(doc, {
                    head: [["ID", "Name", "Phone", "Email", "Balance", "Credit Limit", "Status", "Referred By"]],
                    body: dataToExport.map(c => [
                        c.internal_customer_id || c.customer_code,
                        c.name,
                        c.phone,
                        c.email || '-',
                        c.outstanding_balance?.toLocaleString('en-IN'),
                        c.credit_limit?.toLocaleString('en-IN'),
                        c.is_active ? 'Active' : 'Inactive',
                        c.referred_by || '-'
                    ]),
                    startY: 25,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [41, 128, 185] }
                });

                doc.save(`Customer_Report_Selected_${new Date().toISOString().split('T')[0]}.pdf`);
            }
        } catch (e) {
            console.error('Export failed', e);
            alert('Export failed');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <TopBar title="Customer Reports" />

            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 p-4 space-y-4">

                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search all fields..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 border dark:border-slate-700 rounded-lg text-sm bg-gray-50 dark:bg-slate-950 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Filters */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-3 py-2 border dark:border-slate-700 rounded-lg text-sm bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>

                            <select
                                value={balanceFilter}
                                onChange={(e) => setBalanceFilter(e.target.value as any)}
                                className="px-3 py-2 border dark:border-slate-700 rounded-lg text-sm bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Balances</option>
                                <option value="with_balance">Pending Dues</option>
                                <option value="zero_balance">Settled / Zero</option>
                            </select>
                        </div>

                        {/* Export Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleExport('excel')}
                                disabled={selectedIds.size === 0 || exporting}
                                className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FileSpreadsheet className="w-4 h-4" /> Excel ({selectedIds.size})
                            </button>
                            <button
                                onClick={() => handleExport('pdf')}
                                disabled={selectedIds.size === 0 || exporting}
                                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FileText className="w-4 h-4" /> PDF ({selectedIds.size})
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border dark:border-slate-800 rounded-lg">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-400 font-medium border-b dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <button onClick={toggleSelectAll} className="flex items-center">
                                            {selectedIds.size === filteredCustomers.length && filteredCustomers.length > 0 ? (
                                                <CheckSquare className="w-4 h-4 text-blue-600" />
                                            ) : (
                                                <Square className="w-4 h-4" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Phone</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3 text-right">Balance</th>
                                    <th className="px-4 py-3 text-right">Limit</th>
                                    <th className="px-4 py-3">Referrer</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-8 text-center text-gray-400">Loading customers...</td>
                                    </tr>
                                ) : filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-8 text-center text-gray-400">No customers found matching filters</td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map(c => (
                                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <button onClick={() => toggleSelection(c.id)}>
                                                    {selectedIds.has(c.id) ? (
                                                        <CheckSquare className="w-4 h-4 text-blue-600" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-gray-300" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                                {c.internal_customer_id || c.customer_code || '---'}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.name}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.phone}</td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.email || '-'}</td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                ₹{c.outstanding_balance?.toLocaleString('en-IN') || '0'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                                                ₹{c.credit_limit?.toLocaleString('en-IN') || '0'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 uppercase text-xs">{c.referred_by || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                    {c.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => {
                                                        setEditingCustomer(c);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-1 hover:bg-gray-100 rounded text-blue-600 dark:hover:bg-slate-700 transition"
                                                    title="Edit Customer"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingCustomer(null);
                }}
                customer={editingCustomer}
                onSuccess={() => {
                    loadCustomers();
                }}
            />
        </div>
    );
}
