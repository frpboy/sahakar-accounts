'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { UserRole } from '@/lib/types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
    requireAuth?: boolean;
}

export function ProtectedRoute({
    children,
    allowedRoles,
    requireAuth = true
}: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            // Not authenticated but auth required
            if (requireAuth && !user) {
                router.push('/login');
                return;
            }

            // Authenticated but accessing login page
            if (!requireAuth && user) {
                router.push(getRoleDashboard(user.profile?.role || 'outlet_staff'));
                return;
            }

            // Check role authorization
            if (user && allowedRoles && user.profile) {
                if (!allowedRoles.includes(user.profile.role)) {
                    // Redirect to their appropriate dashboard
                    router.push(getRoleDashboard(user.profile.role));
                }
            }
        }
    }, [user, loading, requireAuth, allowedRoles, router]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Show nothing while redirecting
    if (requireAuth && !user) {
        return null;
    }

    if (user && allowedRoles && user.profile && !allowedRoles.includes(user.profile.role)) {
        return null;
    }

    return <>{children}</>;
}

// Helper function to get dashboard route based on role
export function getRoleDashboard(role: UserRole): string {
    switch (role) {
        case 'superadmin':
            return '/dashboard/admin';
        case 'ho_accountant':
            return '/dashboard/accountant';
        case 'outlet_manager':
            return '/dashboard/manager';
        case 'outlet_staff':
            return '/dashboard/staff';
        default:
            return '/dashboard';
    }
}
