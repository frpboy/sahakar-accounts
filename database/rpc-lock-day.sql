-- =====================================================================
-- LOCK DAY RPC
-- =====================================================================
-- Purpose: HO Accountant locks submitted daily record
-- Created: 2025-12-24
-- =====================================================================

CREATE OR REPLACE FUNCTION lock_day(
    record_id UUID,
    locked_by_user_id UUID,
    lock_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    record daily_records%ROWTYPE;
    user_role TEXT;
BEGIN
    -- Get user role
    SELECT role INTO user_role FROM users WHERE id = locked_by_user_id;
    
    -- Check user has lock permission (HO accountant or superadmin)
    IF user_role NOT IN ('ho_accountant', 'superadmin') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Only HO Accountant or Superadmin can lock records. Your role: ' || user_role
        );
    END IF;
    
    -- Get the record
    SELECT * INTO record FROM daily_records WHERE id = record_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Record not found'
        );
    END IF;
    
    -- Validate status is submitted
    IF record.status != 'submitted' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Can only lock submitted records. Current status: ' || record.status
        );
    END IF;
    
    -- Update status to locked
    UPDATE daily_records
    SET 
        status = 'locked',
        locked_by = locked_by_user_id,
        locked_at = NOW(),
        synced_to_sheet = FALSE,  -- Flag for Google Sheets sync
        updated_at = NOW()
    WHERE id = record_id;
    
    -- Log to audit_logs with reason
    INSERT INTO audit_logs (
        user_id,
        action,
        entity,
        entity_id,
        new_data,
        reason
    ) VALUES (
        locked_by_user_id,
        'lock_day',
        'daily_record',
        record_id,
        json_build_object(
            'old_status', 'submitted',
            'new_status', 'locked',
            'date', record.date,
            'outlet_id', record.outlet_id,
            'total_income', record.total_income,
            'total_expense', record.total_expense
        ),
        COALESCE(lock_reason, 'Locked by HO Accountant')
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Record locked successfully. Ready for audit and Google Sheets sync.'
    );
END;
$$;

-- Grant execute permission to authenticated users (role check is inside function)
GRANT EXECUTE ON FUNCTION lock_day(UUID, UUID, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION lock_day(UUID, UUID, TEXT) IS 
'HO Accountant locks submitted daily record after review. Sets synced_to_sheet flag for Google Sheets sync.';

-- Verification query
SELECT 'lock_day() function created successfully' as status;
