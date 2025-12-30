-- Materialized view for monthly summaries by outlet
create materialized view if not exists mv_monthly_summary as
select
  dr.outlet_id,
  to_char(dr.date::date, 'YYYY-MM') as month,
  sum(coalesce(dr.total_income,0)) as total_income,
  sum(coalesce(dr.total_expense,0)) as total_expense,
  sum(coalesce(dr.closing_cash,0)) as closing_cash,
  sum(coalesce(dr.closing_upi,0)) as closing_upi,
  count(*) as days_count
from daily_records dr
group by dr.outlet_id, to_char(dr.date::date, 'YYYY-MM');

create index if not exists idx_mv_monthly_outlet_month on mv_monthly_summary (outlet_id, month);

