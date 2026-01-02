import { createClientBrowser } from '@/lib/supabase-client';
import { getTransactionPermission } from '@/lib/ledger-logic';

/**
 * Posts a Reversal Entry for a given transaction.
 * Adheres to Rule 3: Ledger entries are immutable.
 * Creates a new transaction with opposite type to nullify original.
 */
export async function postReversal(originalTransaction: any, reason: string, userId: string) {
    const supabase = createClientBrowser();

    // 1. Double check permission (Server-side/Logic layer)
    const { data: lockData } = await (supabase as any)
        .from('day_locks')
        .select('is_locked')
        .eq('outlet_id', originalTransaction.outlet_id)
        .eq('date', originalTransaction.ledger_date || originalTransaction.created_at.split('T')[0])
        .maybeSingle();

    const isLocked = lockData?.is_locked || false;

    const perm = getTransactionPermission(
        originalTransaction.ledger_date || originalTransaction.created_at,
        'outlet_manager', // This role should ideally be passed from calling context
        isLocked
    );

    if (!perm.allowed) {
        throw new Error(`Permission Denied: ${perm.reason}`);
    }

    if (!reason || reason.length < 5) {
        throw new Error('Valid reason (min 5 chars) is required for audit trail.');
    }

    // 2. Prepare Reversal Data
    const reversalType = originalTransaction.type === 'income' ? 'expense' : 'income';

    const reversalEntry = {
        outlet_id: originalTransaction.outlet_id,
        daily_record_id: originalTransaction.daily_record_id,
        type: reversalType,
        category: originalTransaction.category,
        payment_mode: originalTransaction.payment_mode,
        amount: originalTransaction.amount,
        description: `REVERSAL: ${reason} (Ref: ${originalTransaction.id.substring(0, 6)})`,
        created_by: userId,
        source_type: 'adjustment',
        source_id: originalTransaction.id,
        is_reversal: true,
        parent_transaction_id: originalTransaction.id,
        ledger_date: new Date().toISOString().split('T')[0],
        idempotency_key: `rev_${originalTransaction.id}_${Date.now()}`
    };

    // 3. Insert Reversal
    const { data, error } = await (supabase as any)
        .from('transactions')
        .insert([reversalEntry])
        .select()
        .single();

    if (error) {
        console.error('Reversal Insert Error:', error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Rule 6: Absolute Day Lock
 * Syncs Daily Record status to day_locks table.
 */
export async function lockBusinessDay(outletId: string, date: string, lockedBy: string) {
    const supabase = createClientBrowser();

    // 1. Update day_locks table (Source of truth for Ledger Blockers)
    const { error: lockError } = await (supabase as any)
        .from('day_locks')
        .upsert({
            outlet_id: outletId,
            date: date,
            is_locked: true,
            locked_at: new Date().toISOString(),
            locked_by: lockedBy
        }, { onConflict: 'outlet_id,date' });

    if (lockError) throw lockError;

    // 2. Log Audit
    const { error: auditError } = await (supabase as any)
        .from('audit_logs')
        .insert({
            user_id: lockedBy,
            action: 'DAY_LOCK',
            entity_type: 'day_locks',
            entity_id: `${outletId}_${date}`,
            details: { date, outletId }
        });

    return { success: true };
}
