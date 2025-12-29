export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';
import { createRouteClient } from '@/lib/supabase-server';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

type Stats =
    | { totalStores: number; activeUsers: number; pendingSubmissions: number; lockedDays: number }
    | { pendingVerifications: number; lockedToday: number; flaggedEntries: number; lateSubmissions: number }
    | { todayStatus: string; todayIncome: number; todayExpense: number; transactionCount: number }
    | { cashBalance: number; upiBalance: number; myTransactionsToday: number };

type RouteClient = ReturnType<typeof createRouteClient>;
type UserProfile = Pick<Database['public']['Tables']['users']['Row'], 'role' | 'outlet_id'>;

export async function GET() {
    try {
        const sessionClient = createRouteClient();
        const { data: { session } } = await sessionClient.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile, error: profileError } = await sessionClient
            .from('users')
            .select('role, outlet_id')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const typedProfile = profile as UserProfile;
        let stats: Stats;

        // Role-specific statistics
        switch (typedProfile.role) {
            case 'superadmin':
                stats = await getSuperAdminStats(sessionClient);
                break;
            case 'ho_accountant':
                stats = await getHOAccountantStats(sessionClient);
                break;
            case 'outlet_manager':
                stats = await getManagerStats(sessionClient, typedProfile.outlet_id);
                break;
            case 'outlet_staff':
                stats = await getStaffStats(sessionClient, typedProfile.outlet_id, session.user.id);
                break;
            default:
                return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        return NextResponse.json(stats);
    } catch (error: unknown) {
        console.error('Dashboard stats error:', error);
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

async function getSuperAdminStats(supabase: RouteClient) {
    const [outletsResult, usersResult, submittedResult, lockedResult] = await Promise.all([
        supabase.from('outlets').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('daily_records').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('daily_records').select('id', { count: 'exact', head: true }).eq('status', 'locked'),
    ]);

    return {
        totalStores: outletsResult.count || 0,
        activeUsers: usersResult.count || 0,
        pendingSubmissions: submittedResult.count || 0,
        lockedDays: lockedResult.count || 0,
    };
}

async function getHOAccountantStats(supabase: RouteClient) {
    const today = new Date().toISOString().split('T')[0];
    const [pendingVerificationsResult, lockedTodayResult] = await Promise.all([
        supabase.from('daily_records').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('daily_records').select('id', { count: 'exact', head: true }).eq('status', 'locked').eq('date', today),
    ]);

    return {
        pendingVerifications: pendingVerificationsResult.count || 0,
        lockedToday: lockedTodayResult.count || 0,
        flaggedEntries: 0,
        lateSubmissions: 0,
    };
}

async function getManagerStats(supabase: RouteClient, outletId: string | null) {
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

    const { data: recordRaw } = await supabase
        .from('daily_records')
        .select('id,status,total_income,total_expense')
        .eq('outlet_id', outletId)
        .eq('date', today)
        .maybeSingle();

    const record = recordRaw as Pick<
        Database['public']['Tables']['daily_records']['Row'],
        'id' | 'status' | 'total_income' | 'total_expense'
    > | null;

    if (!record) {
        return {
            todayStatus: 'No Record',
            todayIncome: 0,
            todayExpense: 0,
            transactionCount: 0,
        };
    }

    const { count: transactionCount } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('daily_record_id', record.id);

    return {
        todayStatus: record.status ?? 'Unknown',
        todayIncome: Number(record.total_income || 0),
        todayExpense: Number(record.total_expense || 0),
        transactionCount: transactionCount || 0,
    };
}

async function getStaffStats(supabase: RouteClient, outletId: string | null, userId: string) {
    if (!outletId) {
        return {
            cashBalance: 0,
            upiBalance: 0,
            myTransactionsToday: 0,
        };
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: recordRaw } = await supabase
        .from('daily_records')
        .select('id,opening_cash,opening_upi,closing_cash,closing_upi,status')
        .eq('outlet_id', outletId)
        .eq('date', today)
        .maybeSingle();

    const record = recordRaw as Pick<
        Database['public']['Tables']['daily_records']['Row'],
        'id' | 'opening_cash' | 'opening_upi' | 'closing_cash' | 'closing_upi' | 'status'
    > | null;

    if (!record) {
        return {
            cashBalance: 0,
            upiBalance: 0,
            myTransactionsToday: 0,
        };
    }

    const cashBalance = record.status === 'draft' ? Number(record.opening_cash || 0) : Number(record.closing_cash || 0);
    const upiBalance = record.status === 'draft' ? Number(record.opening_upi || 0) : Number(record.closing_upi || 0);

    const { count: myTransactionsToday } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('daily_record_id', record.id)
        .eq('created_by', userId);

    return {
        cashBalance,
        upiBalance,
        myTransactionsToday: myTransactionsToday || 0,
    };
}
