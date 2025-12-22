import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Fetch transactions for a specific date
export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const dailyRecordId = searchParams.get('dailyRecordId');

        if (!dailyRecordId) {
            return NextResponse.json({ error: 'dailyRecordId is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('daily_record_id', dailyRecordId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

// POST - Create a new transaction
export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const body = await request.json();

        const { dailyRecordId, type, category, paymentMode, amount, description } = body;

        // Validation
        if (!dailyRecordId || !type || !category || !paymentMode || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (amount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be greater than 0' },
                { status: 400 }
            );
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Insert transaction
        const { data, error } = await supabase
            .from('transactions')
            .insert({
                daily_record_id: dailyRecordId,
                type,
                category,
                payment_mode: paymentMode,
                amount: parseFloat(amount),
                description: description || null,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        console.error('Error creating transaction:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create transaction' },
            { status: 500 }
        );
    }
}
