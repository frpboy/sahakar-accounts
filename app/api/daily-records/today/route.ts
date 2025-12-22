import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        const searchParams = request.nextUrl.searchParams;
        const outletId = searchParams.get('outletId') || '9e0c4614-53cf-40d3-abdd-a1d0183c3909';

        // Get today's date in Asia/Kolkata timezone (IST = UTC+5:30)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
        const istTime = new Date(now.getTime() + istOffset);
        const today = istTime.toISOString().split('T')[0];

        // Try to get existing record for today
        const { data: existingRecord } = await supabase
            .from('daily_records')
            .select('*')
            .eq('outlet_id', outletId)
            .eq('date', today)
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
            if (insertError.code === '23505') {
                // Another request created it, fetch and return
                console.log('[DailyRecords] Race condition detected, fetching existing record');
                const { data: raceRecord } = await supabase
                    .from('daily_records')
                    .select('*')
                    .eq('outlet_id', outletId)
                    .eq('date', today)
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
    } catch (error: any) {
        console.error('Error in GET /api/daily-records/today:', {
            message: error.message,
            code: error.code,
        });
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
