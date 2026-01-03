-- Migration: 20260105_features.sql
-- Description: Add fields for Purchase Split, Customer Logic, and Sales Refill

-- 1. UTILITY FUNCTION to backfill assigned_to if missing
CREATE OR REPLACE FUNCTION backfill_customer_assigned_to() RETURNS void AS $$
BEGIN
    UPDATE customers
    SET assigned_to_user_id = created_by
    WHERE assigned_to_user_id IS NULL AND created_by IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. CUSTOMERS TABLE UPDATES
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spend NUMERIC DEFAULT 0;

-- Backfill before setting NOT NULL
SELECT backfill_customer_assigned_to();

-- Add Indexes
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_referred_by ON customers(referred_by_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_visit_stats ON customers(visit_count, total_spend);

-- 3. TRANSACTIONS TABLE UPDATES
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS supplier_name TEXT,
ADD COLUMN IF NOT EXISTS erp_id TEXT,
ADD COLUMN IF NOT EXISTS external_bill_number TEXT,
ADD COLUMN IF NOT EXISTS other_charges NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS bank_tx_id TEXT,
ADD COLUMN IF NOT EXISTS remarks TEXT,
ADD COLUMN IF NOT EXISTS refill_days INTEGER,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN transactions.external_bill_number IS 'Vendor Invoice Number (for Purchases)';
COMMENT ON COLUMN transactions.entry_number IS 'Internal Voucher Number (or Bill Number for Sales)';
COMMENT ON COLUMN transactions.refill_days IS 'Number of days this purchase is expected to last (Refill Reminder)';

-- 4. CLEANUP
DROP FUNCTION backfill_customer_assigned_to();
