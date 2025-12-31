'use client';

import React from 'react';
import { TopBar } from '@/components/layout/topbar';

export default function SalesReturnPage() {
    return (
        <div className="flex flex-col h-full">
            <TopBar title="Sales Return" />
            <div className="p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Return Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Phone <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="10-digit phone"
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Entry / Bill Number <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="e.g., INV-001"
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Return Amount (₹) <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <button className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium mt-6">
                            Submit Return
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
