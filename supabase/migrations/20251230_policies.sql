-- Example RLS policies for transactions with outlet scoping
-- Assumes 'users' table holds role and outlet_id

alter table transactions enable row level security;

drop policy if exists select_transactions_same_outlet on transactions;
create policy select_transactions_same_outlet
on transactions for select
using (
  exists (
    select 1 from daily_records dr
    join users u on u.id = auth.uid()
    where dr.id = transactions.daily_record_id
      and (u.role in ('superadmin','master_admin','ho_accountant') or dr.outlet_id = u.outlet_id)
  )
);

drop policy if exists insert_transactions_staff_manager on transactions;
create policy insert_transactions_staff_manager
on transactions for insert
with check (
  exists (
    select 1 from daily_records dr
    join users u on u.id = auth.uid()
    where dr.id = transactions.daily_record_id
      and (
        (u.role in ('superadmin','master_admin')) or
        (u.role in ('outlet_staff','outlet_manager') and dr.outlet_id = u.outlet_id)
      )
  )
);

drop policy if exists update_transactions_staff_manager on transactions;
create policy update_transactions_staff_manager
on transactions for update
using (
  exists (
    select 1 from daily_records dr
    join users u on u.id = auth.uid()
    where dr.id = transactions.daily_record_id
      and (
        (u.role in ('superadmin','master_admin')) or
        (u.role in ('outlet_staff','outlet_manager') and dr.outlet_id = u.outlet_id)
      )
  )
)
with check (
  exists (
    select 1 from daily_records dr
    join users u on u.id = auth.uid()
    where dr.id = transactions.daily_record_id
      and (
        (u.role in ('superadmin','master_admin')) or
        (u.role in ('outlet_staff','outlet_manager') and dr.outlet_id = u.outlet_id)
      )
  )
);

drop policy if exists delete_transactions_staff_manager on transactions;
create policy delete_transactions_staff_manager
on transactions for delete
using (
  exists (
    select 1 from daily_records dr
    join users u on u.id = auth.uid()
    where dr.id = transactions.daily_record_id
      and (
        (u.role in ('superadmin','master_admin')) or
        (u.role in ('outlet_staff','outlet_manager') and dr.outlet_id = u.outlet_id)
      )
  )
);

