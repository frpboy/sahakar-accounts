import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Get today's daily record for the user's outlet
export async function GET() {
    try {
        const supabase = createServerClient();

        // Get current user and their profile
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('outlet_id, role')
            .eq('id', user.id)
            .single();

        if (!profile?.outlet_id) {
            return NextResponse.json({ error: 'No outlet assigned' }, { status: 400 });
        }

        // Get today's date
        const today = new Date().toISOString().split('T')[0];

        // Check if today's record exists
        let { data: dailyRecord, error } = await supabase
            .from('daily_records')
            .select('*')
            .eq('outlet_id', profile.outlet_id)
            .eq('date', today)
            .single();

        // If doesn't exist, create it
        if (error && error.code === 'PGRST116') {
            // Get yesterday's closing balance for opening balance
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayDate = yesterday.toISOString().split('T')[0];

            const { data: yesterdayRecord } = await supabase
                .from('daily_records')
                .select('closing_cash, closing_upi')
                .eq('outlet_id', profile.outlet_id)
                .eq('date', yesterdayDate)
                .single();

            // Create today's record
            const { data: newRecord, error: createError } = await supabase
                .from('daily_records')
                .insert({
                    outlet_id: profile.outlet_id,
                    date: today,
                    opening_cash: yesterdayRecord?.closing_cash || 0,
                    opening_upi: yesterdayRecord?.closing_upi || 0,
                    status: 'draft',
                })
                .select()
                .single();

            if (createError) throw createError;
            dailyRecord = newRecord;
        } else if (error) {
            throw error;
        }

        return NextResponse.json(dailyRecord);
    } catch (error: any) {
        console.error('Error getting today record:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get today record' },
            { status: 500 }
        );
    }
}
