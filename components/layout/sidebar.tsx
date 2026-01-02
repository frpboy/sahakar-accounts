'use client';

import React from 'react';
import Link from 'next/link';
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
    BarChart3,
    UserCog,
    Building2,
    Download,
    Settings,
    AlertTriangle,
    Tag
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useApp } from '@/components/providers/app-provider';
import { cn } from '@/lib/utils';

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const { isMobileMenuOpen, setIsMobileMenuOpen } = useApp();

    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [isTransactionsOpen, setIsTransactionsOpen] = React.useState(true);
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
    const [isReportsOpen, setIsReportsOpen] = React.useState(false);
    const [isManagementOpen, setIsManagementOpen] = React.useState(false);
    const [isLoaded, setIsLoaded] = React.useState(false);

    // Persist sidebar state
    React.useEffect(() => {
        const saved = localStorage.getItem('sidebar_collapsed');
        const savedTx = localStorage.getItem('sidebar_transactions_open');
        const savedReports = localStorage.getItem('sidebar_reports_open');
        const savedMgmt = localStorage.getItem('sidebar_management_open');

        if (saved !== null) setIsCollapsed(saved === 'true');
        if (savedTx !== null) setIsTransactionsOpen(savedTx === 'true');
        if (savedReports !== null) setIsReportsOpen(savedReports === 'true');
        if (savedMgmt !== null) setIsManagementOpen(savedMgmt === 'true');

        setIsLoaded(true);
    }, []);

    React.useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('sidebar_collapsed', isCollapsed.toString());
            localStorage.setItem('sidebar_transactions_open', isTransactionsOpen.toString());
            localStorage.setItem('sidebar_reports_open', isReportsOpen.toString());
            localStorage.setItem('sidebar_management_open', isManagementOpen.toString());
        }
    }, [isCollapsed, isTransactionsOpen, isReportsOpen, isManagementOpen, isLoaded]);

    if (!isLoaded) return <div className="w-64 h-full bg-white border-r" />;

    // Get user role for conditional rendering
    const userRole = user?.profile?.role || 'outlet_staff';
    const isAdmin = ['superadmin', 'master_admin', 'ho_accountant'].includes(userRole);
    const isManager = userRole === 'outlet_manager';
    const isAuditor = userRole === 'auditor';

    // Build navigation items based on role
    const navItems = [];

    // Base navigation (all users)
    navItems.push(
        { label: 'Navigation', type: 'label' },
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }
    );

    // Transactions (staff & managers only, not auditors)
    if (!isAuditor) {
        navItems.push({
            label: 'Transactions',
            icon: ShoppingCart,
            type: 'group',
            isOpen: isTransactionsOpen,
            setOpen: setIsTransactionsOpen,
            items: [
                { label: 'New Sales', href: '/dashboard/sales', icon: ShoppingCart },
                { label: 'Sales Return', href: '/dashboard/returns/sales', icon: Undo2 },
                { label: 'Purchase', href: '/dashboard/purchase', icon: Package },
                { label: 'Purchase Return', href: '/dashboard/returns/purchase', icon: Undo2 },
            ]
        });
        navItems.push(
            { label: 'Credit Received', href: '/dashboard/credit', icon: IndianRupee },
            { label: 'Customers', href: '/dashboard/customers', icon: Users },
            { label: 'Draft Entries', href: '/dashboard/drafts', icon: FileText, badge: '0' }
        );
    }

    // History (all users)
    navItems.push({
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
    });

    // Reports & Analytics (HO + Managers)
    if (isAdmin || isManager) {
        const reportItems = [
            { label: 'All Reports', href: '/dashboard/reports', icon: Download },
            { label: 'Sales Report', href: '/dashboard/reports/sales', icon: ShoppingCart },
            { label: 'Financial Report', href: '/dashboard/reports/financial', icon: IndianRupee },
        ];

        // Only HO sees Outlet Performance (comparisons)
        if (isAdmin) {
            reportItems.push({ label: 'Outlet Performance', href: '/dashboard/reports/outlets', icon: Building2 });
            reportItems.push({ label: 'User Activity', href: '/dashboard/reports/users', icon: Users });
        }

        navItems.push(
            { label: 'Analytics', type: 'label' },
            {
                label: 'Reports',
                icon: BarChart3,
                type: 'group',
                isOpen: isReportsOpen,
                setOpen: setIsReportsOpen,
                items: reportItems
            }
        );
    }

    // Admin-only Management
    if (isAdmin) {
        navItems.push(
            { label: 'Administration', type: 'label' },
            {
                label: 'Management',
                icon: Settings,
                type: 'group',
                isOpen: isManagementOpen,
                setOpen: setIsManagementOpen,
                items: [
                    { label: 'User Management', href: '/dashboard/management/users', icon: UserCog },
                    { label: 'Outlet Management', href: '/dashboard/management/outlets', icon: Building2 },
                    { label: 'Outlet Metadata', href: '/dashboard/admin/outlet-metadata', icon: Tag },
                    { label: 'Anomalies', href: '/dashboard/anomalies', icon: AlertTriangle },
                ]
            }
        );
    }

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
                    isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            <div className={cn(
                "flex flex-col h-full bg-white dark:bg-slate-900 border-r dark:border-slate-800 transition-all duration-300 ease-in-out relative z-50",
                "fixed lg:static inset-y-0 left-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                isCollapsed ? "w-20 lg:w-20" : "w-64 lg:w-64",
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
                <div className={cn("p-6 border-b dark:border-slate-800 transition-all duration-300 overflow-hidden", isCollapsed ? "px-4" : "px-6")}>
                    <Link href="/dashboard" className="flex items-center justify-center">
                        {isCollapsed ? (
                            <img src="/logo.png" alt="Logo" className="w-10 h-10 min-w-[40px] object-contain rounded-lg" />
                        ) : (
                            <div className="flex flex-col items-center">
                                <img src="/logo.png" alt="Sahakar Logo" className="w-16 h-16 object-contain mb-2 rounded-xl" />
                                <h1 className="font-bold text-gray-900 dark:text-white truncate text-center text-sm uppercase tracking-tighter">
                                    Sahakar Accounts
                                </h1>
                            </div>
                        )}
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {navItems.map((item: any, idx) => {
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
                                    {item.isOpen && !isCollapsed && (
                                        <div className="ml-8 space-y-1">
                                            {item.items.map((child: any, childIdx: number) => {
                                                const isActive = pathname === child.href;
                                                return (
                                                    <Link
                                                        key={childIdx}
                                                        href={child.href}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className={cn(
                                                            "group flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                                                            isActive
                                                                ? "bg-blue-50 text-blue-700 font-medium"
                                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                                        )}
                                                    >
                                                        <child.icon className={cn(
                                                            "flex-shrink-0 h-4 w-4 mr-3",
                                                            isActive ? "text-blue-500" : "text-gray-400"
                                                        )} />
                                                        {child.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // Regular link
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={idx}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <item.icon className={cn(
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
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer User Info */}
                <div className={cn("p-4 border-t bg-gray-50 transition-all", isCollapsed && "p-2")}>
                    {!isCollapsed ? (
                        <div className="px-3 py-3 border rounded-md bg-white space-y-2">
                            <div className="text-xs text-gray-500 font-medium">Logged in as</div>
                            {/* Email */}
                            <div className="text-sm font-semibold text-gray-900 truncate" title={user?.email}>
                                {user?.email || 'user@sahakar.com'}
                            </div>
                            {/* Name */}
                            {user?.profile?.name && (
                                <div className="text-xs text-gray-600 truncate" title={user.profile.name}>
                                    {user.profile.name}
                                </div>
                            )}
                            {/* Role */}
                            <div className="inline-flex mt-1">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium capitalize">
                                    {user?.profile?.role?.replace(/_/g, ' ') || 'Staff'}
                                </span>
                            </div>
                            {/* Outlet (for non-global users) */}
                            {user?.profile?.outlet_id && (
                                <div className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                                    <span className="text-gray-400">📍</span>
                                    <span className="flex-1 truncate">
                                        {(() => {
                                            const email = user?.email || '';
                                            if (email.includes('tirur')) return 'Tirur';
                                            if (email.includes('makkara')) return 'Makkaraparamba';
                                            if (email.includes('melattur')) return 'Melattur';
                                            if (email.includes('karinkall')) return 'Karinkallathani';
                                            return 'Outlet';
                                        })()}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex justify-center py-2">
                            <div
                                className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase"
                                title={`${user?.email || 'User'}\n${user?.profile?.role?.replace(/_/g, ' ') || ''}`}
                            >
                                {(user?.email || 'U').substring(0, 1).toUpperCase()}
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
        </>
    );
}
