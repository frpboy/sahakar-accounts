-- Add physical tallying fields to daily_records table
ALTER TABLE public.daily_records 
ADD COLUMN IF NOT EXISTS physical_cash NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS physical_upi NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tally_comment TEXT;

-- Update existing records to have 0 instead of NULL for new numeric columns
UPDATE public.daily_records 
SET physical_cash = 0 
WHERE physical_cash IS NULL;

UPDATE public.daily_records 
SET physical_upi = 0 
WHERE physical_upi IS NULL;
