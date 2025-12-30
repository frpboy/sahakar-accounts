create table if not exists outlet_chats (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null,
  user_id uuid not null,
  role text,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists outlet_chats_outlet_idx on outlet_chats (outlet_id);
alter publication supabase_realtime add table outlet_chats;

create table if not exists dashboard_annotations (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null,
  user_id uuid not null,
  page_key text not null,
  text text not null,
  created_at timestamptz default now()
);

create index if not exists dashboard_annotations_outlet_page_idx on dashboard_annotations (outlet_id, page_key);
alter publication supabase_realtime add table dashboard_annotations;

