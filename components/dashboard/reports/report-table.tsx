'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Column {
    header: string;
    accessor: string | ((item: any) => React.ReactNode);
    className?: string;
}

interface ReportTableProps {
    columns: Column[];
    data: any[];
    emptyMessage?: string;
    loading?: boolean;
}

export function ReportTable({
    columns,
    data,
    emptyMessage = "No records found",
    loading = false
}: ReportTableProps) {
    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Loading report data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={cn(
                                        "px-6 py-3 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider",
                                        col.className
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {data.length > 0 ? (
                            data.map((item, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                                    {columns.map((col, colIdx) => (
                                        <td
                                            key={colIdx}
                                            className={cn(
                                                "px-6 py-4 text-sm text-gray-700 dark:text-slate-300",
                                                col.className
                                            )}
                                        >
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(item)
                                                : item[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-6 py-12 text-center text-sm text-gray-500 dark:text-slate-400"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
