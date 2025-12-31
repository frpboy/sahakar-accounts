'use client';

import React from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useApp } from '@/components/providers/app-provider';
import { StoreUserDashboard } from '@/components/dashboard/store-user-view';
import { StoreManagerDashboard } from '@/components/dashboard/store-manager-view';
import { AdminDashboard } from '@/components/dashboard/admin-view';

export default function DashboardPage() {
    const { demoRole } = useApp();

    return (
        <div className="flex flex-col h-full">
            <TopBar title="Dashboard" />
            <div className="p-6">
                {demoRole === 'admin' ? (
                    <AdminDashboard />
                ) : demoRole === 'outlet_manager' ? (
                    <StoreManagerDashboard />
                ) : (
                    <StoreUserDashboard />
                )}
            </div>
        </div>
    );
}
