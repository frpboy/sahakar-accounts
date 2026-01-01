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
    History,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Menu
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
    const [isLoaded, setIsLoaded] = React.useState(false);

    // Persist sidebar state
    React.useEffect(() => {
        const saved = localStorage.getItem('sidebar_collapsed');
        if (saved !== null) {
            setIsCollapsed(saved === 'true');
        }
        setIsLoaded(true);
    }, []);

    React.useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('sidebar_collapsed', isCollapsed.toString());
        }
    }, [isCollapsed, isLoaded]);

    if (!isLoaded) return <div className="w-64 h-full bg-white border-r" />;

    const navItems = [
        { label: 'Navigation', type: 'label' },
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'New Sales', href: '/dashboard/sales', icon: ShoppingCart },
        { label: 'Sales Return', href: '/dashboard/returns', icon: Undo2 },
        { label: 'Purchase', href: '/dashboard/purchase', icon: Package },
        { label: 'Credit Received', href: '/dashboard/credit', icon: IndianRupee },
        { label: 'Customers', href: '/dashboard/customers', icon: Users },
        { label: 'Draft Entries', href: '/dashboard/drafts', icon: FileText, badge: '0' },
        {
            label: 'History',
            icon: History,
            type: 'group',
            isOpen: isHistoryOpen,
            setOpen: setIsHistoryOpen,
            items: [
                { label: 'Sales History', href: '/dashboard/history/sales', icon: History },
                { label: 'Return History', href: '/dashboard/history/returns', icon: Undo2 },
                { label: 'Purchase History', href: '/dashboard/history/purchase', icon: Package },
                { label: 'Credit History', href: '/dashboard/history/credit', icon: IndianRupee },
                { label: 'Customer History', href: '/dashboard/history/customers', icon: Users },
            ]
        }
    ];

    return (
        <div className={cn(
            "flex flex-col h-full bg-white border-r transition-all duration-300 ease-in-out relative",
            isCollapsed ? "w-20" : "w-64",
            className
        )}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-20 bg-white border rounded-full p-1 shadow-md z-50 hover:bg-gray-50 transition-colors"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            {/* Brand */}
            <div className={cn("p-6 border-b transition-all duration-300 overflow-hidden", isCollapsed ? "px-4" : "px-6")}>
                <h1 className={cn(
                    "font-bold text-gray-900 truncate transition-all",
                    isCollapsed ? "text-center text-xs" : "text-xl"
                )}>
                    {isCollapsed ? "SA" : "Sahakar Accounts"}
                </h1>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item, idx) => {
                    if (item.type === 'label') {
                        if (isCollapsed) return <div key={idx} className="h-px bg-gray-100 my-4" />;
                        return (
                            <div key={idx} className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4">
                                {item.label}
                            </div>
                        );
                    }

                    if (item.type === 'group') {
                        const hasActiveChild = item.items?.some((child: any) => pathname === child.href);
                        return (
                            <div key={idx} className="space-y-1">
                                <button
                                    onClick={() => !isCollapsed && item.setOpen(!item.isOpen)}
                                    className={cn(
                                        "w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        (hasActiveChild && !item.isOpen)
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <item.icon className={cn(
                                        "flex-shrink-0 h-5 w-5",
                                        isCollapsed ? "mx-auto" : "mr-3",
                                        hasActiveChild ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                                    )} />
                                    {!isCollapsed && (
                                        <>
                                            <span className="flex-1 text-left">{item.label}</span>
                                            {item.isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </>
                                    )}
                                </button>
                                {!isCollapsed && item.isOpen && (
                                    <div className="pl-8 space-y-1 mt-1">
                                        {item.items.map((subItem: any, sIdx: number) => {
                                            const isSubActive = pathname === subItem.href;
                                            return (
                                                <a
                                                    key={sIdx}
                                                    href={subItem.href}
                                                    className={cn(
                                                        "group flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                                                        isSubActive
                                                            ? "text-blue-700 font-bold"
                                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                                    )}
                                                >
                                                    <subItem.icon className={cn(
                                                        "mr-2 h-3.3 w-3.5",
                                                        isSubActive ? "text-blue-500" : "text-gray-400"
                                                    )} />
                                                    <span>{subItem.label}</span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
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
                                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                                isCollapsed && "justify-center"
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <Icon className={cn(
                                "flex-shrink-0 h-5 w-5",
                                !isCollapsed && "mr-3",
                                isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                            )} />
                            {!isCollapsed && (
                                <>
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge && (
                                        <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs font-medium">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </a>
                    );
                })}
            </nav>

            {/* Footer User Info */}
            <div className={cn("p-4 border-t bg-gray-50 transition-all", isCollapsed && "p-2")}>
                {!isCollapsed ? (
                    <div className="px-3 py-2 border rounded-md bg-white">
                        <div className="text-xs text-gray-500 mb-1">Logged in as</div>
                        <div className="font-medium text-sm text-gray-900 truncate">
                            {user?.profile?.name || user?.email || 'User'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 capitalize">
                            {user?.profile?.role?.replace(/_/g, ' ') || 'Staff'}
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center py-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase" title={user?.profile?.name || user?.email || 'User'}>
                            {(user?.profile?.name || user?.email || 'U').substring(0, 1)}
                        </div>
                    </div>
                )}
                <button
                    onClick={() => signOut()}
                    className={cn(
                        "mt-2 w-full flex items-center text-xs text-gray-500 hover:text-red-600 transition-colors",
                        isCollapsed ? "justify-center" : "px-3 py-2 justify-center"
                    )}
                    title="Logout"
                >
                    <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-1")} />
                    {!isCollapsed && "Logout"}
                </button>
            </div>
        </div>
    );
}
