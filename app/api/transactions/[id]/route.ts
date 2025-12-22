// @ts-nocheck
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createAdminClient();
        const body = await request.json();
        const { id } = params;

        const { type, category, paymentMode, amount, description } = body;

        const updateData: any = {};
        if (type) updateData.type = type;
        if (category) updateData.category = category;
        if (paymentMode) updateData.payment_mode = paymentMode;
        if (amount !== undefined) updateData.amount = amount;
        if (description !== undefined) updateData.description = description;

        const { data, error } = await supabase
            .from('transactions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating transaction:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error in PATCH /api/transactions/[id]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createAdminClient();
        const { id } = params;

        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting transaction:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in DELETE /api/transactions/[id]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
