-- Drop the restrictive check constraint on payment_modes
-- The error reported was "transactions_payment_mode_valid"
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS "transactions_payment_mode_valid";
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS "transactions_payment_modes_check";

-- Also drop constraint on `payment_mode` (singular) if it exists, as older schema had it
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS "transactions_payment_mode_check";

-- Allow the column to hold any text since we store comma-separated values (e.g. 'Cash,UPI')
-- and new modes like 'Card' and 'Credit'.
-- Application logic handles the validation.
