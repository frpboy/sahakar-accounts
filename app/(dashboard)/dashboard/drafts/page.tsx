'use client';

import React from 'react';
import { TopBar } from '@/components/layout/topbar';

export default function DraftsPage() {
    return (
        <div className="flex flex-col h-full">
            <TopBar title="Draft Entries" />
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-gray-500">No draft entries found.</p>
                </div>
            </div>
        </div>
    );
}
