-- Final constraint enforcement for Accounting-Grade Ledger

-- 1. Ensure all transactions have a ledger_account_id
-- Use the trigger logic for one final manual update
UPDATE public.transactions 
SET ledger_account_id = COALESCE(
    (SELECT id FROM public.ledger_accounts 
     WHERE code = CASE 
        WHEN LOWER(category) = 'sales' THEN 'SAL'
        WHEN LOWER(category) = 'purchase' THEN 'PUR'
        WHEN LOWER(category) IN ('operating', 'expense') THEN 'OPR'
        WHEN LOWER(category) = 'salary' THEN 'WAG'
        WHEN LOWER(category) IN ('customer_credit', 'credit_received') THEN 'CUS'
        WHEN LOWER(category) = 'sales_return' THEN 'SAL'
        ELSE 'EXP' 
     END
     LIMIT 1),
    (SELECT id FROM public.ledger_accounts WHERE code = 'EXP' LIMIT 1)
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
