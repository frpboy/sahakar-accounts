'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getRoleDashboard } from '@/lib/utils';
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
    const hasRedirected = useRef(false);

    useEffect(() => {
        if (!loading && !hasRedirected.current) {
            console.log('[ProtectedRoute] Auth check:', {
                user: !!user,
                profile: user?.profile,
                role: user?.profile?.role,
                requireAuth,
                allowedRoles,
                hasUser: !!user,
                hasProfile: !!user?.profile,
                userRole: user?.profile?.role,
                allowedRolesList: allowedRoles,
                roleMatches: user?.profile?.role && allowedRoles?.includes(user.profile.role)
            });

            // Not authenticated but auth required
            if (requireAuth && !user) {
                console.log('[ProtectedRoute] ❌ Redirecting to login - no user');
                hasRedirected.current = true;
                router.push('/login');
                return;
            }

            // Check role authorization
            if (user && allowedRoles && user.profile) {
                const roleMatches = allowedRoles.includes(user.profile.role);
                console.log('[ProtectedRoute] Role check:', {
                    userRole: user.profile.role,
                    allowedRoles,
                    matches: roleMatches
                });

                if (!roleMatches) {
                    console.log('[ProtectedRoute] ❌ Redirecting - wrong role');
                    hasRedirected.current = true;
                    router.push(getRoleDashboard(user.profile.role));
                } else {
                    console.log('[ProtectedRoute] ✅ Access granted!');
                }
            } else {
                console.log('[ProtectedRoute] ⚠️ Access allowed (no role check required)');
            }
        }
    }, [loading, requireAuth, allowedRoles, user, router]);

    // Show loading state - CRITICAL: Don't redirect while loading!
    if (loading) {
        console.log('[ProtectedRoute] ⏳ Loading auth state...');
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Show nothing while redirecting (auth is loaded at this point)
    if (requireAuth && !user) {
        console.log('[ProtectedRoute] ⏳ Redirecting to login...');
        return null;
    }

    if (user && allowedRoles && user.profile && !allowedRoles.includes(user.profile.role)) {
        console.log('[ProtectedRoute] ⏳ Redirecting to correct dashboard...');
        return null;
    }

    console.log('[ProtectedRoute] 🎉 Rendering protected content');
    return <>{children}</>;
}
