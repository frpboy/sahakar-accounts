-- Migration: Add missing columns for new features
-- Date: 2026-01-05

-- 1. Customers Table: Add Assignment and Referral columns
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS assigned_to_user_id uuid REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS referred_by_user_id uuid REFERENCES public.users(id);

-- 2. Transactions Table: Add Refill Reminder
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS refill_days integer;

-- 3. Transactions Table: Add Extra Financial Fields (Expenses/Purchase)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS other_charges numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS remarks text,
ADD COLUMN IF NOT EXISTS bank_tx_id text;

-- 4. Transactions Table: Add Purchase-Specific Fields
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS erp_id text,
ADD COLUMN IF NOT EXISTS external_bill_number text,
ADD COLUMN IF NOT EXISTS supplier_name text;

-- 5. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_transactions_entry_number ON public.transactions(entry_number);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
