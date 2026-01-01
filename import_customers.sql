-- Import customer data from CSV
-- This script imports 7661 customer records into the customers table
-- Run this in Supabase SQL Editor

-- Note: The CSV has multiline addresses, so we'll need to handle this carefully
-- For now, this is a template. The actual import should be done via Supabase Dashboard > Table Editor > Import CSV

-- Alternatively, use the Supabase CLI:
-- supabase db push --csv customers_rows.csv --table customers

-- Or use the psql COPY command:
\copy customers(id, outlet_id, name, phone, email, address, notes, credit_limit, outstanding_balance, is_active, created_at, updated_at, created_by, referred_by, internal_customer_id, customer_code) FROM 'd:\K4NN4N\sahakar-accounts\customers_rows.csv' WITH (FORMAT CSV, HEADER true, NULL 'NULL');

-- After import, verify the count:
SELECT COUNT(*) as total_customers FROM customers;

-- Verify sample data:
SELECT id, name, phone, outlet_id, created_at 
FROM customers 
ORDER BY created_at DESC 
LIMIT 10;
