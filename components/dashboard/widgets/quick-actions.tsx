'use client';

import React from 'react';
import {
    ShoppingCart,
    PlusCircle,
    Users,
    FileBarChart,
    CreditCard
} from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
    const actions = [
        { label: 'New Sale', href: '/dashboard/sales', icon: ShoppingCart, color: 'bg-green-50 text-green-700 border-green-200' },
        { label: 'Credit Entry', href: '/dashboard/credit', icon: CreditCard, color: 'bg-orange-50 text-orange-700 border-orange-200' },
        { label: 'Daily Entry', href: '/dashboard/daily-entry', icon: PlusCircle, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'Customers', href: '/dashboard/customers', icon: Users, color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { label: 'Reports', href: '/dashboard/reports', icon: FileBarChart, color: 'bg-gray-50 text-gray-700 border-gray-200' },
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
                {actions.map((action, idx) => (
                    <Link
                        key={idx}
                        href={action.href}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-md ${action.color}`}
                    >
                        <action.icon className="w-5 h-5" />
                        <span className="font-medium">{action.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
