-- Final constraint enforcement for Accounting-Grade Ledger

-- 1. Ensure all transactions have a ledger_account_id
-- Use the trigger logic for one final manual update
UPDATE public.transactions 
SET ledger_account_id = COALESCE(
    (SELECT id FROM public.ledger_accounts 
     WHERE code = CASE LOWER(category)
        WHEN 'sales' THEN '3001'
        WHEN 'purchase' THEN '4001'
        WHEN 'operating' THEN '4002'
        WHEN 'expense' THEN '4002'
        WHEN 'salary' THEN '4003'
        WHEN 'customer_credit' THEN '1003'
        ELSE '4002' 
     END
     LIMIT 1),
    (SELECT id FROM public.ledger_accounts WHERE code = '4002' LIMIT 1)
)
WHERE ledger_account_id IS NULL;

-- 2. Ensure all transactions have a ledger_date
UPDATE public.transactions SET ledger_date = created_at::date WHERE ledger_date IS NULL;

-- 3. Enforce NOT NULL constraints
ALTER TABLE public.transactions 
  ALTER COLUMN ledger_account_id SET NOT NULL,
  ALTER COLUMN ledger_date SET NOT NULL;

-- 4. Enforce NOT NULL on accounting heads
ALTER TABLE public.ledger_accounts
  ALTER COLUMN level SET NOT NULL,
  ALTER COLUMN is_leaf SET NOT NULL;
