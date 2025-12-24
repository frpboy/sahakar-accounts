-- =====================================================================
-- TIME-BOUND ACCESS CONTROL
-- =====================================================================
-- Purpose: Add time-bound access columns and validation function
-- Created: 2025-12-24
-- =====================================================================

-- Add time-bound access columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS access_start_date DATE,
ADD COLUMN IF NOT EXISTS access_end_date DATE;

-- Create function to check if user's access is currently valid
CREATE OR REPLACE FUNCTION is_access_valid(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    current_date DATE := CURRENT_DATE;
    user_role TEXT;
BEGIN
    -- Get user access dates and role
    SELECT access_start_date, access_end_date, role
    INTO start_date, end_date, user_role
    FROM users 
    WHERE id = user_id;
    
    -- If user doesn't exist, return false
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- If user is not an auditor, time bounds don't apply
    IF user_role != 'auditor' THEN
        RETURN TRUE;
    END IF;
    
    -- If no dates set for auditor, access is valid (indefinite)
    IF start_date IS NULL AND end_date IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check if current date is within the valid range
    RETURN (
        (start_date IS NULL OR current_date >= start_date) AND
        (end_date IS NULL OR current_date <= end_date)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get days until access expires
CREATE OR REPLACE FUNCTION days_until_expiry(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    end_date DATE;
    current_date DATE := CURRENT_DATE;
BEGIN
    SELECT access_end_date
    INTO end_date
    FROM users 
    WHERE id = user_id;
    
    -- If no expiry date, return NULL (indefinite access)
    IF end_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Calculate days remaining
    RETURN end_date - current_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for efficient access validation queries
CREATE INDEX IF NOT EXISTS idx_users_access_dates 
ON users(access_end_date) 
WHERE role = 'auditor' AND access_end_date IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN users.access_start_date IS 'Date when user access becomes active (primarily for auditors)';
COMMENT ON COLUMN users.access_end_date IS 'Date when user access expires (primarily for auditors)';
COMMENT ON FUNCTION is_access_valid(UUID) IS 'Checks if a user has valid time-bound access';
COMMENT ON FUNCTION days_until_expiry(UUID) IS 'Returns number of days until access expires, NULL if indefinite';

-- Verification queries
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('access_start_date', 'access_end_date');

-- Test the validation function
SELECT 
    id,
    email,
    role,
    access_start_date,
    access_end_date,
    is_access_valid(id) as has_valid_access,
    days_until_expiry(id) as days_remaining
FROM users
WHERE role = 'auditor';
