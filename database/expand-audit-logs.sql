-- =====================================================================
-- EXPAND AUDIT LOGS TABLE
-- =====================================================================
-- Purpose: Add columns for enhanced audit trail (reason, IP, severity)
-- Created: 2025-12-24
-- Note: Working with existing schema (entity, old_data, new_data columns)
-- =====================================================================

-- Add new columns to audit_logs table if they don't exist
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'normal' 
    CHECK (severity IN ('normal', 'warning', 'critical'));

-- Create index for querying by severity (critical actions first)
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity 
ON audit_logs(severity, created_at DESC);

-- Create index for user activity tracking
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action 
ON audit_logs(user_id, action, created_at DESC);

-- Create index for entity tracking
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
ON audit_logs(entity, entity_id, created_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN audit_logs.reason IS 
'Mandatory for critical actions like unlock_day. Optional for normal actions.';

COMMENT ON COLUMN audit_logs.ip_address IS 
'IP address of the user performing the action (for security audit)';

COMMENT ON COLUMN audit_logs.user_agent IS 
'Browser/client user agent (for device tracking)';

COMMENT ON COLUMN audit_logs.severity IS 
'Severity level: normal (default), warning (important), critical (requires immediate attention)';

-- Verification query - check if new columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'audit_logs'
AND column_name IN ('reason', 'ip_address', 'user_agent', 'severity')
ORDER BY column_name;

SELECT 'audit_logs table expanded successfully' as status;

