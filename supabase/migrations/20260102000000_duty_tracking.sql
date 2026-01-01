-- Migration: Add duty tracking for staff
CREATE TABLE IF NOT EXISTS duty_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES outlets(id) ON DELETE SET NULL,
    duty_start TIMESTAMPTZ,
    duty_end TIMESTAMPTZ,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_duty_logs_user_date ON duty_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_duty_logs_outlet_date ON duty_logs(outlet_id, date);

-- Enable RLS
ALTER TABLE duty_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own duty logs"
    ON duty_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own duty logs"
    ON duty_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own duty logs"
    ON duty_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Managers can view outlet duty logs"
    ON duty_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('outlet_manager', 'superadmin', 'master_admin', 'ho_accountant')
            AND (users.outlet_id = duty_logs.outlet_id OR users.outlet_id IS NULL)
        )
    );

COMMENT ON TABLE duty_logs IS 'Tracks staff duty start and end times';
COMMENT ON COLUMN duty_logs.duty_end IS 'When staff clicked Duty End button';
