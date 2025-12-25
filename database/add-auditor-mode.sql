-- =====================================================
-- PHASE 1: Auditor Mode - Database Migration (Updated)
-- =====================================================
-- This migration adds missing auditor features to existing schema

-- 1. Add time-bound access tracking columns to users table
-- (access_start_date and access_end_date already exist)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auditor_access_granted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auditor_access_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auditor_access_granted_by UUID REFERENCES users(id);

-- Create index for expiry checks
CREATE INDEX IF NOT EXISTS idx_users_auditor_expiry 
ON users(auditor_access_expires_at)
WHERE role = 'auditor';

-- 2. Update auditor_access_log to match our needs
-- (Table already exists, just ensure it has what we need)

-- 3. Add RLS policies for auditor read-only access

-- Enable RLS on tables if not already enabled
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditor_access_log ENABLE ROW LEVEL SECURITY;

-- Drop existing auditor policies if they exist (to recreate them)
DROP POLICY IF EXISTS "auditors_view_locked_records" ON daily_records;
DROP POLICY IF EXISTS "auditors_view_transactions" ON transactions;
DROP POLICY IF EXISTS "auditors_view_own_actions" ON auditor_access_log;
DROP POLICY IF EXISTS "admins_view_all_auditor_actions" ON auditor_access_log;

-- Auditors can only view LOCKED daily records with valid access
CREATE POLICY "auditors_view_locked_records"
ON daily_records FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'auditor'
    AND (auditor_access_expires_at IS NULL OR auditor_access_expires_at > NOW())
  )
  AND status = 'locked'
);

-- Auditors can view transactions for locked records only
CREATE POLICY "auditors_view_transactions"
ON transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'auditor'
    AND (auditor_access_expires_at IS NULL OR auditor_access_expires_at > NOW())
  )
  AND daily_record_id IN (
    SELECT id FROM daily_records WHERE status = 'locked'
  )
);

-- Auditors can only view their own access logs
CREATE POLICY "auditors_view_own_actions"
ON auditor_access_log FOR SELECT
TO authenticated
USING (auditor_id = auth.uid());

-- Admins can view all auditor actions
CREATE POLICY "admins_view_all_auditor_actions"
ON auditor_access_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('master_admin', 'superadmin')
  )
);

-- System can insert auditor actions (for logging)
DROP POLICY IF EXISTS "system_insert_auditor_actions" ON auditor_access_log;
CREATE POLICY "system_insert_auditor_actions"
ON auditor_access_log FOR INSERT
TO authenticated
WITH CHECK (auditor_id = auth.uid());

-- 4. Ensure auditors CANNOT modify anything (defensive policies)

-- Prevent auditors from inserting daily records
DROP POLICY IF EXISTS "auditors_cannot_insert_daily_records" ON daily_records;
CREATE POLICY "auditors_cannot_insert_daily_records"
ON daily_records FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'auditor'
  )
);

-- Prevent auditors from updating daily records
DROP POLICY IF EXISTS "auditors_cannot_update_daily_records" ON daily_records;
CREATE POLICY "auditors_cannot_update_daily_records"
ON daily_records FOR UPDATE
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'auditor'
  )
);

-- Prevent auditors from deleting daily records
DROP POLICY IF EXISTS "auditors_cannot_delete_daily_records" ON daily_records;
CREATE POLICY "auditors_cannot_delete_daily_records"
ON daily_records FOR DELETE
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'auditor'
  )
);

-- Same for transactions
DROP POLICY IF EXISTS "auditors_cannot_insert_transactions" ON transactions;
CREATE POLICY "auditors_cannot_insert_transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'auditor'
  )
);

DROP POLICY IF EXISTS "auditors_cannot_update_transactions" ON transactions;
CREATE POLICY "auditors_cannot_update_transactions"
ON transactions FOR UPDATE
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'auditor'
  )
);

DROP POLICY IF EXISTS "auditors_cannot_delete_transactions" ON transactions;
CREATE POLICY "auditors_cannot_delete_transactions"
ON transactions FOR DELETE
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'auditor'
  )
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auditor_access_log_auditor 
ON auditor_access_log(auditor_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_auditor_access_log_accessed 
ON auditor_access_log(accessed_at DESC);

-- 6. Add comments for documentation
COMMENT ON COLUMN users.auditor_access_granted_at IS 'Timestamp when auditor access was granted';
COMMENT ON COLUMN users.auditor_access_expires_at IS 'Timestamp when auditor access expires';
COMMENT ON COLUMN users.auditor_access_granted_by IS 'Admin user who granted the access';
COMMENT ON TABLE auditor_access_log IS 'Logs all actions performed by auditors for compliance tracking';

-- Migration complete
SELECT 'Auditor mode migration completed successfully' AS status;
