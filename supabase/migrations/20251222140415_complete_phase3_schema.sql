-- Phase 3: Transaction Management Database Schema
-- Run this in Supabase SQL Editor

-- IMPORTANT: Step 1 - Rename table FIRST before any foreign key references
ALTER TABLE IF EXISTS daily_entries RENAME TO daily_records;

-- Step 2: Add new columns to daily_records
ALTER TABLE daily_records 
  ADD COLUMN IF NOT EXISTS opening_cash DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opening_upi DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closing_cash DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS closing_upi DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS total_income DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS total_expense DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES users(id);

-- Step 3: Create transactions table (NOW daily_records exists)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_record_id UUID REFERENCES daily_records(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100) NOT NULL,
  payment_mode VARCHAR(10) NOT NULL CHECK (payment_mode IN ('cash', 'upi')),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_daily_record ON transactions(daily_record_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);

-- Step 4: Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Seed initial categories
INSERT INTO categories (code, name, type) VALUES
  ('consultation', 'Consultation Fees', 'income'),
  ('medicine_sale', 'Medicine Sale', 'income'),
  ('lab_test', 'Lab Test Fees', 'income'),
  ('other_income', 'Other Income', 'income'),
  ('medicine_purchase', 'Medicine Purchase', 'expense'),
  ('staff_salary', 'Staff Salary', 'expense'),
  ('clinic_expenses', 'Clinic Expenses', 'expense'),
  ('transport', 'Transport', 'expense'),
  ('rent', 'Rent', 'expense'),
  ('utilities', 'Electricity/Water', 'expense'),
  ('miscellaneous', 'Miscellaneous', 'expense')
ON CONFLICT (code) DO NOTHING;

-- Step 6: Create trigger function to auto-calculate balances
CREATE OR REPLACE FUNCTION update_daily_record_balances()
RETURNS TRIGGER AS $$
DECLARE
  record_id UUID;
BEGIN
  -- Get the daily_record_id from the transaction
  record_id := COALESCE(NEW.daily_record_id, OLD.daily_record_id);
  
  -- Update the daily_record with calculated balances
  UPDATE daily_records dr
  SET 
    total_income = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM transactions 
      WHERE daily_record_id = dr.id AND type = 'income'
    ),
    total_expense = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM transactions 
      WHERE daily_record_id = dr.id AND type = 'expense'
    ),
    closing_cash = dr.opening_cash + 
      COALESCE((SELECT SUM(amount) FROM transactions WHERE daily_record_id = dr.id AND type = 'income' AND payment_mode = 'cash'), 0) -
      COALESCE((SELECT SUM(amount) FROM transactions WHERE daily_record_id = dr.id AND type = 'expense' AND payment_mode = 'cash'), 0),
    closing_upi = dr.opening_upi +
      COALESCE((SELECT SUM(amount) FROM transactions WHERE daily_record_id = dr.id AND type = 'income' AND payment_mode = 'upi'), 0) -
      COALESCE((SELECT SUM(amount) FROM transactions WHERE daily_record_id = dr.id AND type = 'expense' AND payment_mode = 'upi'), 0),
    updated_at = NOW()
  WHERE dr.id = record_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger on transactions table
DROP TRIGGER IF EXISTS transaction_balance_update ON transactions;
CREATE TRIGGER transaction_balance_update
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_daily_record_balances();

-- Step 8: Enable RLS on new tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for transactions
CREATE POLICY "Users can view transactions from their outlet" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_records dr
      JOIN users u ON u.id = auth.uid()
      WHERE dr.id = transactions.daily_record_id
      AND (u.role IN ('superadmin', 'ho_accountant') OR u.outlet_id = dr.outlet_id)
    )
  );

CREATE POLICY "Staff can create transactions for their outlet" ON transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_records dr
      JOIN users u ON u.id = auth.uid()
      WHERE dr.id = transactions.daily_record_id
      AND dr.status = 'draft'
      AND (u.role = 'superadmin' OR u.outlet_id = dr.outlet_id)
    )
  );

CREATE POLICY "Users can update their own transactions in draft" ON transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM daily_records dr
      JOIN users u ON u.id = auth.uid()
      WHERE dr.id = transactions.daily_record_id
      AND dr.status = 'draft'
      AND (u.role = 'superadmin' OR (transactions.created_by = auth.uid() AND u.outlet_id = dr.outlet_id))
    )
  );

CREATE POLICY "Users can delete their own transactions in draft" ON transactions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM daily_records dr
      JOIN users u ON u.id = auth.uid()
      WHERE dr.id = transactions.daily_record_id
      AND dr.status = 'draft'
      AND (u.role = 'superadmin' OR (transactions.created_by = auth.uid() AND u.outlet_id = dr.outlet_id))
    )
  );

-- Step 10: Create RLS policies for categories
CREATE POLICY "Anyone can view active categories" ON categories
  FOR SELECT USING (is_active = true);

-- Verify everything was created
SELECT 'daily_records' as table_name, count(*) as columns FROM information_schema.columns WHERE table_name = 'daily_records'
UNION ALL
SELECT 'transactions', count(*) FROM information_schema.columns WHERE table_name = 'transactions'
UNION ALL
SELECT 'categories', count(*) FROM information_schema.columns WHERE table_name = 'categories';

SELECT 'Categories seeded' as status, count(*) as count FROM categories;
