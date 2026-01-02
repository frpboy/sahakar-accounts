-- 1. STRICT IMMUTABILITY: Block UPDATE/DELETE on Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow SELECT for all authenticated users in their outlet
DROP POLICY IF EXISTS "Users can view their outlet transactions" ON public.transactions;
CREATE POLICY "Users can view her outlet transactions" 
ON public.transactions FOR SELECT 
TO authenticated 
USING (outlet_id IN (SELECT outlet_id FROM public.users WHERE id = auth.uid()));

-- Allow INSERT only (No Update, No Delete)
DROP POLICY IF EXISTS "Users can insert outlet transactions" ON public.transactions;
CREATE POLICY "Users can insert outlet transactions" 
ON public.transactions FOR INSERT 
TO authenticated 
WITH CHECK (
    outlet_id IN (SELECT outlet_id FROM public.users WHERE id = auth.uid())
    AND NOT EXISTS (
        -- Rule 6: Block Insert if Day is Locked
        SELECT 1 FROM public.day_locks 
        WHERE outlet_id = transactions.outlet_id 
        AND date = transactions.ledger_date
        AND is_locked = true
    )
);

-- Deny UPDATE/DELETE (ERP-Grade Security)
DROP POLICY IF EXISTS "No updates to transactions" ON public.transactions;
CREATE POLICY "No updates to transactions" ON public.transactions FOR UPDATE USING (false);

DROP POLICY IF EXISTS "No deletions from transactions" ON public.transactions;
CREATE POLICY "No deletions from transactions" ON public.transactions FOR DELETE USING (false);


-- 2. AUDIT LOG IMMUTABILITY
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit logs are read-only appendable" ON public.audit_logs;
CREATE POLICY "Audit logs are read-only appendable" 
ON public.audit_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Audit logs are insert only" ON public.audit_logs;
CREATE POLICY "Audit logs are insert only" 
ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "No updates to audit_logs" ON public.audit_logs;
CREATE POLICY "No updates to audit_logs" ON public.audit_logs FOR UPDATE USING (false);

DROP POLICY IF EXISTS "No deletions from audit_logs" ON public.audit_logs;
CREATE POLICY "No deletions from audit_logs" ON public.audit_logs FOR DELETE USING (false);
