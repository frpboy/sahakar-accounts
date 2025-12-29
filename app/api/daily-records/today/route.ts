export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

function getErrorCode(error: unknown): string | undefined {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        const code = (error as Record<string, unknown>).code;
        return typeof code === 'string' ? code : undefined;
    }
    return undefined;
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient<any>({ cookies });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role,outlet_id')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const searchParams = request.nextUrl.searchParams;
        let outletId = searchParams.get('outletId');

        if (outletId) {
            const canSelectOutlet = ['master_admin', 'superadmin', 'ho_accountant'].includes(profile.role);
            if (!canSelectOutlet && outletId !== profile.outlet_id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        } else {
            outletId = profile.outlet_id;
        }

        if (!outletId) {
            return NextResponse.json({ error: 'Outlet ID is required or not assigned to user' }, { status: 400 });
        }

        // Get today's date in Asia/Kolkata timezone (IST = UTC+5:30)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
        const istTime = new Date(now.getTime() + istOffset);
        const today = istTime.toISOString().split('T')[0];

        // Try to get existing record for today
        const { data: existingRecord } = await supabase
            .from('daily_records')
            .select('id,date,outlet_id,opening_cash,opening_upi,closing_cash,closing_upi,total_income,total_expense,status')
            .eq('outlet_id', outletId)
            .eq('date', today)
            .limit(1)
            .maybeSingle();

        if (existingRecord) {
            return NextResponse.json(existingRecord);
        }

        // Get previous day's closing balance (also in IST)
        const yesterday = new Date(istTime);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const { data: previousRecord } = await supabase
            .from('daily_records')
            .select('closing_cash, closing_upi')
            .eq('outlet_id', outletId)
            .eq('date', yesterdayStr)
            .maybeSingle();

        // Create new record - handles race conditions at database level
        const { data: newRecord, error: insertError } = await supabase
            .from('daily_records')
            .insert({
                outlet_id: outletId,
                date: today,
                opening_cash: previousRecord?.closing_cash || 0,
                opening_upi: previousRecord?.closing_upi || 0,
                closing_cash: previousRecord?.closing_cash || 0,
                closing_upi: previousRecord?.closing_upi || 0,
                total_income: 0,
                total_expense: 0,
                status: 'draft',
            })
            .select()
            .single();

        if (insertError) {
            // Check if it's a duplicate key error (race condition)
            if (getErrorCode(insertError) === '23505') {
                // Another request created it, fetch and return
                console.log('[DailyRecords] Race condition detected, fetching existing record');
                const { data: raceRecord } = await supabase
                    .from('daily_records')
                    .select('id,date,outlet_id,opening_cash,opening_upi,closing_cash,closing_upi,total_income,total_expense,status')
                    .eq('outlet_id', outletId)
                    .eq('date', today)
                    .limit(1)
                    .single();

                return NextResponse.json(raceRecord);
            }

            console.error('Error creating daily record:', insertError);
            return NextResponse.json(
                { error: 'Failed to create daily record', details: insertError.message },
                { status: 500 }
            );
        }

        return NextResponse.json(newRecord, { status: 201 });
    } catch (error: unknown) {
        console.error('Error in GET /api/daily-records/today:', {
            message: getErrorMessage(error),
            code: getErrorCode(error),
        });
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
