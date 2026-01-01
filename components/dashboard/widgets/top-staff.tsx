'use client';

import React from 'react';
import { User, Trophy } from 'lucide-react';

interface StaffStat {
    name: string;
    count: number;
    total: number;
}

export function TopStaff({ data }: { data: StaffStat[] }) {
    // Sort by total revenue
    const sortedStaff = [...data].sort((a, b) => b.total - a.total).slice(0, 5);

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Staff Today</h3>
                <Trophy className="w-5 h-5 text-yellow-500" />
            </div>

            <div className="space-y-4">
                {sortedStaff.length > 0 ? (
                    sortedStaff.map((staff, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">
                                    {staff.name.substring(0, 1).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                                    <div className="text-xs text-gray-500">{staff.count} txns</div>
                                </div>
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                                ₹{staff.total.toLocaleString()}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-4 text-sm text-gray-500">
                        No transactions recorded today.
                    </div>
                )}
            </div>
        </div>
    );
}
