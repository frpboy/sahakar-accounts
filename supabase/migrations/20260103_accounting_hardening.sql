-- migrate:up

-----------------------------------------------------------
-- 1. PREVENT UPDATES & DELETES ON TRANSACTIONS (Rule 5)
-----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_transaction_modifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow initial insert (TG_OP = 'INSERT')
    -- If TG_OP = 'UPDATE' or 'DELETE', raise exception
    IF (TG_OP = 'UPDATE') THEN
        RAISE EXCEPTION 'Accounting Integrity Violation: Transactions are append-only. Corrections must use Reversal Entries (Rule 5).';
    END IF;
    
    IF (TG_OP = 'DELETE') THEN
        RAISE EXCEPTION 'Accounting Integrity Violation: Transaction deletion is prohibited. Use Reversal Entries to void records.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS ensure_transaction_immutability ON public.transactions;

CREATE TRIGGER ensure_transaction_immutability
BEFORE UPDATE OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_transaction_modifications();


-----------------------------------------------------------
-- 2. ENFORCE LEAF-ACCOUNT ONLY POSTING (Rule 11)
-----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_leaf_account_postings()
RETURNS TRIGGER AS $$
DECLARE
    is_leaf_acc BOOLEAN;
BEGIN
    IF NEW.ledger_account_id IS NOT NULL THEN
        SELECT is_leaf INTO is_leaf_acc 
        FROM public.ledger_accounts 
        WHERE id = NEW.ledger_account_id;
        
        IF is_leaf_acc IS NULL OR is_leaf_acc = false THEN
            RAISE EXCEPTION 'Accounting Rule Violation: Postings are only allowed to Leaf Accounts, not parent/group accounts.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_leaf_posting ON public.transactions;

CREATE TRIGGER trg_enforce_leaf_posting
BEFORE INSERT OR UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_leaf_account_postings();


-----------------------------------------------------------
-- 3. ENFORCE DAY LOCK ON INSERT (Rule 4)
-----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_day_lock_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
    day_status TEXT;
BEGIN
    SELECT status INTO day_status 
    FROM public.daily_records 
    WHERE id = NEW.daily_record_id;
    
    IF day_status = 'locked' THEN
        RAISE EXCEPTION 'Accounting Governance Violation: This business day is LOCKED. No new entries, edits, or deletes allowed (Rule 4).';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_day_lock_tx ON public.transactions;

CREATE TRIGGER trg_enforce_day_lock_tx
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_day_lock_on_transaction();


-----------------------------------------------------------
-- 4. HARDEN RLS POLICIES FOR IMMUTABILITY
-----------------------------------------------------------

-- Update Insert Policy to check for Locked Days
DROP POLICY IF EXISTS insert_transactions_staff_manager ON public.transactions;
CREATE POLICY insert_transactions_staff_manager
ON public.transactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.daily_records dr
    JOIN public.users u ON u.id = auth.uid()
    WHERE dr.id = transactions.daily_record_id
      AND dr.status != 'locked'
      AND (
        (u.role IN ('superadmin','master_admin','ho_accountant')) OR
        (u.role IN ('outlet_staff','outlet_manager') AND dr.outlet_id = u.outlet_id)
      )
  )
);

-- Deny all Updates/Deletes at RLS level too (Redundancy)
DROP POLICY IF EXISTS update_transactions_staff_manager ON public.transactions;
DROP POLICY IF EXISTS delete_transactions_staff_manager ON public.transactions;

CREATE POLICY update_transactions_deny_all ON public.transactions FOR UPDATE USING (false);
CREATE POLICY delete_transactions_deny_all ON public.transactions FOR DELETE USING (false);

-- migrate:down
-- (Reversal logic usually not needed for these hardening steps unless debugging)
