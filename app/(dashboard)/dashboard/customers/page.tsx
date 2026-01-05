'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { Plus, X, Search, History as HistoryIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { generateCustomerId } from '@/lib/customer-id-generator';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useDebounce } from '@/hooks/use-debounce';
import { CustomerModal } from '@/components/customer-modal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { CustomerHistorySheet } from '@/components/customer-history-sheet';

export default function CustomersPage() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<Array<{ id: string; name: string; phone?: string | null; customer_code?: string | null; internal_customer_id?: string | null; created_at?: string | null; is_active?: boolean | null; referred_by?: string | null; }>>([]);
    const [error, setError] = useState<string | null>(null);
    const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
    const [historyCustomer, setHistoryCustomer] = useState<any | null>(null);
    const [exporting, setExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);


    useEffect(() => {
        let mounted = true;
        async function load() {
            if (!user) return;
            setLoading(true);
            setError(null);
            try {
                let query = (supabase as any)
                    .from('customers')
                    .select('*', { count: 'exact' })
                    .order('name', { ascending: true });

                // Search filter (Server-side)
                if (debouncedSearch.trim()) {
                    const q = debouncedSearch.trim();
                    const isPhone = /^\d+$/.test(q);
                    if (isPhone) {
                        query = query.ilike('phone', `%${q}%`);
                    } else {
                        query = query.or(`name.ilike.%${q}%,customer_code.ilike.%${q}%,internal_customer_id.ilike.%${q}%`);
                    }
                }

                // Pagination
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;

                const { data, count, error } = await query.range(from, to);

                if (error) throw error;
                if (!mounted) return;

                setTotalRecords(count || 0);
                setRows((data || []).map((c: any) => ({
                    ...c,
                    id: c.id,
                    name: c.name,
                    phone: c.phone,
                    customer_code: c.customer_code,
                    internal_customer_id: c.internal_customer_id,
                    is_active: c.is_active,
                    created_at: c.created_at,
                    referred_by: c.referred_by,
                })));
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.message || 'Failed to load customers');
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [supabase, user, page, pageSize, debouncedSearch]);


    // Use rows directly since filtering is now server-side
    const filtered = rows;

    const handleEditClick = (customer: any) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const canEdit = ['outlet_staff', 'outlet_manager', 'ho_accountant', 'master_admin', 'superadmin'].includes(user?.profile?.role || '');

    const handleExport = async (type: 'excel' | 'pdf') => {
        setExporting(true);
        setShowExportMenu(false);
        try {
            // Fetch all customers for export
            let allCustomers: any[] = [];
            let pageIndex = 0;
            const limit = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await (supabase as any)
                    .from('customers')
                    .select('*')
                    .order('name', { ascending: true })
                    .range(pageIndex * limit, (pageIndex + 1) * limit - 1);

                if (error) throw error;
                if (!data || data.length === 0) {
                    hasMore = false;
                } else {
                    allCustomers = [...allCustomers, ...data];
                    if (data.length < limit) hasMore = false;
                    pageIndex++;
                }
            }

            if (type === 'excel') {
                const ws = XLSX.utils.json_to_sheet(allCustomers.map(c => ({
                    'ID': c.internal_customer_id || c.customer_code || c.id,
                    'Name': c.name,
                    'Phone': c.phone,
                    'Email': c.email,
                    'Address': c.address,
                    'Credit Limit': c.credit_limit,
                    'Outstanding Balance': c.outstanding_balance,
                    'Referred By': c.referred_by,
                    'Status': c.is_active ? 'Active' : 'Inactive',
                    'Created At': c.created_at ? new Date(c.created_at).toLocaleDateString() : ''
                })));
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Customers");
                XLSX.writeFile(wb, `Customers_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
            } else {
                const doc = new jsPDF();
                const tableColumn = ["ID", "Name", "Phone", "Balance", "Status"];
                const tableRows = allCustomers.map(c => [
                    c.internal_customer_id || c.customer_code || c.id.substring(0, 8),
                    c.name,
                    c.phone || '-',
                    c.outstanding_balance?.toString() || '0',
                    c.is_active ? 'Active' : 'Inactive'
                ]);

                doc.text("Customer List", 14, 15);
                doc.setFontSize(10);
                doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 20);

                autoTable(doc, {
                    head: [tableColumn],
                    body: tableRows,
                    startY: 25,
                });

                doc.save(`Customers_Export_${new Date().toISOString().split('T')[0]}.pdf`);
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
            <TopBar title="Customers" />
            <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name, phone or ID..."
                            className="w-full pl-10 pr-4 py-2 border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-950 dark:text-white transition-colors"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1); // Reset to page 1 on search
                            }}
                        />
                    </div>
                    {canEdit && (
                        <div className="flex gap-2">
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    disabled={exporting}
                                    className="bg-white dark:bg-slate-800 border dark:border-slate-700 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                                >
                                    {exporting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div> : <Download className="w-4 h-4" />}
                                    Export
                                </button>
                                {showExportMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-md shadow-lg border dark:border-slate-800 z-10">
                                        <div className="py-1">
                                            <button
                                                onClick={() => handleExport('excel')}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 w-full text-left"
                                            >
                                                <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel
                                            </button>
                                            <button
                                                onClick={() => handleExport('pdf')}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 w-full text-left"
                                            >
                                                <FileText className="w-4 h-4 text-red-600" /> Export PDF
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setEditingCustomer(null);
                                    setIsModalOpen(true);
                                }}
                                className="bg-gray-900 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-blue-500 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Customer
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg shadow overflow-hidden border dark:border-slate-800 transition-colors">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                        <thead className="bg-gray-50 dark:bg-slate-950">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    ID
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Phone
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Referred By
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Created Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    History
                                </th>
                                {canEdit && <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Edit</span>
                                </th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                            {loading && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-slate-500">
                                        Loading customers...
                                    </td>
                                </tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-slate-500">
                                        {error || 'No customers found'}
                                    </td>
                                </tr>
                            )}
                            {!loading && filtered.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400 font-mono">
                                        {customer.internal_customer_id || customer.customer_code || customer.id.substring(0, 8)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {customer.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-300">
                                        {customer.phone || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={customer.is_active
                                            ? "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-transparent dark:border-green-900/50"
                                            : "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-transparent dark:border-red-900/50"}>
                                            {customer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 uppercase">
                                        {customer.referred_by || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN') : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button
                                            onClick={() => setHistoryCustomer(customer)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                                            title="View Transaction History"
                                        >
                                            <HistoryIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                    {canEdit && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEditClick(customer)}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <PaginationControls
                        currentPage={page}
                        totalRecords={totalRecords}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            {isModalOpen && (
                <CustomerModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingCustomer(null);
                    }}
                    customer={editingCustomer}
                    onSuccess={() => {
                        // Reload data
                        setSearch(prev => prev + ' ');
                        setTimeout(() => setSearch(prev => prev.trim()), 0);
                    }}
                />
            )}

            <CustomerHistorySheet
                customer={historyCustomer}
                open={!!historyCustomer}
                onClose={() => setHistoryCustomer(null)}
            />
        </div>
    );
}
