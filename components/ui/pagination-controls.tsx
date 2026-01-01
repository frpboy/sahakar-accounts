import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaginationControlsProps {
    currentPage: number;
    totalRecords: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export function PaginationControls({
    currentPage,
    totalRecords,
    pageSize,
    onPageChange,
    onPageSizeChange,
}: PaginationControlsProps) {
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

    return (
        <div className="flex items-center justify-between px-2 py-4 border-t dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <span className="flex items-center gap-2">
                        Page
                        <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={currentPage}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                                    onPageChange(val);
                                }
                            }}
                            className="w-12 px-2 py-1 text-center border rounded dark:bg-slate-800 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        of  {totalPages}
                    </span>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={pageSize.toString()} onValueChange={(val) => onPageSizeChange(Number(val))}>
                        <SelectTrigger className="w-[110px] h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10 rows</SelectItem>
                            <SelectItem value="20">20 rows</SelectItem>
                            <SelectItem value="50">50 rows</SelectItem>
                            <SelectItem value="100">100 rows</SelectItem>
                            <SelectItem value="200">200 rows</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="font-medium">
                    {totalRecords.toLocaleString()} records
                </div>
            </div>
        </div>
    );
}
