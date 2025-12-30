CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP POLICY IF EXISTS "Manage monthly closures" ON monthly_closures;

DROP POLICY IF EXISTS "Insert open monthly closure" ON monthly_closures;
CREATE POLICY "Insert open monthly closure" ON monthly_closures
FOR INSERT
WITH CHECK (
    status = 'open'
    AND closed_at IS NULL
    AND closed_by IS NULL
    AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND (
            u.role IN ('superadmin', 'master_admin', 'ho_accountant')
            OR u.outlet_id = monthly_closures.outlet_id
        )
    )
);

DROP POLICY IF EXISTS "Close month updates" ON monthly_closures;
CREATE POLICY "Close month updates" ON monthly_closures
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('superadmin', 'master_admin', 'ho_accountant')
    )
)
WITH CHECK (status = 'closed');

DROP POLICY IF EXISTS "Reopen month updates" ON monthly_closures;
CREATE POLICY "Reopen month updates" ON monthly_closures
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('superadmin', 'master_admin')
    )
)
WITH CHECK (
    status = 'open'
    AND reopened_at IS NOT NULL
    AND reopened_by IS NOT NULL
    AND reopen_reason IS NOT NULL
);

ALTER TABLE monthly_closures
ADD COLUMN IF NOT EXISTS opening_upi DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS closing_upi DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS days_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reopened_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reopen_reason TEXT;

CREATE TABLE IF NOT EXISTS monthly_closure_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_id UUID REFERENCES outlets(id) NOT NULL,
    month_date DATE NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    snapshot JSONB NOT NULL,
    snapshot_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) NOT NULL,
    UNIQUE(outlet_id, month_date, version)
);

CREATE INDEX IF NOT EXISTS idx_monthly_closure_snapshots_outlet_month
ON monthly_closure_snapshots(outlet_id, month_date);

ALTER TABLE monthly_closure_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View monthly closure snapshots" ON monthly_closure_snapshots;
CREATE POLICY "View monthly closure snapshots" ON monthly_closure_snapshots
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND (
            role IN ('superadmin', 'master_admin', 'ho_accountant', 'auditor')
            OR outlet_id = monthly_closure_snapshots.outlet_id
        )
    )
);

DROP POLICY IF EXISTS "Manage monthly closure snapshots" ON monthly_closure_snapshots;
CREATE POLICY "Manage monthly closure snapshots" ON monthly_closure_snapshots
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('superadmin', 'master_admin', 'ho_accountant')
    )
);

CREATE OR REPLACE FUNCTION close_month(
    outlet_id_param UUID,
    month_param DATE,
    closed_by_user_id UUID,
    close_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    month_start DATE;
    month_end DATE;
    user_role TEXT;
    closure_row monthly_closures%ROWTYPE;
    non_locked_count INTEGER;
    records_count INTEGER;
    opening_cash_val NUMERIC;
    opening_upi_val NUMERIC;
    closing_cash_val NUMERIC;
    closing_upi_val NUMERIC;
    total_income_val NUMERIC;
    total_expense_val NUMERIC;
    snapshot_version INTEGER;
    snapshot_json JSONB;
    snapshot_hash_val TEXT;
BEGIN
    month_start := date_trunc('month', month_param)::DATE;
    month_end := (month_start + INTERVAL '1 month')::DATE;

    SELECT role INTO user_role FROM users WHERE id = closed_by_user_id;
    IF user_role NOT IN ('ho_accountant', 'master_admin', 'superadmin') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Forbidden'
        );
    END IF;

    INSERT INTO monthly_closures (outlet_id, month_date, status)
    VALUES (outlet_id_param, month_start, 'open')
    ON CONFLICT (outlet_id, month_date) DO NOTHING;

    SELECT * INTO closure_row
    FROM monthly_closures
    WHERE outlet_id = outlet_id_param
    AND month_date = month_start
    FOR UPDATE;

    IF closure_row.status = 'closed' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Month is already closed'
        );
    END IF;

    SELECT COUNT(*) INTO non_locked_count
    FROM daily_records
    WHERE outlet_id = outlet_id_param
    AND date >= month_start
    AND date < month_end
    AND status != 'locked';

    IF non_locked_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'All days must be locked before month closure'
        );
    END IF;

    SELECT COUNT(*) INTO records_count
    FROM daily_records
    WHERE outlet_id = outlet_id_param
    AND date >= month_start
    AND date < month_end
    AND status = 'locked';

    IF records_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No locked days found for this month'
        );
    END IF;

    SELECT opening_cash, opening_upi
    INTO opening_cash_val, opening_upi_val
    FROM daily_records
    WHERE outlet_id = outlet_id_param
    AND date >= month_start
    AND date < month_end
    AND status = 'locked'
    ORDER BY date ASC
    LIMIT 1;

    SELECT closing_cash, closing_upi
    INTO closing_cash_val, closing_upi_val
    FROM daily_records
    WHERE outlet_id = outlet_id_param
    AND date >= month_start
    AND date < month_end
    AND status = 'locked'
    ORDER BY date DESC
    LIMIT 1;

    SELECT
        COALESCE(SUM(total_income), 0),
        COALESCE(SUM(total_expense), 0)
    INTO total_income_val, total_expense_val
    FROM daily_records
    WHERE outlet_id = outlet_id_param
    AND date >= month_start
    AND date < month_end
    AND status = 'locked';

    SELECT COALESCE(MAX(version), 0) + 1
    INTO snapshot_version
    FROM monthly_closure_snapshots
    WHERE outlet_id = outlet_id_param
    AND month_date = month_start;

    SELECT jsonb_build_object(
        'outlet_id', outlet_id_param,
        'month_date', month_start,
        'closed_at', NOW(),
        'closed_by', closed_by_user_id,
        'days_count', records_count,
        'opening_cash', opening_cash_val,
        'opening_upi', opening_upi_val,
        'closing_cash', closing_cash_val,
        'closing_upi', closing_upi_val,
        'total_income', total_income_val,
        'total_expense', total_expense_val,
        'daily_records', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', dr.id,
                    'date', dr.date,
                    'opening_cash', dr.opening_cash,
                    'opening_upi', dr.opening_upi,
                    'closing_cash', dr.closing_cash,
                    'closing_upi', dr.closing_upi,
                    'total_income', dr.total_income,
                    'total_expense', dr.total_expense,
                    'status', dr.status,
                    'submitted_at', dr.submitted_at,
                    'submitted_by', dr.submitted_by,
                    'locked_at', dr.locked_at,
                    'locked_by', dr.locked_by
                )
                ORDER BY dr.date
            )
            FROM daily_records dr
            WHERE dr.outlet_id = outlet_id_param
            AND dr.date >= month_start
            AND dr.date < month_end
        ), '[]'::jsonb),
        'category_totals', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'type', x.type,
                    'category', x.category,
                    'payment_mode', x.payment_mode,
                    'total_amount', x.total_amount,
                    'count', x.cnt
                )
                ORDER BY x.type, x.category, x.payment_mode
            )
            FROM (
                SELECT
                    t.type,
                    t.category,
                    t.payment_mode,
                    SUM(t.amount) AS total_amount,
                    COUNT(*) AS cnt
                FROM transactions t
                JOIN daily_records dr ON dr.id = t.daily_record_id
                WHERE dr.outlet_id = outlet_id_param
                AND dr.date >= month_start
                AND dr.date < month_end
                GROUP BY t.type, t.category, t.payment_mode
            ) x
        ), '[]'::jsonb)
    )
    INTO snapshot_json;

    snapshot_hash_val := encode(digest(snapshot_json::text, 'sha256'), 'hex');

    INSERT INTO monthly_closure_snapshots (
        outlet_id,
        month_date,
        version,
        snapshot,
        snapshot_hash,
        created_by
    ) VALUES (
        outlet_id_param,
        month_start,
        snapshot_version,
        snapshot_json,
        snapshot_hash_val,
        closed_by_user_id
    );

    UPDATE monthly_closures
    SET
        status = 'closed',
        closed_at = NOW(),
        closed_by = closed_by_user_id,
        opening_cash = COALESCE(opening_cash_val, 0),
        opening_upi = COALESCE(opening_upi_val, 0),
        closing_cash = COALESCE(closing_cash_val, 0),
        closing_upi = COALESCE(closing_upi_val, 0),
        total_income = COALESCE(total_income_val, 0),
        total_expense = COALESCE(total_expense_val, 0),
        days_count = records_count,
        updated_at = NOW()
    WHERE id = closure_row.id;

    INSERT INTO audit_logs (
        user_id,
        action,
        entity,
        entity_id,
        new_data,
        reason,
        severity
    ) VALUES (
        closed_by_user_id,
        'close_month',
        'monthly_closures',
        closure_row.id,
        json_build_object(
            'outlet_id', outlet_id_param,
            'month_date', month_start,
            'snapshot_version', snapshot_version,
            'snapshot_hash', snapshot_hash_val,
            'days_count', records_count,
            'total_income', total_income_val,
            'total_expense', total_expense_val
        ),
        close_reason,
        'critical'
    );

    RETURN json_build_object(
        'success', true,
        'message', 'Month closed successfully',
        'month_date', month_start,
        'snapshot_version', snapshot_version,
        'snapshot_hash', snapshot_hash_val
    );
END;
$$;

GRANT EXECUTE ON FUNCTION close_month(UUID, DATE, UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION reopen_month(
    outlet_id_param UUID,
    month_param DATE,
    reopened_by_user_id UUID,
    reopen_reason_param TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    month_start DATE;
    user_role TEXT;
    closure_row monthly_closures%ROWTYPE;
BEGIN
    month_start := date_trunc('month', month_param)::DATE;

    IF reopen_reason_param IS NULL OR trim(reopen_reason_param) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Reopen reason is required'
        );
    END IF;

    SELECT role INTO user_role FROM users WHERE id = reopened_by_user_id;
    IF user_role NOT IN ('master_admin', 'superadmin') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Forbidden'
        );
    END IF;

    SELECT * INTO closure_row
    FROM monthly_closures
    WHERE outlet_id = outlet_id_param
    AND month_date = month_start
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Month closure record not found'
        );
    END IF;

    IF closure_row.status != 'closed' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Month is not closed'
        );
    END IF;

    UPDATE monthly_closures
    SET
        status = 'open',
        reopened_at = NOW(),
        reopened_by = reopened_by_user_id,
        reopen_reason = reopen_reason_param,
        updated_at = NOW()
    WHERE id = closure_row.id;

    INSERT INTO audit_logs (
        user_id,
        action,
        entity,
        entity_id,
        old_data,
        new_data,
        reason,
        severity
    ) VALUES (
        reopened_by_user_id,
        'reopen_month',
        'monthly_closures',
        closure_row.id,
        json_build_object(
            'status', 'closed'
        ),
        json_build_object(
            'status', 'open'
        ),
        reopen_reason_param,
        'critical'
    );

    RETURN json_build_object(
        'success', true,
        'message', 'Month reopened successfully',
        'month_date', month_start
    );
END;
$$;

GRANT EXECUTE ON FUNCTION reopen_month(UUID, DATE, UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION unlock_day(
    record_id UUID,
    admin_id UUID,
    unlock_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    record daily_records%ROWTYPE;
    user_role TEXT;
    previous_locker_email TEXT;
    month_start DATE;
    closure_status TEXT;
BEGIN
    IF unlock_reason IS NULL OR trim(unlock_reason) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unlock reason is mandatory for audit compliance'
        );
    END IF;

    SELECT role INTO user_role FROM users WHERE id = admin_id;

    IF user_role != 'master_admin' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unauthorized: Only Master Admin can unlock records.'
        );
    END IF;

    SELECT * INTO record FROM daily_records WHERE id = record_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Record not found'
        );
    END IF;

    month_start := date_trunc('month', record.date)::DATE;

    SELECT status INTO closure_status
    FROM monthly_closures
    WHERE outlet_id = record.outlet_id
    AND month_date = month_start;

    IF closure_status = 'closed' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cannot unlock records in a closed month'
        );
    END IF;

    IF date_trunc('month', record.date) < date_trunc('month', NOW()) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Month-End Closure: Records from previous months cannot be unlocked for security and audit integrity.'
        );
    END IF;

    IF record.status != 'locked' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Can only unlock locked records. Current status: ' || record.status
        );
    END IF;

    SELECT email INTO previous_locker_email
    FROM users
    WHERE id = record.locked_by;

    UPDATE daily_records
    SET
        status = 'submitted',
        locked_by = NULL,
        locked_at = NULL,
        updated_at = NOW()
    WHERE id = record_id;

    INSERT INTO audit_logs (
        user_id,
        action,
        entity,
        entity_id,
        old_data,
        new_data,
        reason,
        severity
    ) VALUES (
        admin_id,
        'unlock_day',
        'daily_record',
        record_id,
        json_build_object(
            'status', 'locked',
            'locked_by', record.locked_by,
            'locked_by_email', previous_locker_email
        ),
        json_build_object(
            'status', 'submitted'
        ),
        unlock_reason,
        'critical'
    );

    RETURN json_build_object(
        'success', true,
        'message', 'Record unlocked successfully',
        'unlock_reason', unlock_reason
    );
END;
$$;

GRANT EXECUTE ON FUNCTION unlock_day(UUID, UUID, TEXT) TO authenticated;

