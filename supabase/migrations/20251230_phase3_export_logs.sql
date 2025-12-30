-- Phase 3: Export Logging & Compliance
-- Run this in Supabase SQL Editor

-- 1. Create export_logs table
CREATE TABLE IF NOT EXISTS export_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    export_type VARCHAR(20) NOT NULL CHECK (export_type IN ('pdf', 'excel')),
    report_type VARCHAR(50) NOT NULL, -- 'monthly_summary', 'daily_report', etc.
    filters JSONB DEFAULT '{}'::jsonb, -- Store date range, store_id etc.
    file_hash VARCHAR(64), -- SHA-256 hash for integrity
    record_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_export_logs_user ON export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_date ON export_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_logs_type ON export_logs(export_type);

-- 3. Enable RLS
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- View: Superadmin & Auditor can view all logs
CREATE POLICY "View all export logs" ON export_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('superadmin', 'auditor')
        )
    );

-- Insert: Authenticated users can log their own exports
CREATE POLICY "Log own exports" ON export_logs
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- 5. Prevent Deletion (Immutable Audit Trail)
-- No DELETE policy created = No one can delete
