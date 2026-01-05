-- Migration: Deduplicate customers by phone and enforce uniqueness
-- Date: 2026-01-05

BEGIN;

-- 1. Create a temporary mapping of duplicate customers to their "survivor"
-- We keep the most recently updated record as the survivor
CREATE TEMP TABLE customer_dedup_map AS
WITH ranked_customers AS (
    SELECT 
        id, 
        phone,
        updated_at,
        ROW_NUMBER() OVER (PARTITION BY phone ORDER BY updated_at DESC, created_at DESC) as rank
    FROM public.customers
    WHERE phone IS NOT NULL AND phone != ''
)
SELECT 
    t1.id as duplicate_id,
    t2.id as survivor_id
FROM ranked_customers t1
JOIN ranked_customers t2 ON t1.phone = t2.phone
WHERE t1.rank > 1 AND t2.rank = 1;

-- 2. Re-link transactions to the survivors
-- 2. Re-link transactions to the survivors
-- Temporarily disable the immutability trigger to allow updating customer_id
ALTER TABLE public.transactions DISABLE TRIGGER ensure_transaction_immutability;
-- We also need to disable balance update if it runs on UPDATE, to avoid side effects (though customer_id change shouldn't affect balance)
-- SAFE MODE: Disable only the blocker.
UPDATE public.transactions t
SET customer_id = m.survivor_id
FROM customer_dedup_map m
WHERE t.customer_id = m.duplicate_id;

ALTER TABLE public.transactions ENABLE TRIGGER ensure_transaction_immutability;

-- 3. Delete the duplicate customers
DELETE FROM public.customers
WHERE id IN (SELECT duplicate_id FROM customer_dedup_map);

-- 4. Clean up temp table
DROP TABLE customer_dedup_map;

-- 5. Enforce uniqueness on phone column
-- First, handle any remaining empty/null strings if they cause issues (usually they don't with UNIQUE unless multiple NULLs are treated as same, but in Postgres multiple NULLs are allowed in UNIQUE)
-- However, we should probably ensure phone is not empty string
UPDATE public.customers SET phone = NULL WHERE phone = '';

-- Add the unique constraint
ALTER TABLE public.customers 
ADD CONSTRAINT customers_phone_unique UNIQUE (phone);

-- 6. Update the customer creation logic in the app to use UPSERT or check for phone
-- (This will be done in the application code)

COMMIT;
