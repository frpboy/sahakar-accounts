-- Performance indexes for monthly view
CREATE INDEX IF NOT EXISTS idx_daily_records_outlet_date ON public.daily_records (outlet_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON public.daily_records (date);
