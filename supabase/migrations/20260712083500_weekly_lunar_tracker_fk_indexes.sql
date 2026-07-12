create index if not exists weekly_tracker_entries_reviewed_by_idx on public.weekly_lunar_tracker_entries (reviewed_by) where reviewed_by is not null;
create index if not exists weekly_tracker_entries_created_by_idx on public.weekly_lunar_tracker_entries (created_by) where created_by is not null;
create index if not exists weekly_tracker_entries_updated_by_idx on public.weekly_lunar_tracker_entries (updated_by) where updated_by is not null;
create index if not exists weekly_tracker_sources_created_by_idx on public.weekly_lunar_tracker_sources (created_by) where created_by is not null;
create index if not exists weekly_tracker_values_reviewed_by_idx on public.weekly_lunar_tracker_values (reviewed_by) where reviewed_by is not null;
create index if not exists weekly_tracker_values_created_by_idx on public.weekly_lunar_tracker_values (created_by) where created_by is not null;
create index if not exists weekly_tracker_values_updated_by_idx on public.weekly_lunar_tracker_values (updated_by) where updated_by is not null;
create index if not exists weekly_tracker_audit_actor_idx on public.weekly_lunar_tracker_audit (actor_user_id) where actor_user_id is not null;
