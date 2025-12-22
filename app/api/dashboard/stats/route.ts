// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();

        // Get the authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user profile with role
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role, outlet_id')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        let stats = {};

        // Role-specific statistics
        switch (profile.role) {
            case 'superadmin':
                stats = await getSuperAdminStats(supabase);
                break;
            case 'ho_accountant':
                stats = await getHOAccountantStats(supabase);
                break;
            case 'outlet_manager':
                stats = await getManagerStats(supabase, profile.outlet_id);
                break;
            case 'outlet_staff':
                stats = await getStaffStats(supabase, profile.outlet_id);
                break;
            default:
                return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Dashboard stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function getSuperAdminStats(supabase: any) {
    const [outletsResult, usersResult] = await Promise.all([
        supabase.from('outlets').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
    ]);

    return {
        totalStores: outletsResult.count || 0,
        activeUsers: usersResult.count || 0,
        pendingSubmissions: 0, // Will implement with transactions
        lockedDays: 0, // Will implement with daily_records
    };
}

async function getHOAccountantStats(supabase: any) {
    return {
        pendingVerifications: 0, // Will implement with daily_records
        lockedToday: 0,
        flaggedEntries: 0,
        lateSubmissions: 0,
    };
}

async function getManagerStats(supabase: any, outletId: string | null) {
    if (!outletId) {
        return {
            todayStatus: 'No Outlet',
            todayIncome: 0,
            todayExpense: 0,
            transactionCount: 0,
        };
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    return {
        todayStatus: 'Draft', // Will implement with daily_records
        todayIncome: 0,
        todayExpense: 0,
        transactionCount: 0,
    };
}

async function getStaffStats(supabase: any, outletId: string | null) {
    if (!outletId) {
        return {
            cashBalance: 0,
            upiBalance: 0,
            myTransactionsToday: 0,
        };
    }

    return {
        cashBalance: 0,
        upiBalance: 0,
        myTransactionsToday: 0,
    };
}
