export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';

type PatchTransactionBody = {
    type?: 'income' | 'expense';
    category?: string;
    paymentMode?: string;
    amount?: number;
    description?: string | null;
};

type DailyRecordRow = Database['public']['Tables']['daily_records']['Row'];
type UserProfileRow = Database['public']['Tables']['users']['Row'];

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

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createRouteClient();
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
        const typedProfile = profile as Pick<UserProfileRow, 'role' | 'outlet_id'>;
        const profileRole = typedProfile.role;
        const profileOutletId = typedProfile.outlet_id;

        const canEdit = ['outlet_staff', 'outlet_manager', 'master_admin', 'superadmin'].includes(profileRole || '');
        if (!canEdit) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: tx, error: txError } = await supabase
            .from('transactions')
            .select('id,created_by,daily_record_id,created_at')
            .eq('id', (await context.params).id)
            .single();

        if (txError) {
            return NextResponse.json({ error: txError.message }, { status: 500 });
        }
        if (!tx) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        const typedTx = tx as Pick<
            Database['public']['Tables']['transactions']['Row'],
            'id' | 'created_by' | 'daily_record_id' | 'created_at'
        >;

        if (!typedTx.daily_record_id) {
            return NextResponse.json({ error: 'Transaction is missing daily record' }, { status: 500 });
        }

        const { data: dailyRecord } = await supabase
            .from('daily_records')
            .select('id,outlet_id,status,date')
            .eq('id', typedTx.daily_record_id)
            .single();
        const typedDailyRecord = dailyRecord as Pick<DailyRecordRow, 'outlet_id' | 'status' | 'date'> | null;
        const dailyRecordOutletId = typedDailyRecord?.outlet_id;
        const dailyRecordStatus = typedDailyRecord?.status;

        if (!dailyRecord) {
            return NextResponse.json({ error: 'Daily record not found' }, { status: 404 });
        }

        const canSelectOutlet = ['master_admin', 'superadmin', 'ho_accountant'].includes(profileRole || '');
        if (!canSelectOutlet && dailyRecordOutletId !== profileOutletId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (['outlet_staff', 'outlet_manager'].includes(profileRole || '') && dailyRecordStatus !== 'draft') {
            return NextResponse.json({ error: 'Cannot modify non-draft record' }, { status: 409 });
        }

        if (profileRole === 'outlet_staff') {
            if (typedTx.created_by !== session.user.id) {
                return NextResponse.json({ error: 'Forbidden: You can only edit your own entries' }, { status: 403 });
            }
            // Check Duty End for staff
            const bizDate = typedDailyRecord?.date; // Need to select date in query
            if (bizDate) {
                const { data: dutyLog } = await (supabase as any)
                    .from('duty_logs')
                    .select('duty_end')
                    .eq('user_id', session.user.id)
                    .eq('date', bizDate)
                    .maybeSingle();
                if (dutyLog?.duty_end) {
                    return NextResponse.json({ error: 'Forbidden: Cannot edit after duty end' }, { status: 403 });
                }
            }
        }

        if (profileRole === 'outlet_manager') {
            const daysDiff = (new Date().getTime() - new Date(typedTx.created_at || '').getTime()) / (1000 * 3600 * 24);
            if (daysDiff > 30) {
                return NextResponse.json({ error: 'Forbidden: Manager edit window (30 days) expired' }, { status: 403 });
            }
        }

        const body = (await request.json()) as PatchTransactionBody;
        // Enforce submission window lock (2:00–6:59 AM local) for staff/manager
        const now = new Date();
        const hour = now.getHours();
        const isLockWindow = hour >= 2 && hour < 7;
        if (isLockWindow && ['outlet_staff', 'outlet_manager'].includes(profileRole || '')) {
            return NextResponse.json({ error: 'Entries are locked between 2:00–6:59 AM' }, { status: 423 });
        }
        const { id } = await context.params;

        const { type, category, paymentMode, amount, description } = body;

        const updateData: Database['public']['Tables']['transactions']['Update'] = {};
        if (type) updateData.type = type;
        if (category) updateData.category = category;
        if (paymentMode) updateData.payment_modes = paymentMode;
        if (amount !== undefined) updateData.amount = amount;
        if (description !== undefined) updateData.description = description;

        const { data, error } = await (supabase as any)
            .from('transactions')
            .update(updateData as unknown as never)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating transaction:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Audit log
        try {
            const admin = createAdminClient();
            await admin
                .from('audit_logs')
                .insert({
                    user_id: session.user.id,
                    action: 'update_transaction',
                    entity: 'transactions',
                    entity_id: id,
                    old_data: tx as any,
                    new_data: data as any,
                    severity: 'normal',
                } as any);
        } catch { }

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('Error in PATCH /api/transactions/[id]:', { message: getErrorMessage(error) });
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createRouteClient();
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
        const typedProfile = profile as Pick<UserProfileRow, 'role' | 'outlet_id'>;
        const profileRole = typedProfile.role;
        const profileOutletId = typedProfile.outlet_id;

        const canDelete = ['master_admin', 'superadmin', 'ho_accountant'].includes(profileRole || '');
        if (!canDelete) {
            return NextResponse.json({ error: 'Forbidden: Only Admins and HO Accountants can delete entries' }, { status: 403 });
        }

        const { data: tx, error: txError } = await supabase
            .from('transactions')
            .select('id,created_by,daily_record_id')
            .eq('id', (await context.params).id)
            .single();

        if (txError) {
            return NextResponse.json({ error: txError.message }, { status: 500 });
        }
        if (!tx) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        const typedTx = tx as Pick<
            Database['public']['Tables']['transactions']['Row'],
            'id' | 'created_by' | 'daily_record_id'
        >;

        if (!typedTx.daily_record_id) {
            return NextResponse.json({ error: 'Transaction is missing daily record' }, { status: 500 });
        }

        const { data: dailyRecord } = await supabase
            .from('daily_records')
            .select('id,outlet_id,status')
            .eq('id', typedTx.daily_record_id)
            .single();
        const typedDailyRecord = dailyRecord as Pick<DailyRecordRow, 'outlet_id' | 'status'> | null;
        const dailyRecordOutletId = typedDailyRecord?.outlet_id;
        const dailyRecordStatus = typedDailyRecord?.status;

        if (!dailyRecord) {
            return NextResponse.json({ error: 'Daily record not found' }, { status: 404 });
        }

        const canSelectOutlet = ['master_admin', 'superadmin', 'ho_accountant'].includes(profileRole || '');
        if (!canSelectOutlet && dailyRecordOutletId !== profileOutletId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (['outlet_staff', 'outlet_manager'].includes(profileRole || '') && dailyRecordStatus !== 'draft') {
            return NextResponse.json({ error: 'Cannot modify non-draft record' }, { status: 409 });
        }

        if (profileRole === 'outlet_staff' && typedTx.created_by !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await context.params;
        // Enforce submission window lock (2:00–6:59 AM local) for staff/manager
        const now = new Date();
        const hour = now.getHours();
        const isLockWindow = hour >= 2 && hour < 7;
        if (isLockWindow && ['outlet_staff', 'outlet_manager'].includes(profileRole || '')) {
            return NextResponse.json({ error: 'Entries are locked between 2:00–6:59 AM' }, { status: 423 });
        }

        const { error } = await (supabase as any)
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting transaction:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        try {
            const admin = createAdminClient();
            await admin
                .from('audit_logs')
                .insert({
                    user_id: session.user.id,
                    action: 'delete_transaction',
                    entity: 'transactions',
                    entity_id: id,
                    old_data: tx as any,
                    new_data: null,
                    severity: 'warning',
                } as any);
        } catch { }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error in DELETE /api/transactions/[id]:', { message: getErrorMessage(error), code: getErrorCode(error) });
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
