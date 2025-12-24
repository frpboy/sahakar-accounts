-- =====================================================================
-- UNLOCK DAY RPC
-- =====================================================================
-- Purpose: Superadmin unlocks locked record (emergency only)
-- Created: 2025-12-24
-- =====================================================================

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
BEGIN
    -- Validate reason is provided (mandatory for audit trail)
    IF unlock_reason IS NULL OR trim(unlock_reason) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Unlock reason is mandatory for audit compliance'
        );
    END IF;
    
    -- Get user role
    SELECT role INTO user_role FROM users WHERE id = admin_id;
    
    -- Only superadmin can unlock
    IF user_role != 'superadmin' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Only Superadmin can unlock locked records. Your role: ' || user_role
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
    
    -- Can only unlock locked records
    IF record.status != 'locked' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Can only unlock locked records. Current status: ' || record.status
        );
    END IF;
    
    -- Get the email of who locked it (for notification)
    SELECT email INTO previous_locker_email 
    FROM users 
    WHERE id = record.locked_by;
    
    -- Revert to submitted status
    UPDATE daily_records
    SET 
        status = 'submitted',
        locked_by = NULL,
        locked_at = NULL,
        updated_at = NOW()
    WHERE id = record_id;
    
    -- Log critical action with full context
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
            'locked_by_email', previous_locker_email,
            'locked_at', record.locked_at
        ),
        json_build_object(
            'status', 'submitted',
            'date', record.date,
            'outlet_id', record.outlet_id
        ),
        unlock_reason,
        'critical'
    );
    
    -- TODO: Send notification to HO Accountant (implement in future)
    -- For now, return warning in response
    
    RETURN json_build_object(
        'success', true,
        'message', 'Record unlocked successfully',
        'warning', 'HO Accountant (' || previous_locker_email || ') should be notified about this unlock',
        'unlock_reason', unlock_reason
    );
END;
$$;

-- Grant execute permission to authenticated users (role check is inside function)
GRANT EXECUTE ON FUNCTION unlock_day(UUID, UUID, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION unlock_day(UUID, UUID, TEXT) IS 
'Superadmin emergency unlock of locked records. Requires mandatory reason and logs as critical action.';

-- Verification query
SELECT 'unlock_day() function created successfully' as status;
