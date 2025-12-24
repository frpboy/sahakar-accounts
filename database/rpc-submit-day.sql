-- =====================================================================
-- SUBMIT DAY RPC
-- =====================================================================
-- Purpose: Staff submits draft daily record for HO review
-- Created: 2025-12-24
-- =====================================================================

CREATE OR REPLACE FUNCTION submit_day(
    record_id UUID,
    submitted_by_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    record daily_records%ROWTYPE;
    result JSON;
BEGIN
    -- Get the record
    SELECT * INTO record FROM daily_records WHERE id = record_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Record not found'
        );
    END IF;
    
    -- Validate status is draft
    IF record.status != 'draft' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Can only submit draft records. Current status: ' || record.status
        );
    END IF;
    
    -- Validate required fields (opening balances must be set)
    IF record.opening_cash IS NULL OR record.opening_upi IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Opening balances (cash and UPI) are required before submission'
        );
    END IF;
    
    -- Update status to submitted
    UPDATE daily_records
    SET 
        status = 'submitted',
        submitted_by = submitted_by_user_id,
        submitted_at = NOW(),
        updated_at = NOW()
    WHERE id = record_id;
    
    -- Log to audit_logs
    INSERT INTO audit_logs (
        user_id,
        action,
        entity,
        entity_id,
        new_data
    ) VALUES (
        submitted_by_user_id,
        'submit_day',
        'daily_record',
        record_id,
        json_build_object(
            'old_status', 'draft',
            'new_status', 'submitted',
            'date', record.date,
            'outlet_id', record.outlet_id
        )
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Record submitted successfully for HO review'
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION submit_day(UUID, UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION submit_day(UUID, UUID) IS 
'Staff submits draft daily record for HO accountant review. Validates draft status and required fields before submission.';

-- Verification query
SELECT 'submit_day() function created successfully' as status;
