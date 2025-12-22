// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

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

        if (record.status !== 'draft') {
            return NextResponse.json({ error: 'Record already submitted' }, { status: 400 });
        }

        // Update status to submitted
        const { data, error } = await supabase
            .from('daily_records')
            .update({
                status: 'submitted',
                submitted_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error submitting daily record:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error in POST /api/daily-records/[id]/submit:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
