create or replace function set_monthly_closure_snapshot_hash()
returns trigger as $$
begin
  new.snapshot_hash := md5(coalesce(to_jsonb(new.snapshot)::text,'') || coalesce(new.month_date,'') || coalesce(new.outlet_id,''));
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_snapshot_hash on monthly_closure_snapshots;
create trigger trg_set_snapshot_hash
before insert or update on monthly_closure_snapshots
for each row execute function set_monthly_closure_snapshot_hash();

