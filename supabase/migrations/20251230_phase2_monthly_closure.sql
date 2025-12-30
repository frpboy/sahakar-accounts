-- Phase 2: Monthly Closure System Migration
-- Run this in Supabase SQL Editor

-- 1. Create monthly_closures table
CREATE TABLE IF NOT EXISTS monthly_closures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outlet_id UUID REFERENCES outlets(id) NOT NULL,
    month_date DATE NOT NULL, -- Stored as YYYY-MM-01
    status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'closed')),
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES users(id),
    opening_cash DECIMAL(12,2) NOT NULL DEFAULT 0, -- Snapshot at month start
    closing_cash DECIMAL(12,2) NOT NULL DEFAULT 0, -- Snapshot at month end
    total_income DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_expense DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(outlet_id, month_date)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_monthly_closures_outlet_month ON monthly_closures(outlet_id, month_date);
CREATE INDEX IF NOT EXISTS idx_monthly_closures_status ON monthly_closures(status);

-- 3. Enable RLS
ALTER TABLE monthly_closures ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- View: Everyone can see closures for their outlet (or all if admin)
CREATE POLICY "View monthly closures" ON monthly_closures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND (
                role IN ('superadmin', 'ho_accountant', 'auditor') 
                OR outlet_id = monthly_closures.outlet_id
            )
        )
    );

-- Manage: Only HO Accountant & Superadmin can close/reopen
CREATE POLICY "Manage monthly closures" ON monthly_closures
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('superadmin', 'ho_accountant')
        )
    );

-- 5. Trigger to prevent backdated edits in CLOSED months
CREATE OR REPLACE FUNCTION check_month_status_on_daily_record()
RETURNS TRIGGER AS $$
DECLARE
    record_date DATE;
    month_start DATE;
    closure_status VARCHAR;
BEGIN
    -- Determine the date being affected
    IF TG_OP = 'DELETE' THEN
        record_date := OLD.date;
    ELSE
        record_date := NEW.date;
    END IF;

    -- Calculate the first day of that month
    month_start := date_trunc('month', record_date)::DATE;

    -- Check if a closure record exists and is closed
    SELECT status INTO closure_status
    FROM monthly_closures
    WHERE outlet_id = (CASE WHEN TG_OP = 'DELETE' THEN OLD.outlet_id ELSE NEW.outlet_id END)
    AND month_date = month_start;

    IF closure_status = 'closed' THEN
        RAISE EXCEPTION 'Cannot modify records in a closed month (%)', to_char(month_start, 'Month YYYY');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to daily_records (Insert/Update/Delete)
DROP TRIGGER IF EXISTS enforce_month_closure ON daily_records;
CREATE TRIGGER enforce_month_closure
BEFORE INSERT OR UPDATE OR DELETE ON daily_records
FOR EACH ROW
EXECUTE FUNCTION check_month_status_on_daily_record();

-- 6. Trigger to auto-create monthly closure entry when a day is created (if not exists)
CREATE OR REPLACE FUNCTION ensure_monthly_closure_exists()
RETURNS TRIGGER AS $$
DECLARE
    month_start DATE;
BEGIN
    month_start := date_trunc('month', NEW.date)::DATE;

    INSERT INTO monthly_closures (outlet_id, month_date, status)
    VALUES (NEW.outlet_id, month_start, 'open')
    ON CONFLICT (outlet_id, month_date) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_create_month_closure ON daily_records;
CREATE TRIGGER auto_create_month_closure
AFTER INSERT ON daily_records
FOR EACH ROW
EXECUTE FUNCTION ensure_monthly_closure_exists();
