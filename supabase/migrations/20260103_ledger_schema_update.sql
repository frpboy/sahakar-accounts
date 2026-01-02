-- Ledger Compliance Schema Update

-- 1. Add Source & Audit Columns to Transactions (Rule 6, 7, 8)
alter table public.transactions
add column if not exists source_type text check (source_type in ('sale', 'purchase', 'return', 'manual', 'adjustment', 'system')),
add column if not exists source_id uuid, -- Reference to original ID if applicable
add column if not exists ledger_date date default current_date, -- Rule 7: Business Date
add column if not exists is_manual boolean default false, -- Rule 8
add column if not exists is_reversal boolean default false, -- Rule 3: Reversals
add column if not exists parent_transaction_id uuid references public.transactions(id); -- Traceability

-- 2. Backfill existing data
update public.transactions 
set ledger_date = created_at::date,
    source_type = 'system',
    is_manual = false
where ledger_date is null;

-- 3. Add Index for Ledger Date (Perf)
create index if not exists idx_transactions_ledger_date on public.transactions(ledger_date);
create index if not exists idx_transactions_source_type on public.transactions(source_type);

-- 4. Constraint: Reversals must have parent
-- alter table public.transactions add constraint check_reversal_parent check (
--    (is_reversal = true and parent_transaction_id is not null) or (is_reversal = false)
-- );
-- Commented out for safety during migration, but logic should enforce it.
