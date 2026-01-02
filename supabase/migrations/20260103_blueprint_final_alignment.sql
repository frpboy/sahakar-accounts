-- 1. Refine Ledger Accounts Table
-- Ensure columns match the authoritative blueprint: code, name, type (ENUM), parent_id, level, is_leaf, is_locked, status.

-- Modify existing columns if they exist, or add them
ALTER TABLE public.ledger_accounts 
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_leaf boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;

-- Update is_leaf logic: If an account is a parent, it is NOT a leaf.
CREATE OR REPLACE FUNCTION public.update_ledger_leaf_status() 
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.parent_id IS NOT NULL THEN
        UPDATE public.ledger_accounts SET is_leaf = false WHERE id = NEW.parent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ledger_leaf ON public.ledger_accounts;
CREATE TRIGGER trigger_update_ledger_leaf
AFTER INSERT OR UPDATE ON public.ledger_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_ledger_leaf_status();

-- 2. Create Accounting Periods Table (Rule 2 blueprint)
CREATE TABLE IF NOT EXISTS public.accounting_periods (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    month date UNIQUE NOT NULL, -- Format: YYYY-MM-01
    status text DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'REOPENED')),
    closed_by uuid REFERENCES public.users(id),
    closed_at timestamp with time zone,
    reopen_reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT accounting_periods_pkey PRIMARY KEY (id)
);

-- 3. Strict Posting Constraints on Transactions
-- Ensure ledger_account_id is mandatory (after backfill)
-- Note: Skipping NOT NULL constraint for now to avoid breaking existing data until we confirm mapping.

-- 4. RLS Policy: Block posting to non-leaf accounts
-- Rule 4 blueprint: "Cannot post to non-leaf accounts"
DROP POLICY IF EXISTS "Block non-leaf postings" ON public.transactions;
CREATE POLICY "Block non-leaf postings" 
ON public.transactions FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.ledger_accounts 
        WHERE id = transactions.ledger_account_id 
        AND is_leaf = true 
        AND status = 'active'
    )
);

-- 5. RLS Policy: Block posting to closed months
-- Rule 4 blueprint: "Cannot post to a closed month"
DROP POLICY IF EXISTS "Block closed month postings" ON public.transactions;
CREATE POLICY "Block closed month postings" 
ON public.transactions FOR INSERT 
TO authenticated 
WITH CHECK (
    NOT EXISTS (
        SELECT 1 FROM public.accounting_periods 
        WHERE month = date_trunc('month', transactions.ledger_date)::date 
        AND status = 'CLOSED'
    )
);
