'use client';

import React from 'react';
import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingCart,
    Undo2,
    Package,
    IndianRupee,
    Users,
    FileText,
    LogOut
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    const navItems = [
        { label: 'Navigation', type: 'label' },
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'New Sales', href: '/dashboard/sales', icon: ShoppingCart },
        { label: 'Sales Return', href: '/dashboard/returns', icon: Undo2 },
        { label: 'Purchase', href: '/dashboard/purchase', icon: Package },
        { label: 'Credit Received', href: '/dashboard/credit', icon: IndianRupee },
        { label: 'Customers', href: '/dashboard/customers', icon: Users },
        { label: 'Draft Entries', href: '/dashboard/drafts', icon: FileText, badge: '0' },
    ];

    return (
        <div className={cn("flex flex-col h-full bg-white border-r", className)}>
            {/* Brand */}
            <div className="p-6 border-b">
                <h1 className="text-xl font-bold text-gray-900">Sahakar Accounts</h1>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item, idx) => {
                    if (item.type === 'label') {
                        return (
                            <div key={idx} className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                                {item.label}
                            </div>
                        );
                    }

                    const isActive = item.href ? pathname === item.href : false;
                    const Icon = item.icon!;

                    return (
                        <a
                            key={idx}
                            href={item.href}
                            className={cn(
                                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <Icon className={cn(
                                "mr-3 flex-shrink-0 h-5 w-5",
                                isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                            )} />
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                                <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs font-medium">
                                    {item.badge}
                                </span>
                            )}
                        </a>
                    );
                })}
            </nav>

            {/* Footer User Info */}
            <div className="p-4 border-t bg-gray-50">
                <div className="px-3 py-2 border rounded-md bg-white">
                    <div className="text-xs text-gray-500 mb-1">Logged in as</div>
                    <div className="font-medium text-sm text-gray-900 truncate">
                        {user?.profile?.name || user?.email || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 capitalize">
                        {user?.profile?.role?.replace(/_/g, ' ') || 'Staff'}
                    </div>
                </div>
                <button
                    onClick={() => signOut()}
                    className="mt-2 w-full flex items-center justify-center px-3 py-2 text-xs text-gray-500 hover:text-red-600 transition-colors"
                >
                    <LogOut className="h-3 w-3 mr-1" /> Logout
                </button>
            </div>
        </div>
    );
}
