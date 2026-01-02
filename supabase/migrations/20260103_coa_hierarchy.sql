-- 1. Create Ledger Account Types Enum
DO $$ BEGIN
    CREATE TYPE public.account_type AS ENUM ('Asset', 'Liability', 'Equity', 'Income', 'Expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Ledger Accounts Table
CREATE TABLE IF NOT EXISTS public.ledger_accounts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    type public.account_type NOT NULL,
    parent_id uuid REFERENCES public.ledger_accounts(id),
    status text DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    is_system boolean DEFAULT false, -- True for core accounts that cannot be renamed
    is_locked boolean DEFAULT false, -- True for system-controlled core structure
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    outlet_id uuid REFERENCES public.outlets(id), -- Null for global accounts
    CONSTRAINT ledger_accounts_pkey PRIMARY KEY (id)
);

-- 3. Seed Root Accounts (Blueprint Level 1)
INSERT INTO public.ledger_accounts (code, name, type, is_system, is_locked)
VALUES 
('AST', 'Assets', 'Asset', true, true),
('LIA', 'Liabilities', 'Liability', true, true),
('EQU', 'Equity', 'Equity', true, true),
('INC', 'Income', 'Income', true, true),
('EXP', 'Expenses', 'Expense', true, true)
ON CONFLICT (code) DO NOTHING;

-- 4. Seed Level 2 Accounts (Blueprint Examples)
-- Current Assets under Assets
INSERT INTO public.ledger_accounts (code, name, type, parent_id, is_system)
SELECT 'CAS', 'Current Assets', 'Asset', id, true FROM public.ledger_accounts WHERE code = 'AST'
ON CONFLICT (code) DO NOTHING;

-- Sales under Income
INSERT INTO public.ledger_accounts (code, name, type, parent_id, is_system)
SELECT 'SAL', 'Sales Revenue', 'Income', id, true FROM public.ledger_accounts WHERE code = 'INC'
ON CONFLICT (code) DO NOTHING;

-- Operating Expenses under Expenses
INSERT INTO public.ledger_accounts (code, name, type, parent_id, is_system)
SELECT 'OPR', 'Operating Expenses', 'Expense', id, true FROM public.ledger_accounts WHERE code = 'EXP'
ON CONFLICT (code) DO NOTHING;

-- 5. Seed Level 3 Accounts (Leaf Nodes)
-- Cash in Hand under Current Assets
INSERT INTO public.ledger_accounts (code, name, type, parent_id)
SELECT 'CHH', 'Cash in Hand', 'Asset', id FROM public.ledger_accounts WHERE code = 'CAS'
ON CONFLICT (code) DO NOTHING;

-- Bank/UPI under Current Assets
INSERT INTO public.ledger_accounts (code, name, type, parent_id)
SELECT 'BNK', 'Bank - UPI', 'Asset', id FROM public.ledger_accounts WHERE code = 'CAS'
ON CONFLICT (code) DO NOTHING;

-- 6. Add Reference to Transactions
-- First, add column nullably
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS ledger_account_id uuid REFERENCES public.ledger_accounts(id);

-- Migrate existing 'category' strings to ledger_accounts (Best effort match)
-- We map old text categories to our new IDs
UPDATE public.transactions t
SET ledger_account_id = (SELECT id FROM public.ledger_accounts WHERE name ILIKE t.category LIMIT 1)
WHERE ledger_account_id IS NULL;

-- If no match, set to some default or leave for manual fix
-- (In a real ERP migration, we'd be more surgical)
