-- Add customer_id to transactions for professional linkage
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON public.transactions(customer_id);

-- Backfill existing records based on phone number
UPDATE public.transactions t
SET customer_id = c.id
FROM public.customers c
WHERE t.customer_phone = c.phone
AND t.customer_id IS NULL;
