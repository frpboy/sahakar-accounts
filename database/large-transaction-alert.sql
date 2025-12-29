-- =====================================================================
-- LARGE TRANSACTION ALERT TRIGGER
-- =====================================================================
-- Purpose: Automatically log an alert if a transaction exceeds ₹10,000
-- Created: 2025-12-25
-- =====================================================================

CREATE OR REPLACE FUNCTION log_large_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_outlet_id UUID;
    v_user_id UUID;
BEGIN
    -- Get the outlet_id from the daily record
    SELECT outlet_id INTO v_outlet_id 
    FROM daily_records 
    WHERE id = NEW.daily_record_id;

    -- Use NEW.created_by or the session user
    v_user_id := COALESCE(NEW.created_by, auth.uid());

    -- Check if transaction amount exceeds threshold (₹10,000)
    IF NEW.amount > 10000 THEN
        INSERT INTO audit_logs (
            user_id,
            outlet_id,
            action,
            entity,
            entity_id,
            new_data,
            severity,
            reason
        ) VALUES (
            v_user_id,
            v_outlet_id,
            'large_transaction_alert',
            'transaction',
            NEW.id,
            json_build_object(
                'amount', NEW.amount,
                'payment_mode', NEW.payment_mode,
                'type', NEW.type,
                'category', NEW.category,
                'description', NEW.description
            ),
            'warning',
            'Transaction exceeds ₹10,000 threshold'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow re-runs
DROP TRIGGER IF EXISTS tr_large_transaction_alert ON transactions;

-- Create the trigger
CREATE TRIGGER tr_large_transaction_alert
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION log_large_transaction();

-- Add comment for documentation
COMMENT ON FUNCTION log_large_transaction() IS 
'Automatically logs a warning in audit_logs when a single transaction amount exceeds ₹10,000.';

-- Verification
SELECT 'large_transaction_alert trigger created successfully' as status;
