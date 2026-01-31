create extension if not exists "pgcrypto";

create table if not exists earnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  source text,
  amount numeric,
  date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  category text,
  amount numeric,
  note text,
  date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists heatmap_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  lat double precision,
  lng double precision,
  intensity double precision,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index if not exists earnings_user_id_idx on earnings (user_id);
create index if not exists expenses_user_id_idx on expenses (user_id);
create index if not exists heatmap_user_id_idx on heatmap_points (user_id);

alter table earnings enable row level security;
alter table expenses enable row level security;
alter table heatmap_points enable row level security;

create policy "Earnings: user access" on earnings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Expenses: user access" on expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


create policy "Heatmap: user access" on heatmap_points
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;

grant select, insert, update on earnings to authenticated;
grant select, insert, update on expenses to authenticated;
grant select, insert, update on heatmap_points to authenticated;
