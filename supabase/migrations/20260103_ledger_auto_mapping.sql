-- Trigger to automatically set ledger_account_id based on legacy category
CREATE OR REPLACE FUNCTION public.fn_auto_map_ledger_account()
RETURNS TRIGGER AS $$
DECLARE
    target_id UUID;
BEGIN
    -- Only map if ledger_account_id is NULL
    IF NEW.ledger_account_id IS NULL THEN
        -- Map based on category string
        CASE LOWER(NEW.category)
            WHEN 'sales' THEN 
                SELECT id INTO target_id FROM public.ledger_accounts WHERE code = '3001' LIMIT 1;
            WHEN 'purchase' THEN 
                SELECT id INTO target_id FROM public.ledger_accounts WHERE code = '4001' LIMIT 1;
            WHEN 'operating', 'expense' THEN 
                SELECT id INTO target_id FROM public.ledger_accounts WHERE code = '4002' LIMIT 1;
            WHEN 'salary' THEN 
                SELECT id INTO target_id FROM public.ledger_accounts WHERE code = '4003' LIMIT 1;
            WHEN 'customer_credit' THEN 
                SELECT id INTO target_id FROM public.ledger_accounts WHERE code = '1003' LIMIT 1; -- Customer Receivables
            ELSE
                -- Default to a general bucket or leave NULL for RLS to block if enforced
                NULL;
        END CASE;
        
        NEW.ledger_account_id := target_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_map_ledger_account ON public.transactions;
CREATE TRIGGER trg_auto_map_ledger_account
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_map_ledger_account();
