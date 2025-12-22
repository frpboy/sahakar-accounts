-- Add idempotency_key column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Create unique index on idempotency_key (NULL values allowed, multiples NULL ok)
CREATE UNIQUE INDEX IF NOT EXISTS transactions_idempotency_key_idx 
ON transactions(idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- Add unique constraint on outlet_id + date for daily_records
-- This prevents race condition where two requests create duplicate records
ALTER TABLE daily_records 
ADD CONSTRAINT daily_records_outlet_date_unique 
UNIQUE (outlet_id, date);

-- Add check constraints for data integrity
ALTER TABLE transactions
ADD CONSTRAINT transactions_amount_positive 
CHECK (amount > 0);

ALTER TABLE transactions
ADD CONSTRAINT transactions_type_valid 
CHECK (type IN ('income', 'expense'));

ALTER TABLE transactions
ADD CONSTRAINT transactions_payment_mode_valid 
CHECK (payment_mode IN ('cash', 'upi'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS transactions_daily_record_idx 
ON transactions(daily_record_id);

CREATE INDEX IF NOT EXISTS transactions_created_at_idx 
ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS daily_records_outlet_date_idx 
ON daily_records(outlet_id, date DESC);

CREATE INDEX IF NOT EXISTS daily_records_status_idx 
ON daily_records(status);

-- Comments
COMMENT ON COLUMN transactions.idempotency_key IS 
'Client-generated key to prevent duplicate transactions on retry';

COMMENT ON CONSTRAINT daily_records_outlet_date_unique ON daily_records IS 
'Ensures only one daily record per outlet per date, prevents race conditions';
