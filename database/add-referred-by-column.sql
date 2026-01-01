-- Add missing referred_by column to customers table
-- Run this in Supabase SQL Editor

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS referred_by text;

-- Add index for better performance on referral queries
CREATE INDEX IF NOT EXISTS idx_customers_referred_by ON public.customers(referred_by);

-- Update comment
COMMENT ON COLUMN public.customers.referred_by IS 'Name of the person/staff who referred this customer';
