// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { DailyRecord } from '@/lib/temp-types';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient();
        const { id } = params;

        // Get the daily record
        const { data: record, error: fetchError } = await supabase
            .from('daily_records')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !record) {
            return NextResponse.json({ error: 'Daily record not found' }, { status: 404 });
        }

        const typedRecord = record as DailyRecord;

        if (typedRecord.status !== 'submitted') {
            return NextResponse.json({ error: 'Record must be submitted first' }, { status: 400 });
        }

        // Update status to locked
        const { data, error } = await (supabase
            .from('daily_records')
            .update({
                status: 'locked',
                locked_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single() as any);

        if (error) {
            console.error('Error locking daily record:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error in POST /api/daily-records/[id]/lock:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
