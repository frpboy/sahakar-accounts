-- Migration: 20260101160000_erp_stabilization.sql
-- Goal: Fix customer schema and implement global read permissions

-- 1. Add customer_code to customers table if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='customer_code') THEN
    ALTER TABLE customers ADD COLUMN customer_code TEXT UNIQUE;
  END IF;
END $$;

-- 2. Populate customer_code from internal_customer_id for existing records
UPDATE customers SET customer_code = internal_customer_id WHERE customer_code IS NULL;

-- 3. Update the generate_internal_id function to also populate customer_code
CREATE OR REPLACE FUNCTION generate_internal_id()
RETURNS TRIGGER AS $$
DECLARE
  o_type TEXT;
  o_code TEXT;
  seq_val BIGINT;
  formatted_id TEXT;
BEGIN
  -- Get outlet details
  SELECT outlet_type, location_code INTO o_type, o_code
  FROM outlets WHERE id = NEW.outlet_id;

  -- Ensure counter exists
  INSERT INTO outlet_counters (outlet_id, next_entry_seq, next_customer_seq)
  VALUES (NEW.outlet_id, 1, 1)
  ON CONFLICT (outlet_id) DO NOTHING;

  IF TG_TABLE_NAME = 'transactions' THEN
    UPDATE outlet_counters 
    SET next_entry_seq = next_entry_seq + 1
    WHERE outlet_id = NEW.outlet_id
    RETURNING next_entry_seq - 1 INTO seq_val;
    
    formatted_id := o_type || '-' || o_code || '-' || LPAD(seq_val::text, 6, '0');
    NEW.internal_entry_id := formatted_id;

  ELSIF TG_TABLE_NAME = 'customers' THEN
    UPDATE outlet_counters 
    SET next_customer_seq = next_customer_seq + 1
    WHERE outlet_id = NEW.outlet_id
    RETURNING next_customer_seq - 1 INTO seq_val;
    
    formatted_id := o_type || '-' || o_code || '-C' || LPAD(seq_val::text, 6, '0');
    NEW.internal_customer_id := formatted_id;
    NEW.customer_code := formatted_id; -- Sync customer_code with internal_customer_id
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Global Read Access & Restricted Edits for Customers
-- Drop old permissive policy
DROP POLICY IF EXISTS "Authenticated full access" ON customers;
DROP POLICY IF EXISTS "Global Read Customers" ON customers;
DROP POLICY IF EXISTS "Manager Edit Customers" ON customers;
DROP POLICY IF EXISTS "Manager Update Customers" ON customers;

-- All staff can read all customers (Global Access)
CREATE POLICY "Global Read Customers" ON customers 
    FOR SELECT TO authenticated 
    USING (true);

-- Only Managers & Admins can create customers
CREATE POLICY "Manager Edit Customers" ON customers 
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('outlet_manager', 'ho_accountant', 'master_admin', 'superadmin')
        )
    );

-- Only Managers & Admins can update customers
CREATE POLICY "Manager Update Customers" ON customers 
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('outlet_manager', 'ho_accountant', 'master_admin', 'superadmin')
        )
    );

-- No one can delete customers (only deactivate)
DROP POLICY IF EXISTS "Customers Delete Policy" ON customers;
-- No DELETE policy = Access Denied by default in Postgres if RLS is enabled.
