'use client';

import React from 'react';
import { Calendar, Building2, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportFiltersProps {
    dateRange: { from: string; to: string };
    setDateRange: (range: { from: string; to: string }) => void;
    outletId: string;
    setOutletId: (id: string) => void;
    isAdmin?: boolean;
    outlets?: any[];
    onFilter?: () => void;
}

export function ReportFilters({
    dateRange,
    setDateRange,
    outletId,
    setOutletId,
    isAdmin = false,
    outlets = [],
    onFilter
}: ReportFiltersProps) {
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
            <div className="flex flex-wrap items-end gap-4">
                {/* Date Range */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        From Date
                    </label>
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        To Date
                    </label>
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Outlet Filter (Admin Only) */}
                {isAdmin && (
                    <div className="space-y-1.5 min-w-[200px]">
                        <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            Outlet
                        </label>
                        <select
                            value={outletId}
                            onChange={(e) => setOutletId(e.target.value)}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Outlets</option>
                            {outlets.map((o) => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Filter Button */}
                <button
                    onClick={onFilter}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                    <Search className="w-4 h-4" />
                    Generate Report
                </button>
            </div>

            {/* Quick Select Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400 self-center mr-2">Quick Select:</span>
                {[
                    { label: 'Today', days: 0 },
                    { label: 'Yesterday', days: 1 },
                    { label: 'Last 7 Days', days: 7 },
                    { label: 'This Month', days: 30 },
                ].map((preset) => (
                    <button
                        key={preset.label}
                        onClick={() => {
                            const to = new Date().toISOString().split('T')[0];
                            const fromDate = new Date();
                            fromDate.setDate(fromDate.getDate() - preset.days);
                            const from = fromDate.toISOString().split('T')[0];
                            setDateRange({ from, to });
                        }}
                        className="px-2.5 py-1 text-xs bg-gray-50 text-gray-600 border rounded hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                        {preset.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
