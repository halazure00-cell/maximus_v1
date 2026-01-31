create unique index if not exists heatmap_points_unique_user_lat_lng_time
on public.heatmap_points (user_id, lat, lng, created_at);

create index if not exists heatmap_points_user_created_at_idx
on public.heatmap_points (user_id, created_at);

alter table public.heatmap_points
  add constraint heatmap_points_lat_range
  check (lat between -90 and 90);

alter table public.heatmap_points
  add constraint heatmap_points_lng_range
  check (lng between -180 and 180);
