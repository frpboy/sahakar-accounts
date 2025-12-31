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
    LogOut,
    Menu,
    X,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useApp } from '@/components/providers/app-provider';
import { cn } from '@/lib/utils';

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const { demoRole, setDemoRole } = useApp();
    const [isRoleMenuOpen, setIsRoleMenuOpen] = React.useState(false);

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

            {/* Footer Role Switcher */}
            <div className="p-4 border-t bg-gray-50">
                <div className="relative">
                    <button 
                        onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 border rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
                    >
                        <span className="truncate text-left">
                            <span className="block text-xs text-gray-500">User Role (Demo)</span>
                            <span className="font-medium">
                                {demoRole === 'outlet_manager' ? 'Store Manager' : 
                                 demoRole === 'admin' ? 'Admin' : 'Store User'}
                            </span>
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>

                    {isRoleMenuOpen && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-white border rounded-md shadow-lg py-1 z-20">
                            <button
                                onClick={() => { setDemoRole('outlet_staff'); setIsRoleMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Store User
                            </button>
                            <button
                                onClick={() => { setDemoRole('outlet_manager'); setIsRoleMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Store Manager
                            </button>
                            <button
                                onClick={() => { setDemoRole('admin'); setIsRoleMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Admin
                            </button>
                        </div>
                    )}
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
