-- Migration: 20260104_stabilization.sql
-- Goal: Harden security, fix auditor access, and standardize locking.

-- 1. AUDITOR GLOBAL ACCESS
-- Update check_is_admin to include 'auditor' role
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('superadmin', 'master_admin', 'ho_accountant', 'auditor') -- Added auditor
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. STANDARDIZE LOCKING (Backfill & Enforce)

-- Backfill day_locks from daily_records (Preserve existing locks)
INSERT INTO public.day_locks (outlet_id, locked_date, status, locked_by, created_at, updated_at)
SELECT outlet_id, date, 'locked', locked_by, now(), now()
FROM public.daily_records
WHERE status = 'locked'
AND NOT EXISTS (
    SELECT 1 FROM public.day_locks dl 
    WHERE dl.outlet_id = daily_records.outlet_id 
    AND dl.locked_date = daily_records.date
);

-- Helper function to check day_locks (Single Source of Truth)
CREATE OR REPLACE FUNCTION public.is_day_locked(p_outlet_id uuid, p_date date)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.day_locks
    WHERE outlet_id = p_outlet_id
    AND locked_date = p_date
    AND status = 'locked'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update Trigger to check day_locks
CREATE OR REPLACE FUNCTION public.enforce_day_lock_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
    tx_date DATE;
    tx_outlet_id UUID;
BEGIN
    tx_date := NEW.ledger_date;
    tx_outlet_id := NEW.outlet_id;
    
    -- Fallback for legacy inserts that might rely on daily_record_id
    IF tx_date IS NULL OR tx_outlet_id IS NULL THEN
        IF NEW.daily_record_id IS NOT NULL THEN
             SELECT date, outlet_id INTO tx_date, tx_outlet_id
             FROM public.daily_records WHERE id = NEW.daily_record_id;
        END IF;
    END IF;

    -- If we still don't have date/outlet, we assume it's NOT locked (or should we block?)
    -- Ideally transactions should always have context. For now, if found, check lock.
    IF tx_outlet_id IS NOT NULL AND tx_date IS NOT NULL THEN
        IF public.is_day_locked(tx_outlet_id, tx_date) THEN
            RAISE EXCEPTION 'Accounting Governance Violation: This business day is LOCKED (Rule 4).';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. UPDATE RLS POLICIES TO USE GLOBAL LOCK CHECK & AUDITOR ACCESS

-- Transactions Insert Policy
DROP POLICY IF EXISTS insert_transactions_staff_manager ON public.transactions;
CREATE POLICY insert_transactions_staff_manager
ON public.transactions FOR INSERT
WITH CHECK (
  -- Must NOT be locked
  (
     NOT EXISTS (
       SELECT 1 FROM public.day_locks 
       WHERE outlet_id = transactions.outlet_id 
       AND locked_date = transactions.ledger_date 
       AND status = 'locked'
     )
  )
  AND
  (
    -- Allowed Roles
    check_is_admin() OR 
    (outlet_id = (select outlet_id from public.users where id = auth.uid()))
  )
);

-- Transaction View Policy (Simplification using updated check_is_admin)
DROP POLICY IF EXISTS "transactions_view" ON public.transactions;
CREATE POLICY "transactions_view" ON transactions 
    FOR SELECT TO authenticated 
    USING (
        check_is_admin() -- Includes Auditor now
        OR 
        outlet_id = (select outlet_id from public.users where id = auth.uid())
        OR
        -- Fallback for legacy rows without outlet_id (via daily_records)
        EXISTS (
            SELECT 1 FROM daily_records dr
            WHERE dr.id = transactions.daily_record_id
            AND dr.outlet_id = (select outlet_id from public.users where id = auth.uid())
        )
    );
