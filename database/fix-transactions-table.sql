-- Fix for existing transactions table
-- Run this in Supabase SQL Editor to fix the schema

-- Drop existing transactions table if it has wrong schema
DROP TABLE IF EXISTS transactions CASCADE;

-- Recreate transactions table with correct schema
CREATE TABLE transactions (
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

-- Create indexes
CREATE INDEX idx_transactions_daily_record ON transactions(daily_record_id);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(created_at);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Verify
SELECT 'transactions table recreated' as status, count(*) as columns 
FROM information_schema.columns 
WHERE table_name = 'transactions';
