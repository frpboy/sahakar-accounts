'use client';

import React from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { StaffDashboard } from '@/components/dashboard/staff-view';
import { StoreManagerDashboard } from '@/components/dashboard/store-manager-view';
import { AdminDashboard } from '@/components/dashboard/admin-view';
import { HOAccountantDashboard } from '@/components/dashboard/ho-accountant-view';
import { AuditorDashboard } from '@/components/dashboard/auditor-view';

export default function DashboardPage() {
    const { user } = useAuth();
    const userRole = user?.profile?.role;

    return (
        <div className="flex flex-col h-full">
            <TopBar title="Dashboard" />
            <div className="flex-1 overflow-auto">
                {(userRole === 'master_admin' || userRole === 'superadmin') ? (
                    <AdminDashboard />
                ) : userRole === 'ho_accountant' ? (
                    <HOAccountantDashboard />
                ) : userRole === 'auditor' ? (
                    <AuditorDashboard />
                ) : userRole === 'outlet_manager' ? (
                    <StoreManagerDashboard />
                ) : (
                    <StaffDashboard />
                )}
            </div>
        </div>
    );
}
