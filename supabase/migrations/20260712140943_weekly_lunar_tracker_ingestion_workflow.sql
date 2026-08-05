create table if not exists public.weekly_lunar_ingestion_runs (
    id uuid primary key default gen_random_uuid(),
    run_key text not null unique,
    source_registry_id uuid not null references public.intelligence_data_sources(id) on delete restrict,
    status text not null default 'running' check (status in ('running','completed','partial','failed')),
    window_start_at timestamptz not null,
    window_end_at timestamptz not null,
    source_checked_at timestamptz not null,
    records_fetched integer not null default 0 check (records_fetched >= 0),
    records_relevant integer not null default 0 check (records_relevant >= 0),
    records_created integer not null default 0 check (records_created >= 0),
    records_updated integer not null default 0 check (records_updated >= 0),
    conflicts_found integer not null default 0 check (conflicts_found >= 0),
    error_summary text,
    metadata jsonb not null default '{}'::jsonb,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    check (window_end_at > window_start_at),
    check (status = 'running' or completed_at is not null)
);

alter table public.weekly_lunar_tracker_entries
    add column if not exists external_source_key text,
    add column if not exists ingestion_run_id uuid references public.weekly_lunar_ingestion_runs(id) on delete set null,
    add column if not exists source_checked_at timestamptz,
    add column if not exists source_conflict boolean not null default false,
    add column if not exists conflict_summary text,
    add column if not exists schedule_change_type text check (schedule_change_type is null or schedule_change_type in ('new','slip','scrub','hold','no_earlier_than','status_change','unchanged')),
    add column if not exists ingestion_confidence text check (ingestion_confidence is null or ingestion_confidence in ('low','medium','high','official'));

create unique index if not exists weekly_tracker_external_key_idx
on public.weekly_lunar_tracker_entries (primary_source_id, external_source_key)
where external_source_key is not null;
create index if not exists weekly_tracker_ingestion_run_idx
on public.weekly_lunar_tracker_entries (ingestion_run_id) where ingestion_run_id is not null;

create table if not exists public.weekly_lunar_source_conflicts (
    id uuid primary key default gen_random_uuid(),
    tracker_entry_id uuid not null references public.weekly_lunar_tracker_entries(id) on delete cascade,
    ingestion_run_id uuid references public.weekly_lunar_ingestion_runs(id) on delete set null,
    field_name text not null,
    primary_value text,
    conflicting_value text,
    conflicting_source_id uuid not null references public.intelligence_data_sources(id) on delete restrict,
    conflicting_citation_url text not null check (conflicting_citation_url ~ '^https://'),
    resolution_status text not null default 'open' check (resolution_status in ('open','resolved_primary','resolved_conflicting','superseded')),
    resolution_note text,
    resolved_by uuid references auth.users(id) on delete set null,
    resolved_at timestamptz,
    created_at timestamptz not null default now(),
    check ((resolved_at is null and resolved_by is null) or (resolved_at is not null and resolved_by is not null))
);

create table if not exists public.weekly_lunar_ingestion_source_checks (
    id uuid primary key default gen_random_uuid(),
    ingestion_run_id uuid not null references public.weekly_lunar_ingestion_runs(id) on delete cascade,
    source_registry_id uuid not null references public.intelligence_data_sources(id) on delete restrict,
    check_status text not null check (check_status in ('checked','pending_manual','unavailable','conflict')),
    checked_at timestamptz,
    citation_url text check (citation_url is null or citation_url ~ '^https://'),
    check_note text,
    created_at timestamptz not null default now(),
    unique (ingestion_run_id, source_registry_id)
);

create table if not exists public.weekly_lunar_empty_states (
    id uuid primary key default gen_random_uuid(),
    week_timezone text not null default 'UTC',
    week_start_local date not null,
    week_end_local date generated always as (week_start_local + 6) stored,
    filter_scope text not null default 'all' check (filter_scope in ('all','lunar_cislunar')),
    message text not null default 'No launches this week' check (message = 'No launches this week'),
    source_registry_id uuid not null references public.intelligence_data_sources(id) on delete restrict,
    ingestion_run_id uuid not null references public.weekly_lunar_ingestion_runs(id) on delete cascade,
    source_checked_at timestamptz not null,
    source_reviewed boolean not null default true,
    publication_status text not null default 'published' check (publication_status in ('published','archived')),
    created_at timestamptz not null default now(),
    unique (week_timezone, week_start_local, filter_scope),
    check (extract(isodow from week_start_local) = 1)
);

create table if not exists public.weekly_lunar_review_decisions (
    id uuid primary key default gen_random_uuid(),
    tracker_entry_id uuid not null references public.weekly_lunar_tracker_entries(id) on delete cascade,
    decision text not null check (decision in ('approved','changes_requested','unpublished')),
    review_note text,
    reviewer_user_id uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz not null default now()
);

create index if not exists weekly_lunar_runs_source_idx on public.weekly_lunar_ingestion_runs (source_registry_id, source_checked_at desc);
create index if not exists weekly_lunar_conflicts_entry_idx on public.weekly_lunar_source_conflicts (tracker_entry_id, resolution_status);
create index if not exists weekly_lunar_conflicts_source_idx on public.weekly_lunar_source_conflicts (conflicting_source_id);
create index if not exists weekly_lunar_conflicts_run_idx on public.weekly_lunar_source_conflicts (ingestion_run_id) where ingestion_run_id is not null;
create index if not exists weekly_lunar_conflicts_resolved_by_idx on public.weekly_lunar_source_conflicts (resolved_by) where resolved_by is not null;
create index if not exists weekly_lunar_source_checks_source_idx on public.weekly_lunar_ingestion_source_checks (source_registry_id, checked_at desc nulls last);
create index if not exists weekly_lunar_empty_source_idx on public.weekly_lunar_empty_states (source_registry_id);
create index if not exists weekly_lunar_empty_run_idx on public.weekly_lunar_empty_states (ingestion_run_id);
create index if not exists weekly_lunar_review_entry_idx on public.weekly_lunar_review_decisions (tracker_entry_id, created_at desc);
create index if not exists weekly_lunar_review_reviewer_idx on public.weekly_lunar_review_decisions (reviewer_user_id);

create or replace function public.review_weekly_lunar_tracker_entry(p_entry_id uuid, p_decision text, p_note text default null)
returns public.weekly_lunar_tracker_entries language plpgsql security definer set search_path = public, pg_temp as $$
declare v_entry public.weekly_lunar_tracker_entries;
begin
    if not app_private.has_any_role(array['editor','admin']) then raise exception 'editor or admin role required'; end if;
    if p_decision not in ('approved','changes_requested','unpublished') then raise exception 'invalid review decision'; end if;
    if p_decision = 'approved' and exists (select 1 from public.weekly_lunar_source_conflicts conflict where conflict.tracker_entry_id = p_entry_id and conflict.resolution_status = 'open') then
        raise exception 'resolve source conflicts before approval';
    end if;
    update public.weekly_lunar_tracker_entries set
        publication_status = case p_decision when 'approved' then 'published' when 'changes_requested' then 'in_review' else 'archived' end,
        reviewed_by = auth.uid(), last_reviewed_at = now(), updated_by = auth.uid()
    where id = p_entry_id returning * into v_entry;
    if v_entry.id is null then raise exception 'tracker entry not found'; end if;
    insert into public.weekly_lunar_review_decisions (tracker_entry_id, decision, review_note, reviewer_user_id)
    values (p_entry_id, p_decision, nullif(trim(p_note), ''), auth.uid());
    return v_entry;
end; $$;

create or replace function public.enforce_source_reviewed_empty_state()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
    if not new.source_reviewed or not exists (
        select 1 from public.weekly_lunar_ingestion_runs run
        join public.intelligence_data_sources source on source.id = run.source_registry_id
        where run.id = new.ingestion_run_id and run.status = 'completed' and run.records_relevant = 0
          and run.source_checked_at = new.source_checked_at and source.id = new.source_registry_id
          and source.license_status = 'approved' and source.analyst_review_state = 'approved'
    ) then raise exception 'empty state requires a completed zero-result approved-source run'; end if;
    return new;
end; $$;
create trigger enforce_source_reviewed_empty_state before insert or update on public.weekly_lunar_empty_states
for each row execute function public.enforce_source_reviewed_empty_state();

alter table public.weekly_lunar_ingestion_runs enable row level security;
alter table public.weekly_lunar_source_conflicts enable row level security;
alter table public.weekly_lunar_ingestion_source_checks enable row level security;
alter table public.weekly_lunar_empty_states enable row level security;
alter table public.weekly_lunar_review_decisions enable row level security;
create policy "Staff manage lunar ingestion runs" on public.weekly_lunar_ingestion_runs for all to authenticated using (app_private.has_any_role(array['editor','analyst','admin'])) with check (app_private.has_any_role(array['editor','analyst','admin']));
create policy "Staff manage lunar source conflicts" on public.weekly_lunar_source_conflicts for all to authenticated using (app_private.has_any_role(array['editor','analyst','admin'])) with check (app_private.has_any_role(array['editor','analyst','admin']));
create policy "Staff manage lunar ingestion source checks" on public.weekly_lunar_ingestion_source_checks for all to authenticated using (app_private.has_any_role(array['editor','analyst','admin'])) with check (app_private.has_any_role(array['editor','analyst','admin']));
create policy "Members read published lunar empty states" on public.weekly_lunar_empty_states for select to authenticated using (publication_status = 'published' and app_private.can_read_tracker_tier('member'));
create policy "Staff manage lunar empty states" on public.weekly_lunar_empty_states for all to authenticated using (app_private.has_any_role(array['editor','analyst','admin'])) with check (app_private.has_any_role(array['editor','analyst','admin']));
create policy "Staff read lunar review decisions" on public.weekly_lunar_review_decisions for select to authenticated using (app_private.has_any_role(array['editor','analyst','admin']));

grant select, insert, update on public.weekly_lunar_ingestion_runs, public.weekly_lunar_source_conflicts, public.weekly_lunar_ingestion_source_checks, public.weekly_lunar_empty_states to authenticated;
grant select on public.weekly_lunar_review_decisions to authenticated;
grant execute on function public.review_weekly_lunar_tracker_entry(uuid,text,text) to authenticated;
grant all on public.weekly_lunar_ingestion_runs, public.weekly_lunar_source_conflicts, public.weekly_lunar_ingestion_source_checks, public.weekly_lunar_empty_states, public.weekly_lunar_review_decisions to service_role;
revoke all on function public.enforce_source_reviewed_empty_state() from public, anon, authenticated;
