import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// PATCH - Update a transaction
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient();
        const body = await request.json();
        const { id } = params;

        const { type, category, paymentMode, amount, description } = body;

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Update transaction
        const { data, error } = await supabase
            .from('transactions')
            .update({
                ...(type && { type }),
                ...(category && { category }),
                ...(paymentMode && { payment_mode: paymentMode }),
                ...(amount && { amount: parseFloat(amount) }),
                ...(description !== undefined && { description }),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error updating transaction:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update transaction' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a transaction
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient();
        const { id } = params;

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete transaction' },
            { status: 500 }
        );
    }
}
