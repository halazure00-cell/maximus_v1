create extension if not exists "pgcrypto";

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  origin text,
  destination text,
  fare numeric,
  distance numeric,
  date timestamptz,
  location_lat double precision,
  location_lng double precision,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

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

create table if not exists schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text,
  target text,
  date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text,
  note text,
  reminder timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists heatmap_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  trip_id uuid,
  lat double precision,
  lng double precision,
  intensity double precision,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index if not exists trips_user_id_idx on trips (user_id);
create index if not exists trips_date_idx on trips (date);
create index if not exists earnings_user_id_idx on earnings (user_id);
create index if not exists expenses_user_id_idx on expenses (user_id);
create index if not exists schedule_user_id_idx on schedule (user_id);
create index if not exists notes_user_id_idx on notes (user_id);
create index if not exists heatmap_user_id_idx on heatmap_points (user_id);

alter table trips enable row level security;
alter table earnings enable row level security;
alter table expenses enable row level security;
alter table schedule enable row level security;
alter table notes enable row level security;
alter table heatmap_points enable row level security;

create policy "Trips: user access" on trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Earnings: user access" on earnings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Expenses: user access" on expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Schedule: user access" on schedule
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Notes: user access" on notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Heatmap: user access" on heatmap_points
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;

grant select, insert, update on trips to authenticated;
grant select, insert, update on earnings to authenticated;
grant select, insert, update on expenses to authenticated;
grant select, insert, update on schedule to authenticated;
grant select, insert, update on notes to authenticated;
grant select, insert, update on heatmap_points to authenticated;
