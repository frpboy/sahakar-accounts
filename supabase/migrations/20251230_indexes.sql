-- Indexes for performance
create index if not exists idx_daily_records_outlet_date on daily_records (outlet_id, date);
create index if not exists idx_transactions_record_created on transactions (daily_record_id, created_at);
create index if not exists idx_audit_logs_created on audit_logs (created_at);

-- Idempotency unique constraint
create unique index if not exists uniq_transactions_idempotency on transactions (idempotency_key) where idempotency_key is not null;

