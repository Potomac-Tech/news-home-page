create table if not exists public.weekly_lunar_tracker_entries (
    id uuid primary key default gen_random_uuid(),
    event_type text not null check (event_type in ('launch', 'mission_milestone')),
    title text not null check (length(trim(title)) between 3 and 200),
    week_timezone text not null default 'UTC' check (length(trim(week_timezone)) between 1 and 80),
    week_start_local date not null,
    week_end_local date generated always as (week_start_local + 6) stored,
    scheduled_at timestamptz,
    launch_provider text,
    vehicle text,
    mission_name text not null check (length(trim(mission_name)) > 0),
    customer_payload text,
    launch_site text,
    event_location text,
    target_orbit_location text not null check (length(trim(target_orbit_location)) > 0),
    status text not null check (status in ('planned', 'confirmed', 'in_progress', 'success', 'partial_success', 'delayed', 'scrubbed', 'failed', 'cancelled', 'unknown')),
    schedule_confidence text not null default 'low' check (schedule_confidence in ('low', 'medium', 'high', 'official')),
    is_lunar_or_cislunar boolean not null default true,
    publication_status text not null default 'draft' check (publication_status in ('draft', 'in_review', 'published', 'archived')),
    visibility text not null default 'public' check (visibility in ('public', 'member', 'scout', 'command')),
    primary_source_id uuid references public.intelligence_data_sources(id) on delete restrict,
    last_reviewed_at timestamptz,
    reviewed_by uuid references auth.users(id) on delete set null,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint weekly_tracker_monday_start check (extract(isodow from week_start_local) = 1),
    constraint weekly_tracker_launch_fields check (event_type <> 'launch' or (launch_provider is not null and vehicle is not null and launch_site is not null)),
    constraint weekly_tracker_published_review check (publication_status <> 'published' or (primary_source_id is not null and last_reviewed_at is not null and reviewed_by is not null and is_lunar_or_cislunar))
);

create table if not exists public.weekly_lunar_tracker_sources (
    id uuid primary key default gen_random_uuid(),
    tracker_entry_id uuid not null references public.weekly_lunar_tracker_entries(id) on delete cascade,
    source_registry_id uuid not null references public.intelligence_data_sources(id) on delete restrict,
    citation_title text not null check (length(trim(citation_title)) > 0),
    citation_url text not null check (citation_url ~ '^https://'),
    source_published_at timestamptz,
    retrieved_at timestamptz not null default now(),
    is_primary boolean not null default false,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    unique (tracker_entry_id, source_registry_id, citation_url)
);

create unique index if not exists weekly_tracker_one_primary_source_idx
on public.weekly_lunar_tracker_sources (tracker_entry_id) where is_primary;

create table if not exists public.weekly_lunar_tracker_values (
    id uuid primary key default gen_random_uuid(),
    tracker_entry_id uuid not null references public.weekly_lunar_tracker_entries(id) on delete cascade,
    value_state text not null default 'unknown' check (value_state in ('unknown', 'exact_cited', 'cited_range', 'analyst_estimate', 'withheld')),
    value_visibility text not null default 'scout' check (value_visibility in ('public', 'member', 'scout', 'command')),
    currency_code text not null default 'USD' check (currency_code ~ '^[A-Z]{3}$'),
    exact_cited_value numeric(20,2),
    cited_range_low numeric(20,2),
    cited_range_high numeric(20,2),
    analyst_estimate numeric(20,2),
    estimate_methodology text,
    estimate_confidence text check (estimate_confidence is null or estimate_confidence in ('low', 'medium', 'high')),
    source_registry_id uuid references public.intelligence_data_sources(id) on delete restrict,
    source_citation_url text check (source_citation_url is null or source_citation_url ~ '^https://'),
    source_citation_note text,
    last_reviewed_at timestamptz,
    reviewed_by uuid references auth.users(id) on delete set null,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (tracker_entry_id),
    constraint weekly_tracker_value_nonnegative check (
        coalesce(exact_cited_value, 0) >= 0 and coalesce(cited_range_low, 0) >= 0
        and coalesce(cited_range_high, 0) >= 0 and coalesce(analyst_estimate, 0) >= 0
    ),
    constraint weekly_tracker_value_range_order check (cited_range_low is null or cited_range_high is null or cited_range_high >= cited_range_low),
    constraint weekly_tracker_value_state_fields check (
        (value_state = 'unknown' and exact_cited_value is null and cited_range_low is null and cited_range_high is null and analyst_estimate is null)
        or (value_state = 'withheld' and exact_cited_value is null and cited_range_low is null and cited_range_high is null and analyst_estimate is null)
        or (value_state = 'exact_cited' and exact_cited_value is not null and source_registry_id is not null and source_citation_url is not null)
        or (value_state = 'cited_range' and cited_range_low is not null and cited_range_high is not null and source_registry_id is not null and source_citation_url is not null)
        or (value_state = 'analyst_estimate' and analyst_estimate is not null and length(trim(estimate_methodology)) >= 20 and estimate_confidence is not null)
    )
);

create table if not exists public.weekly_lunar_tracker_audit (
    id bigint generated always as identity primary key,
    tracker_entry_id uuid not null,
    entity_type text not null check (entity_type in ('entry', 'source', 'value')),
    entity_id text not null,
    action text not null check (action in ('created', 'updated', 'deleted')),
    actor_user_id uuid references auth.users(id) on delete set null,
    before_snapshot jsonb,
    after_snapshot jsonb,
    created_at timestamptz not null default now()
);

create index if not exists weekly_tracker_window_idx on public.weekly_lunar_tracker_entries (week_start_local, scheduled_at, status);
create index if not exists weekly_tracker_review_idx on public.weekly_lunar_tracker_entries (publication_status, last_reviewed_at desc nulls last);
create index if not exists weekly_tracker_primary_source_idx on public.weekly_lunar_tracker_entries (primary_source_id) where primary_source_id is not null;
create index if not exists weekly_tracker_sources_entry_idx on public.weekly_lunar_tracker_sources (tracker_entry_id);
create index if not exists weekly_tracker_sources_registry_idx on public.weekly_lunar_tracker_sources (source_registry_id);
create index if not exists weekly_tracker_values_source_idx on public.weekly_lunar_tracker_values (source_registry_id) where source_registry_id is not null;
create index if not exists weekly_tracker_audit_entry_idx on public.weekly_lunar_tracker_audit (tracker_entry_id, created_at desc);

create trigger set_weekly_lunar_tracker_entries_updated_at before update on public.weekly_lunar_tracker_entries
for each row execute function public.set_updated_at();
create trigger set_weekly_lunar_tracker_values_updated_at before update on public.weekly_lunar_tracker_values
for each row execute function public.set_updated_at();

create or replace function public.audit_weekly_lunar_tracker_change()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_entry_id uuid; v_entity_type text; v_entity_id text;
begin
    v_entity_type := case tg_table_name when 'weekly_lunar_tracker_entries' then 'entry' when 'weekly_lunar_tracker_sources' then 'source' else 'value' end;
    v_entry_id := case when tg_table_name = 'weekly_lunar_tracker_entries' then coalesce(new.id, old.id) else coalesce(new.tracker_entry_id, old.tracker_entry_id) end;
    v_entity_id := coalesce(new.id, old.id)::text;
    insert into public.weekly_lunar_tracker_audit (tracker_entry_id, entity_type, entity_id, action, actor_user_id, before_snapshot, after_snapshot)
    values (v_entry_id, v_entity_type, v_entity_id, case tg_op when 'INSERT' then 'created' when 'UPDATE' then 'updated' else 'deleted' end,
        auth.uid(), case when tg_op = 'INSERT' then null else to_jsonb(old) end, case when tg_op = 'DELETE' then null else to_jsonb(new) end);
    if tg_op = 'DELETE' then return old; end if;
    return new;
end; $$;

create trigger audit_weekly_tracker_entries after insert or update or delete on public.weekly_lunar_tracker_entries
for each row execute function public.audit_weekly_lunar_tracker_change();
create trigger audit_weekly_tracker_sources after insert or update or delete on public.weekly_lunar_tracker_sources
for each row execute function public.audit_weekly_lunar_tracker_change();
create trigger audit_weekly_tracker_values after insert or update or delete on public.weekly_lunar_tracker_values
for each row execute function public.audit_weekly_lunar_tracker_change();

create or replace function app_private.can_read_tracker_tier(required_tier text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
    select private.has_verified_complete_profile() and case required_tier
        when 'public' then true
        when 'member' then app_private.has_any_role(array['member','scout','command_user','editor','analyst','admin'])
        when 'scout' then app_private.has_any_role(array['scout','command_user','editor','analyst','admin'])
        when 'command' then app_private.has_any_role(array['command_user','editor','analyst','admin'])
        else false end;
$$;
grant execute on function app_private.can_read_tracker_tier(text) to authenticated;

alter table public.weekly_lunar_tracker_entries enable row level security;
alter table public.weekly_lunar_tracker_sources enable row level security;
alter table public.weekly_lunar_tracker_values enable row level security;
alter table public.weekly_lunar_tracker_audit enable row level security;

create policy "Public reads published lunar tracker entries" on public.weekly_lunar_tracker_entries for select to anon
using (publication_status = 'published' and visibility = 'public' and is_lunar_or_cislunar);
create policy "Members read entitled lunar tracker entries" on public.weekly_lunar_tracker_entries for select to authenticated
using (publication_status = 'published' and is_lunar_or_cislunar and app_private.can_read_tracker_tier(visibility));
create policy "Staff manage lunar tracker entries" on public.weekly_lunar_tracker_entries for all to authenticated
using (app_private.has_any_role(array['editor','analyst','admin'])) with check (app_private.has_any_role(array['editor','analyst','admin']));

create policy "Public reads citations for public tracker entries" on public.weekly_lunar_tracker_sources for select to anon
using (exists (select 1 from public.weekly_lunar_tracker_entries e where e.id = tracker_entry_id and e.publication_status = 'published' and e.visibility = 'public' and e.is_lunar_or_cislunar));
create policy "Members read citations for entitled tracker entries" on public.weekly_lunar_tracker_sources for select to authenticated
using (exists (select 1 from public.weekly_lunar_tracker_entries e where e.id = tracker_entry_id and e.publication_status = 'published' and e.is_lunar_or_cislunar and app_private.can_read_tracker_tier(e.visibility)));
create policy "Staff manage lunar tracker sources" on public.weekly_lunar_tracker_sources for all to authenticated
using (app_private.has_any_role(array['editor','analyst','admin'])) with check (app_private.has_any_role(array['editor','analyst','admin']));

create policy "Public reads public tracker values" on public.weekly_lunar_tracker_values for select to anon
using (value_visibility = 'public' and exists (select 1 from public.weekly_lunar_tracker_entries e where e.id = tracker_entry_id and e.publication_status = 'published' and e.visibility = 'public' and e.is_lunar_or_cislunar));
create policy "Members read entitled tracker values" on public.weekly_lunar_tracker_values for select to authenticated
using (app_private.can_read_tracker_tier(value_visibility) and exists (select 1 from public.weekly_lunar_tracker_entries e where e.id = tracker_entry_id and e.publication_status = 'published' and app_private.can_read_tracker_tier(e.visibility)));
create policy "Staff manage lunar tracker values" on public.weekly_lunar_tracker_values for all to authenticated
using (app_private.has_any_role(array['editor','analyst','admin'])) with check (app_private.has_any_role(array['editor','analyst','admin']));
create policy "Staff reads lunar tracker audit" on public.weekly_lunar_tracker_audit for select to authenticated
using (app_private.has_any_role(array['editor','analyst','admin']));

grant select on public.weekly_lunar_tracker_entries, public.weekly_lunar_tracker_sources, public.weekly_lunar_tracker_values to anon, authenticated;
grant insert, update, delete on public.weekly_lunar_tracker_entries, public.weekly_lunar_tracker_sources, public.weekly_lunar_tracker_values to authenticated;
grant select on public.weekly_lunar_tracker_audit to authenticated;
grant all on public.weekly_lunar_tracker_entries, public.weekly_lunar_tracker_sources, public.weekly_lunar_tracker_values, public.weekly_lunar_tracker_audit to service_role;
revoke all on function public.audit_weekly_lunar_tracker_change() from public, anon, authenticated;
