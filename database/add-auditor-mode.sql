-- =====================================================
-- STEP 2: Auditor Mode - Database Migration
-- =====================================================
-- This migration adds auditor access control features:
-- 1. Time-bound access for auditors
-- 2. RLS policies for read-only enforcement
-- 3. Auditor action logging

-- Add time-bound access columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auditor_access_granted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auditor_access_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auditor_access_granted_by UUID REFERENCES users(id);

-- Create index for expiry checks
CREATE INDEX IF NOT EXISTS idx_users_auditor_expiry 
ON users(auditor_access_expires_at)
WHERE role = 'auditor';

-- Create auditor actions log table
CREATE TABLE IF NOT EXISTS auditor_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auditor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'view_record', 'export_pdf', 'export_sheet', 'view_report'
  resource_type TEXT NOT NULL, -- 'daily_record', 'transaction', 'report'
  resource_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for auditor_actions
CREATE INDEX IF NOT EXISTS idx_auditor_actions_auditor 
ON auditor_actions(auditor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auditor_actions_created 
ON auditor_actions(created_at DESC);

-- Enable RLS on auditor_actions
ALTER TABLE auditor_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Auditors can only view their own actions
CREATE POLICY IF NOT EXISTS "auditors_view_own_actions"
ON auditor_actions FOR SELECT
TO authenticated
USING (auditor_id = auth.uid());

-- RLS Policy: Admins can view all auditor actions
CREATE POLICY IF NOT EXISTS "admins_view_all_auditor_actions"
ON auditor_actions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('master_admin', 'superadmin')
  )
);

-- RLS Policy: System can insert auditor actions (for logging)
CREATE POLICY IF NOT EXISTS "system_insert_auditor_actions"
ON auditor_actions FOR INSERT
TO authenticated
WITH CHECK (auditor_id = auth.uid());

-- Update daily_records RLS for auditors
-- Auditors can only view LOCKED records and only if their access hasn't expired
CREATE POLICY IF NOT EXISTS "auditors_view_locked_records"
ON daily_records FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'auditor'
    AND auditor_access_expires_at > NOW()
  )
  AND status = 'locked'
);

-- Update transactions RLS for auditors
-- Auditors can view transactions for locked records only
CREATE POLICY IF NOT EXISTS "auditors_view_transactions"
ON transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'auditor'
    AND auditor_access_expires_at > NOW()
  )
  AND daily_record_id IN (
    SELECT id FROM daily_records WHERE status = 'locked'
  )
);

-- Ensure auditors cannot modify anything (defensive policy)
-- This is already enforced by middleware, but we add RLS as defense-in-depth
CREATE POLICY IF NOT EXISTS "auditors_cannot_insert_daily_records"
ON daily_records FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'auditor'
  )
);

CREATE POLICY IF NOT EXISTS "auditors_cannot_update_daily_records"
ON daily_records FOR UPDATE
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'auditor'
  )
);

CREATE POLICY IF NOT EXISTS "auditors_cannot_delete_daily_records"
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
CREATE POLICY IF NOT EXISTS "auditors_cannot_insert_transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'auditor'
  )
);

CREATE POLICY IF NOT EXISTS "auditors_cannot_update_transactions"
ON transactions FOR UPDATE
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'auditor'
  )
);

CREATE POLICY IF NOT EXISTS "auditors_cannot_delete_transactions"
ON transactions FOR DELETE
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'auditor'
  )
);

-- Grant necessary permissions
GRANT SELECT ON auditor_actions TO authenticated;
GRANT INSERT ON auditor_actions TO authenticated;

COMMENT ON TABLE auditor_actions IS 'Logs all actions performed by auditors for compliance tracking';
COMMENT ON COLUMN users.auditor_access_granted_at IS 'Timestamp when auditor access was granted';
COMMENT ON COLUMN users.auditor_access_expires_at IS 'Timestamp when auditor access expires';
COMMENT ON COLUMN users.auditor_access_granted_by IS 'Admin user who granted the access';
