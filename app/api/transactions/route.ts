// @ts-nocheck
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { TransactionSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        const searchParams = request.nextUrl.searchParams;
        const dailyRecordId = searchParams.get('dailyRecordId');

        let query = supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false });

        if (dailyRecordId) {
            query = query.eq('daily_record_id', dailyRecordId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching transactions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error in GET /api/transactions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        const body = await request.json();

        // Idempotency check - prevents duplicate transactions on retry
        const idempotencyKey = request.headers.get('x-idempotency-key');
        if (idempotencyKey) {
            const { data: existing } = await supabase
                .from('transactions')
                .select('*')
                .eq('idempotency_key', idempotencyKey)
                .maybeSingle();

            if (existing) {
                console.log('[Transactions] Duplicate request detected, returning existing');
                return NextResponse.json(existing);
            }
        }

        // Validate input with Zod schema - prevents injection & invalid data
        const validated = TransactionSchema.parse({
            dailyRecordId: body.dailyRecordId,
            type: body.type,
            category: body.category,
            paymentMode: body.paymentMode,
            amount: typeof body.amount === 'string' ? parseFloat(body.amount) : body.amount,
            description: body.description,
            createdBy: body.createdBy,
        });

        // Insert transaction
        const { data, error } = await supabase
            .from('transactions')
            .insert({
                daily_record_id: validated.dailyRecordId,
                type: validated.type,
                category: validated.category,
                payment_mode: validated.paymentMode,
                amount: validated.amount,
                description: validated.description || null,
                created_by: validated.createdBy || null,
                idempotency_key: idempotencyKey || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating transaction:', error);
            return NextResponse.json(
                { error: 'Failed to create transaction', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        // Zod validation error
        if (error.name === 'ZodError') {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
                },
                { status: 400 }
            );
        }

        // Sanitized error logging - never log sensitive data
        console.error('Error in POST /api/transactions:', {
            message: error.message,
            code: error.code,
        });

        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
