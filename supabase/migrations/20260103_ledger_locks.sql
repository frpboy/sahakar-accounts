-- Create table for Day Locks
create table if not exists public.day_locks (
    id uuid default gen_random_uuid() primary key,
    outlet_id uuid references public.outlets(id) not null,
    locked_date date not null,
    status text check (status in ('locked', 'unlocked')) default 'locked',
    reason text,
    locked_by uuid references public.users(id),
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(outlet_id, locked_date)
);

-- Enable RLS
alter table public.day_locks enable row level security;

-- Policies
DROP POLICY IF EXISTS "Managers can view locks" ON public.day_locks;
create policy "Managers can view locks" on public.day_locks
    for select using (true);

DROP POLICY IF EXISTS "Managers/Admins can manage locks" ON public.day_locks;
create policy "Managers/Admins can manage locks" on public.day_locks
    for all using (
        exists (
            select 1 from public.users
            where users.id = auth.uid()
            and (users.role in ('outlet_manager', 'ho_accountant', 'master_admin', 'superadmin'))
        )
    );
