'use client';

import React from 'react';
import { TopBar } from '@/components/layout/topbar';

export default function NewSalesPage() {
    return (
        <div className="flex flex-col h-full">
            <TopBar title="New Sales Entry" />
            <div className="p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Step 1: Customer Details */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">1</span>
                            Customer Details
                        </h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Customer Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                placeholder="Enter 10-digit phone number"
                                className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Step 2: Sale Details */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">2</span>
                            Sale Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    Sales Value (₹) <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Payment Modes */}
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">3</span>
                            Payment Modes
                        </h2>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Payment Mode(s) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-6">
                            {['Cash', 'UPI', 'Card', 'Credit'].map((mode) => (
                                <label key={mode} className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                    <span className="text-gray-700">{mode}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium">
                        Submit Entry
                    </button>
                </div>
            </div>
        </div>
    );
}
