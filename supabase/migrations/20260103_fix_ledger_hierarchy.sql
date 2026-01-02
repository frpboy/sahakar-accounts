-- 1. Ensure essential leaf accounts exist
INSERT INTO public.ledger_accounts (code, name, type, parent_id, is_system)
SELECT 'PUR', 'Purchases', 'Expense', id, true FROM public.ledger_accounts WHERE code = 'EXP'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.ledger_accounts (code, name, type, parent_id, is_system)
SELECT 'CUS', 'Customer Receivables', 'Asset', id, true FROM public.ledger_accounts WHERE code = 'CAS'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.ledger_accounts (code, name, type, parent_id, is_system)
SELECT 'WAG', 'Wages & Salary', 'Expense', id, true FROM public.ledger_accounts WHERE code = 'OPR'
ON CONFLICT (code) DO NOTHING;

-- 2. Retroactively fix is_leaf status
UPDATE public.ledger_accounts SET is_leaf = true;
UPDATE public.ledger_accounts SET is_leaf = false 
WHERE id IN (SELECT parent_id FROM public.ledger_accounts WHERE parent_id IS NOT NULL);

-- 3. Update level for hierarchy
UPDATE public.ledger_accounts SET level = 1 WHERE parent_id IS NULL;
UPDATE public.ledger_accounts t SET level = p.level + 1 
FROM public.ledger_accounts p WHERE t.parent_id = p.id;
