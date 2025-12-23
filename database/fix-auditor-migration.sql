-- FIX: Add 'superadmin' to the allowed roles list to match existing data
-- The previous script failed because 'superadmin' was missing from the check list

-- 1. Update the Check Constraint (Safe Mode)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN (
    'master_admin', 
    'ho_accountant', 
    'outlet_manager', 
    'outlet_staff', 
    'auditor',
    'superadmin'  -- Added this to fix the violation
  ));

-- 2. Re-apply RLS Policies (Idempotent)

-- Drop existing policies to avoid conflicts if they were partially created
DROP POLICY IF EXISTS "Auditors view all outlets" ON outlets;
DROP POLICY IF EXISTS "Auditors view all users" ON users;
DROP POLICY IF EXISTS "Auditors view locked records only" ON daily_records;
DROP POLICY IF EXISTS "Auditors view locked transactions" ON transactions;
DROP POLICY IF EXISTS "Auditors view monthly summaries" ON monthly_summaries;

-- Re-create Policies
CREATE POLICY "Auditors view all outlets" ON outlets FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE role = 'auditor'));
CREATE POLICY "Auditors view all users" ON users FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE role = 'auditor'));
CREATE POLICY "Auditors view locked records only" ON daily_records FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE role = 'auditor') AND status = 'locked');
CREATE POLICY "Auditors view locked transactions" ON transactions FOR SELECT USING (EXISTS (SELECT 1 FROM daily_records dr WHERE dr.id = transactions.daily_record_id AND dr.status = 'locked') AND auth.uid() IN (SELECT id FROM users WHERE role = 'auditor'));
CREATE POLICY "Auditors view monthly summaries" ON monthly_summaries FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE role = 'auditor'));
