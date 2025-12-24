-- =====================================================================
-- AUDITOR ACCESS LOG TABLE
-- =====================================================================
-- Purpose: Track all auditor data access for compliance and audit trail
-- Created: 2025-12-24
-- =====================================================================

-- Create auditor access log table
CREATE TABLE IF NOT EXISTS auditor_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES outlets(id),
    action TEXT NOT NULL, -- 'view_dashboard', 'view_record', 'export_excel', 'export_pdf'
    entity_type TEXT, -- 'daily_record', 'transaction', etc.
    entity_id UUID,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    
    -- Constraints
    CONSTRAINT valid_action CHECK (
        action IN ('view_dashboard', 'view_record', 'view_transaction', 'export_excel', 'export_pdf', 'filter_data')
    )
);

-- Index for auditor activity queries
CREATE INDEX IF NOT EXISTS idx_auditor_access_log_auditor 
ON auditor_access_log(auditor_id, accessed_at DESC);

-- Index for outlet-wise access tracking
CREATE INDEX IF NOT EXISTS idx_auditor_access_log_outlet 
ON auditor_access_log(outlet_id, accessed_at DESC);

-- Index for action-based queries
CREATE INDEX IF NOT EXISTS idx_auditor_access_log_action 
ON auditor_access_log(action, accessed_at DESC);

-- Enable Row Level Security
ALTER TABLE auditor_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only superadmin can read audit logs
CREATE POLICY "superadmin_can_read_audit_logs"
ON auditor_access_log
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'superadmin'
    )
);

-- RLS Policy: Auditors can insert their own logs
CREATE POLICY "auditors_can_insert_own_logs"
ON auditor_access_log
FOR INSERT
WITH CHECK (
    auditor_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'auditor'
    )
);

-- Comment for documentation
COMMENT ON TABLE auditor_access_log IS 'Tracks all data access by auditors for compliance and audit purposes';
COMMENT ON COLUMN auditor_access_log.action IS 'Type of action performed: view_dashboard, view_record, export_excel, export_pdf';
COMMENT ON COLUMN auditor_access_log.entity_type IS 'Type of entity accessed: daily_record, transaction';

-- Verification query
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'auditor_access_log'
ORDER BY ordinal_position;
