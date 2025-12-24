-- STEP 4: Google Sheets Sync - Database Schema Updates
-- Add sync tracking columns to daily_records table
-- Create sheet_sync_log table for audit trail

-- 1. Add sync tracking columns to daily_records
ALTER TABLE daily_records
ADD COLUMN IF NOT EXISTS synced_to_sheets BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sheet_sync_error TEXT;

-- Add index for filtering unsynced records
CREATE INDEX IF NOT EXISTS idx_daily_records_sync_status 
ON daily_records(synced_to_sheets, status) 
WHERE status = 'locked';

-- Add comment
COMMENT ON COLUMN daily_records.synced_to_sheets IS 'Flag indicating if record has been synced to Google Sheets';
COMMENT ON COLUMN daily_records.last_synced_at IS 'Timestamp of last successful sync to Google Sheets';
COMMENT ON COLUMN daily_records.sheet_sync_error IS 'Error message if sync failed, NULL on success';

-- 2. Create sheet_sync_log table for detailed audit trail
CREATE TABLE IF NOT EXISTS sheet_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_record_id UUID NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
    spreadsheet_id TEXT,
    spreadsheet_url TEXT,
    sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'failed', 'pending')),
    error_message TEXT,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    synced_by UUID REFERENCES users(id),
    sync_trigger TEXT CHECK (sync_trigger IN ('auto', 'manual', 'cron', 'retry'))
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sheet_sync_log_record 
ON sheet_sync_log(daily_record_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sheet_sync_log_status 
ON sheet_sync_log(sync_status, synced_at DESC);

CREATE INDEX IF NOT EXISTS idx_sheet_sync_log_failures
ON sheet_sync_log(sync_status, daily_record_id)
WHERE sync_status = 'failed';

-- Add comments
COMMENT ON TABLE sheet_sync_log IS 'Audit trail for all Google Sheets synchronization attempts';
COMMENT ON COLUMN sheet_sync_log.sync_trigger IS 'How the sync was triggered: auto (on lock), manual (user button), cron (scheduled), retry (automatic retry)';

-- 3. Add RLS policies for sheet_sync_log
ALTER TABLE sheet_sync_log ENABLE ROW LEVEL SECURITY;

-- HO accountants and superadmins can view all sync logs
CREATE POLICY "HO and admins can view sync logs"
ON sheet_sync_log FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('ho_accountant', 'superadmin', 'master_admin')
    )
);

-- Only system can insert sync logs (via API)
CREATE POLICY "System can insert sync logs"
ON sheet_sync_log FOR INSERT
WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON sheet_sync_log TO authenticated;
GRANT INSERT ON sheet_sync_log TO authenticated;
