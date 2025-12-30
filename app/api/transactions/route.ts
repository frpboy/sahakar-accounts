export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { TransactionSchema } from '@/lib/validation';
import { ZodError } from 'zod';
import { createRouteClient, createAdminClient } from '@/lib/supabase-server';
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
        const typedProfile = profile as Pick<Database['public']['Tables']['users']['Row'], 'role' | 'outlet_id'>;
        const profileRole = typedProfile.role;
        const profileOutletId = typedProfile.outlet_id;

        const searchParams = request.nextUrl.searchParams;
        const dailyRecordId = searchParams.get('dailyRecordId');

        const canListWithoutDailyRecord = ['master_admin', 'superadmin', 'ho_accountant'].includes(profileRole || '');
        if (!dailyRecordId && !canListWithoutDailyRecord) {
            return NextResponse.json({ error: 'dailyRecordId is required' }, { status: 400 });
        }

        if (dailyRecordId) {
            const { data: dailyRecord } = await supabase
                .from('daily_records')
                .select('id,outlet_id')
                .eq('id', dailyRecordId)
                .single();

            if (!dailyRecord) {
                return NextResponse.json({ error: 'Daily record not found' }, { status: 404 });
            }

            const canSelectOutlet = ['master_admin', 'superadmin', 'ho_accountant'].includes(profileRole || '');
            const typedDailyRecord = dailyRecord as Pick<Database['public']['Tables']['daily_records']['Row'], 'outlet_id'>;
            const dailyRecordOutletId = typedDailyRecord.outlet_id;
            if (!canSelectOutlet && dailyRecordOutletId !== profileOutletId) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        let query = supabase
            .from('transactions')
            .select('id,daily_record_id,type,category,payment_mode,amount,description,created_at')
            .order('created_at', { ascending: false })
            .limit(50); // Limit to recent 50 transactions

        if (dailyRecordId) {
            query = query.eq('daily_record_id', dailyRecordId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching transactions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('Error in GET /api/transactions:', {
            message: getErrorMessage(error),
            code: getErrorCode(error),
        });
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
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
        const typedProfile = profile as Pick<Database['public']['Tables']['users']['Row'], 'role' | 'outlet_id'>;
        const profileRole = typedProfile.role;
        const profileOutletId = typedProfile.outlet_id;

        const canCreateTransaction = ['outlet_staff', 'outlet_manager', 'master_admin', 'superadmin'].includes(profileRole || '');
        if (!canCreateTransaction) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        // Enforce submission window lock (2:00–6:59 AM local) for staff/manager
        const now = new Date();
        const hour = now.getHours();
        const isLockWindow = hour >= 2 && hour < 7;
        if (isLockWindow && ['outlet_staff', 'outlet_manager'].includes(profileRole || '')) {
            return NextResponse.json({ error: 'Entries are locked between 2:00–6:59 AM' }, { status: 423 });
        }

        // Idempotency check - prevents duplicate transactions on retry
        const idempotencyKey = request.headers.get('x-idempotency-key');
        if (idempotencyKey) {
            const { data: existing } = await supabase
                .from('transactions')
                .select('id,daily_record_id,type,category,payment_mode,amount,description,created_at')
                .eq('idempotency_key', idempotencyKey)
                .limit(1)
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
            createdBy: session.user.id,
        });

        const { data: dailyRecord } = await supabase
            .from('daily_records')
            .select('id,outlet_id,status')
            .eq('id', validated.dailyRecordId)
            .single();

        if (!dailyRecord) {
            return NextResponse.json({ error: 'Daily record not found' }, { status: 404 });
        }

        const canSelectOutlet = ['master_admin', 'superadmin', 'ho_accountant'].includes(profileRole || '');
        const typedDailyRecord = dailyRecord as Pick<Database['public']['Tables']['daily_records']['Row'], 'outlet_id' | 'status'>;
        const dailyRecordOutletId = typedDailyRecord.outlet_id;
        const dailyRecordStatus = typedDailyRecord.status;
        if (!canSelectOutlet && dailyRecordOutletId !== profileOutletId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (['outlet_staff', 'outlet_manager'].includes(profileRole || '') && dailyRecordStatus !== 'draft') {
            return NextResponse.json({ error: 'Cannot modify non-draft record' }, { status: 409 });
        }

        // Insert transaction
        const insertPayload: Database['public']['Tables']['transactions']['Insert'] = {
            daily_record_id: validated.dailyRecordId,
            type: validated.type,
            category: validated.category,
            payment_mode: validated.paymentMode,
            amount: validated.amount,
            description: validated.description || null,
            created_by: validated.createdBy || null,
            idempotency_key: idempotencyKey || null,
        };
        const { data, error } = await supabase
            .from('transactions')
            .insert(insertPayload as unknown as never)
            .select()
            .single();

        if (error) {
            console.error('Error creating transaction:', error);
            return NextResponse.json(
                { error: 'Failed to create transaction', details: error.message },
                { status: 500 }
            );
        }

        // Audit log
        try {
            const admin = createAdminClient();
            await admin
                .from('audit_logs')
                .insert({
                    user_id: session.user.id,
                    action: 'create_transaction',
                    entity: 'transactions',
                    entity_id: (data as any)?.id,
                    old_data: null,
                    new_data: data as any,
                    severity: 'normal',
                } as any);
        } catch {}

        return NextResponse.json(data, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
                },
                { status: 400 }
            );
        }

        // Sanitized error logging - never log sensitive data
        console.error('Error in POST /api/transactions:', {
            message: getErrorMessage(error),
            code: getErrorCode(error),
        });

        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
