-- Phase 3: Professional Internal ID System
-- Migration: 20260101150000_professional_ids.sql

-- 1. Update outlets table
ALTER TABLE outlets 
ADD COLUMN IF NOT EXISTS outlet_type TEXT CHECK (outlet_type IN ('HP', 'SC')),
ADD COLUMN IF NOT EXISTS location_code TEXT;

-- Update existing outlets with defaults based on current type and name
UPDATE outlets 
SET outlet_type = CASE WHEN type = 'smart_clinic' THEN 'SC' ELSE 'HP' END,
    location_code = UPPER(LEFT(name, 3))
WHERE outlet_type IS NULL;

-- Make them NOT NULL after populating
ALTER TABLE outlets ALTER COLUMN outlet_type SET NOT NULL;
ALTER TABLE outlets ALTER COLUMN location_code SET NOT NULL;

-- 2. Create outlet_counters table
CREATE TABLE IF NOT EXISTS outlet_counters (
  outlet_id UUID PRIMARY KEY REFERENCES outlets(id) ON DELETE CASCADE,
  next_entry_seq BIGINT NOT NULL DEFAULT 1,
  next_customer_seq BIGINT NOT NULL DEFAULT 1
);

-- Seed counters for existing outlets
INSERT INTO outlet_counters (outlet_id)
SELECT id FROM outlets
ON CONFLICT (outlet_id) DO NOTHING;

-- 3. Add professional ID columns to transactions and customers
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS internal_entry_id TEXT UNIQUE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS internal_customer_id TEXT UNIQUE;

-- 4. Create internal ID generation function
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create triggers
DROP TRIGGER IF EXISTS trg_generate_entry_id ON transactions;
CREATE TRIGGER trg_generate_entry_id
BEFORE INSERT ON transactions
FOR EACH ROW EXECUTE FUNCTION generate_internal_id();

DROP TRIGGER IF EXISTS trg_generate_customer_id ON customers;
CREATE TRIGGER trg_generate_customer_id
BEFORE INSERT ON customers
FOR EACH ROW EXECUTE FUNCTION generate_internal_id();
