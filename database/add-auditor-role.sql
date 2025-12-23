-- 1. Update the Check Constraint on users table to allow 'auditor' role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('master_admin', 'ho_accountant', 'outlet_manager', 'outlet_staff', 'auditor'));

-- 2. Create RLS Policies for Auditor Role

-- Outlets: View all outlets
CREATE POLICY "Auditors view all outlets" ON outlets
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'auditor'
    )
  );

-- Users: View all users (to see who created records)
CREATE POLICY "Auditors view all users" ON users
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'auditor'
    )
  );

-- Daily Records: View ONLY 'locked' records
CREATE POLICY "Auditors view locked records only" ON daily_records
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'auditor'
    )
    AND status = 'locked'
  );

-- Transactions: View transactions belonging to 'locked' daily records
CREATE POLICY "Auditors view locked transactions" ON transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_records dr
      WHERE dr.id = transactions.daily_record_id
      AND dr.status = 'locked'
    )
    AND auth.uid() IN (
      SELECT id FROM users WHERE role = 'auditor'
    )
  );

-- Monthly Summaries: View all summaries (these are derived data)
CREATE POLICY "Auditors view monthly summaries" ON monthly_summaries
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'auditor'
    )
  );
