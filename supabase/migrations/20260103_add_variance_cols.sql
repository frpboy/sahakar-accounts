-- Add explicit variance tracking for Rule 9
ALTER TABLE public.daily_records
ADD COLUMN IF NOT EXISTS cash_variance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS upi_variance numeric DEFAULT 0;

-- Update the status check to include 'locked' as a terminal state
ALTER TABLE public.daily_records
DROP CONSTRAINT IF EXISTS daily_records_status_check;

ALTER TABLE public.daily_records
ADD CONSTRAINT daily_records_status_check 
CHECK (status IN ('draft', 'open', 'submitted', 'locked', 'reopened'));
