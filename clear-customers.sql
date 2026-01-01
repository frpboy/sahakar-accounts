-- Clear existing customer data and import fresh data
-- Run this in Supabase SQL Editor

-- Step 1: Delete all existing customers (CAUTION: This will remove all customer data)
DELETE FROM customers;

-- Step 2: Reset the sequence if needed
-- (This ensures auto-generated IDs start fresh)

-- Step 3: Now you can run the seed.sql file
-- The seed.sql contains all 7,655 INSERT statements

-- Alternatively, if you want to keep existing customers and only add new ones:
-- Use INSERT ... ON CONFLICT DO NOTHING
-- But this requires modifying all INSERT statements in seed.sql

-- Verification query (run after import):
SELECT COUNT(*) as total_customers FROM customers;
SELECT name, phone, internal_customer_id FROM customers ORDER BY created_at DESC LIMIT 10;
