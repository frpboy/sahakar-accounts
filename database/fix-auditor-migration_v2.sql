-- 1. FIX: Update User Check Constraint (Including 'superadmin')
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN (
    'master_admin', 
    'ho_accountant', 
    'outlet_manager', 
    'outlet_staff', 
    'auditor',
    'superadmin'
  ));

-- 2. FIX: Create monthly_summaries if missing (to prevent Policy error)
CREATE TABLE IF NOT EXISTS monthly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_income DECIMAL(12, 2) DEFAULT 0,
  total_expense DECIMAL(12, 2) DEFAULT 0,
  total_cash_in DECIMAL(12, 2) DEFAULT 0,
  total_cash_out DECIMAL(12, 2) DEFAULT 0,
  total_upi_in DECIMAL(12, 2) DEFAULT 0,
  total_upi_out DECIMAL(12, 2) DEFAULT 0,
  net_profit DECIMAL(12, 2) DEFAULT 0,
  opening_balance DECIMAL(12, 2) DEFAULT 0,
  closing_balance DECIMAL(12, 2) DEFAULT 0,
  days_count INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(outlet_id, month)
);

-- Enable RLS on monthly_summaries if it was just created
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;

-- 3. Safely Re-apply RLS Policies
DROP POLICY IF EXISTS "Auditors view all outlets" ON outlets;
DROP POLICY IF EXISTS "Auditors view all users" ON users;
DROP POLICY IF EXISTS "Auditors view locked records only" ON daily_records;
DROP POLICY IF EXISTS "Auditors view locked transactions" ON transactions;
DROP POLICY IF EXISTS "Auditors view monthly summaries" ON monthly_summaries;

CREATE POLICY "Auditors view all outlets" ON outlets FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE role = 'auditor'));
CREATE POLICY "Auditors view all users" ON users FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE role = 'auditor'));
CREATE POLICY "Auditors view locked records only" ON daily_records FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE role = 'auditor') AND status = 'locked');
CREATE POLICY "Auditors view locked transactions" ON transactions FOR SELECT USING (EXISTS (SELECT 1 FROM daily_records dr WHERE dr.id = transactions.daily_record_id AND dr.status = 'locked') AND auth.uid() IN (SELECT id FROM users WHERE role = 'auditor'));
CREATE POLICY "Auditors view monthly summaries" ON monthly_summaries FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE role = 'auditor'));
