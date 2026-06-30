do $$
begin
    create type public.lunar_tracking_publication_status as enum (
        'draft',
        'published',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_tracking_visibility_tier as enum (
        'public',
        'explorer',
        'scout',
        'command'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_mission_phase as enum (
        'concept',
        'funded',
        'development',
        'integration',
        'launch_window',
        'launched',
        'transit',
        'lunar_orbit',
        'descent',
        'surface_operations',
        'extended_operations',
        'complete'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_mission_status as enum (
        'planned',
        'active',
        'delayed',
        'successful',
        'partial_success',
        'failed',
        'cancelled',
        'unknown'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_object_type as enum (
        'launch',
        'spacecraft',
        'lander',
        'rover',
        'payload',
        'instrument',
        'lunar_satellite'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_tracking_confidence_label as enum (
        'experimental',
        'low',
        'medium',
        'high'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_tracking_source_review_status as enum (
        'queued',
        'needs_review',
        'approved',
        'rejected',
        'expired'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.lunar_operators (
    id uuid primary key default gen_random_uuid(),
    slug text not null,
    name text not null,
    operator_type text not null default 'organization',
    country_code text,
    website_url text,
    summary text not null default '',
    publication_status public.lunar_tracking_publication_status not null
        default 'draft',
    visibility_tier public.lunar_tracking_visibility_tier not null
        default 'public',
    is_public boolean not null default false,
    freshness_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_operators_slug_not_blank check (length(trim(slug)) > 0),
    constraint lunar_operators_name_not_blank check (length(trim(name)) > 0),
    constraint lunar_operators_type_not_blank check (
        length(trim(operator_type)) > 0
    ),
    constraint lunar_operators_country_format check (
        country_code is null
        or country_code ~ '^[A-Z]{2}$'
    ),
    constraint lunar_operators_website_url_format check (
        website_url is null
        or website_url ~* '^https?://'
    )
);

create unique index if not exists lunar_operators_slug_key
on public.lunar_operators (lower(slug));

create index if not exists lunar_operators_public_idx
on public.lunar_operators (publication_status, visibility_tier, is_public, name);

drop trigger if exists set_lunar_operators_updated_at
on public.lunar_operators;
create trigger set_lunar_operators_updated_at
before update on public.lunar_operators
for each row execute function public.set_updated_at();

create table if not exists public.lunar_missions (
    id uuid primary key default gen_random_uuid(),
    slug text not null,
    mission_name text not null,
    program_name text,
    summary text not null default '',
    primary_operator_id uuid references public.lunar_operators(id)
        on delete set null,
    current_phase public.lunar_mission_phase not null default 'concept',
    current_status public.lunar_mission_status not null default 'planned',
    target_body text not null default 'Moon',
    mission_objectives text,
    publication_status public.lunar_tracking_publication_status not null
        default 'draft',
    visibility_tier public.lunar_tracking_visibility_tier not null
        default 'public',
    confidence_label public.lunar_tracking_confidence_label not null
        default 'experimental',
    quality_score numeric(5, 2) not null default 0,
    freshness_at timestamptz,
    last_source_at timestamptz,
    analyst_reviewed_at timestamptz,
    analyst_reviewed_by uuid references auth.users(id) on delete set null,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_missions_slug_not_blank check (length(trim(slug)) > 0),
    constraint lunar_missions_name_not_blank check (
        length(trim(mission_name)) > 0
    ),
    constraint lunar_missions_target_not_blank check (
        length(trim(target_body)) > 0
    ),
    constraint lunar_missions_quality_score check (quality_score between 0 and 100)
);

create unique index if not exists lunar_missions_slug_key
on public.lunar_missions (lower(slug));

create index if not exists lunar_missions_public_idx
on public.lunar_missions (
    publication_status,
    visibility_tier,
    current_phase,
    current_status,
    freshness_at desc nulls last
);

create index if not exists lunar_missions_operator_idx
on public.lunar_missions (primary_operator_id, current_status)
where primary_operator_id is not null;

drop trigger if exists set_lunar_missions_updated_at
on public.lunar_missions;
create trigger set_lunar_missions_updated_at
before update on public.lunar_missions
for each row execute function public.set_updated_at();

create table if not exists public.lunar_mission_objects (
    id uuid primary key default gen_random_uuid(),
    mission_id uuid not null references public.lunar_missions(id)
        on delete cascade,
    parent_object_id uuid references public.lunar_mission_objects(id)
        on delete set null,
    operator_id uuid references public.lunar_operators(id) on delete set null,
    slug text not null,
    object_name text not null,
    object_type public.lunar_object_type not null,
    current_phase public.lunar_mission_phase not null default 'concept',
    current_status public.lunar_mission_status not null default 'planned',
    spacecraft_bus text,
    launch_vehicle text,
    cospar_id text,
    norad_id integer,
    mass_kg numeric(12, 3),
    destination text not null default 'Moon',
    orbit_name text,
    description text not null default '',
    publication_status public.lunar_tracking_publication_status not null
        default 'draft',
    visibility_tier public.lunar_tracking_visibility_tier not null
        default 'public',
    confidence_label public.lunar_tracking_confidence_label not null
        default 'experimental',
    freshness_at timestamptz,
    last_source_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_mission_objects_slug_not_blank check (
        length(trim(slug)) > 0
    ),
    constraint lunar_mission_objects_name_not_blank check (
        length(trim(object_name)) > 0
    ),
    constraint lunar_mission_objects_destination_not_blank check (
        length(trim(destination)) > 0
    ),
    constraint lunar_mission_objects_mass_nonnegative check (
        mass_kg is null
        or mass_kg >= 0
    )
);

create unique index if not exists lunar_mission_objects_slug_key
on public.lunar_mission_objects (mission_id, lower(slug));

create index if not exists lunar_mission_objects_type_status_idx
on public.lunar_mission_objects (
    object_type,
    current_status,
    current_phase,
    freshness_at desc nulls last
);

create index if not exists lunar_mission_objects_operator_idx
on public.lunar_mission_objects (operator_id, object_type)
where operator_id is not null;

drop trigger if exists set_lunar_mission_objects_updated_at
on public.lunar_mission_objects;
create trigger set_lunar_mission_objects_updated_at
before update on public.lunar_mission_objects
for each row execute function public.set_updated_at();

create table if not exists public.lunar_launch_windows (
    id uuid primary key default gen_random_uuid(),
    mission_id uuid not null references public.lunar_missions(id)
        on delete cascade,
    object_id uuid references public.lunar_mission_objects(id)
        on delete cascade,
    launch_operator_id uuid references public.lunar_operators(id)
        on delete set null,
    launch_vehicle text,
    launch_site text,
    window_open_at timestamptz,
    window_close_at timestamptz,
    target_launch_at timestamptz,
    actual_launch_at timestamptz,
    launch_status public.lunar_mission_status not null default 'planned',
    source_note text,
    publication_status public.lunar_tracking_publication_status not null
        default 'draft',
    visibility_tier public.lunar_tracking_visibility_tier not null
        default 'public',
    confidence_label public.lunar_tracking_confidence_label not null
        default 'experimental',
    freshness_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_launch_windows_window_order check (
        window_open_at is null
        or window_close_at is null
        or window_close_at >= window_open_at
    )
);

create index if not exists lunar_launch_windows_time_status_idx
on public.lunar_launch_windows (
    launch_status,
    target_launch_at asc nulls last,
    window_open_at asc nulls last
);

create index if not exists lunar_launch_windows_mission_idx
on public.lunar_launch_windows (mission_id, target_launch_at desc nulls last);

drop trigger if exists set_lunar_launch_windows_updated_at
on public.lunar_launch_windows;
create trigger set_lunar_launch_windows_updated_at
before update on public.lunar_launch_windows
for each row execute function public.set_updated_at();

create table if not exists public.lunar_landing_sites (
    id uuid primary key default gen_random_uuid(),
    mission_id uuid not null references public.lunar_missions(id)
        on delete cascade,
    object_id uuid references public.lunar_mission_objects(id)
        on delete cascade,
    site_name text not null,
    lunar_region text,
    latitude_deg numeric(9, 6),
    longitude_deg numeric(9, 6),
    site_radius_km numeric(12, 3),
    target_landing_at timestamptz,
    actual_landing_at timestamptz,
    landing_status public.lunar_mission_status not null default 'planned',
    geospatial_note text,
    publication_status public.lunar_tracking_publication_status not null
        default 'draft',
    visibility_tier public.lunar_tracking_visibility_tier not null
        default 'public',
    confidence_label public.lunar_tracking_confidence_label not null
        default 'experimental',
    freshness_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_landing_sites_name_not_blank check (
        length(trim(site_name)) > 0
    ),
    constraint lunar_landing_sites_latitude_range check (
        latitude_deg is null
        or latitude_deg between -90 and 90
    ),
    constraint lunar_landing_sites_longitude_range check (
        longitude_deg is null
        or longitude_deg between -180 and 180
    ),
    constraint lunar_landing_sites_radius_nonnegative check (
        site_radius_km is null
        or site_radius_km >= 0
    )
);

create index if not exists lunar_landing_sites_mission_idx
on public.lunar_landing_sites (mission_id, landing_status, target_landing_at);

create index if not exists lunar_landing_sites_geo_idx
on public.lunar_landing_sites (latitude_deg, longitude_deg)
where latitude_deg is not null and longitude_deg is not null;

drop trigger if exists set_lunar_landing_sites_updated_at
on public.lunar_landing_sites;
create trigger set_lunar_landing_sites_updated_at
before update on public.lunar_landing_sites
for each row execute function public.set_updated_at();

create table if not exists public.lunar_payloads (
    id uuid primary key default gen_random_uuid(),
    mission_id uuid not null references public.lunar_missions(id)
        on delete cascade,
    parent_object_id uuid references public.lunar_mission_objects(id)
        on delete set null,
    operator_id uuid references public.lunar_operators(id) on delete set null,
    payload_name text not null,
    payload_type public.lunar_object_type not null default 'payload',
    instrument_category text,
    science_objective text,
    mass_kg numeric(12, 3),
    power_watts numeric(12, 3),
    payload_status public.lunar_mission_status not null default 'planned',
    publication_status public.lunar_tracking_publication_status not null
        default 'draft',
    visibility_tier public.lunar_tracking_visibility_tier not null
        default 'public',
    confidence_label public.lunar_tracking_confidence_label not null
        default 'experimental',
    freshness_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_payloads_name_not_blank check (
        length(trim(payload_name)) > 0
    ),
    constraint lunar_payloads_type_payload_or_instrument check (
        payload_type in ('payload', 'instrument')
    ),
    constraint lunar_payloads_mass_nonnegative check (
        mass_kg is null
        or mass_kg >= 0
    ),
    constraint lunar_payloads_power_nonnegative check (
        power_watts is null
        or power_watts >= 0
    )
);

create index if not exists lunar_payloads_mission_type_idx
on public.lunar_payloads (mission_id, payload_type, payload_status);

create index if not exists lunar_payloads_operator_idx
on public.lunar_payloads (operator_id, payload_status)
where operator_id is not null;

drop trigger if exists set_lunar_payloads_updated_at
on public.lunar_payloads;
create trigger set_lunar_payloads_updated_at
before update on public.lunar_payloads
for each row execute function public.set_updated_at();

create table if not exists public.lunar_mission_status_events (
    id uuid primary key default gen_random_uuid(),
    mission_id uuid not null references public.lunar_missions(id)
        on delete cascade,
    object_id uuid references public.lunar_mission_objects(id)
        on delete cascade,
    from_phase public.lunar_mission_phase,
    to_phase public.lunar_mission_phase,
    from_status public.lunar_mission_status,
    to_status public.lunar_mission_status not null,
    event_at timestamptz not null default now(),
    event_summary text not null,
    source_note text,
    actor_user_id uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    constraint lunar_mission_status_events_summary_not_blank check (
        length(trim(event_summary)) > 0
    )
);

create index if not exists lunar_mission_status_events_mission_idx
on public.lunar_mission_status_events (mission_id, event_at desc);

create index if not exists lunar_mission_status_events_object_idx
on public.lunar_mission_status_events (object_id, event_at desc)
where object_id is not null;

create table if not exists public.lunar_mission_source_citations (
    id uuid primary key default gen_random_uuid(),
    mission_id uuid references public.lunar_missions(id) on delete cascade,
    object_id uuid references public.lunar_mission_objects(id) on delete cascade,
    launch_window_id uuid references public.lunar_launch_windows(id)
        on delete cascade,
    landing_site_id uuid references public.lunar_landing_sites(id)
        on delete cascade,
    payload_id uuid references public.lunar_payloads(id) on delete cascade,
    source_name text not null,
    title text not null,
    url text,
    publisher text,
    published_at date,
    retrieved_at timestamptz,
    citation_text text,
    summary text,
    supports_fields text[] not null default '{}'::text[],
    license_notes text,
    review_status public.lunar_tracking_source_review_status not null
        default 'queued',
    confidence_label public.lunar_tracking_confidence_label not null
        default 'experimental',
    display_order integer not null default 100,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_mission_source_citations_target check (
        mission_id is not null
        or object_id is not null
        or launch_window_id is not null
        or landing_site_id is not null
        or payload_id is not null
    ),
    constraint lunar_mission_source_citations_source_not_blank check (
        length(trim(source_name)) > 0
    ),
    constraint lunar_mission_source_citations_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint lunar_mission_source_citations_url_format check (
        url is null
        or url ~* '^https?://'
    ),
    constraint lunar_mission_source_citations_display_order check (
        display_order >= 0
    )
);

create index if not exists lunar_mission_source_citations_mission_idx
on public.lunar_mission_source_citations (mission_id, display_order)
where mission_id is not null;

create index if not exists lunar_mission_source_citations_object_idx
on public.lunar_mission_source_citations (object_id, display_order)
where object_id is not null;

create index if not exists lunar_mission_source_citations_review_idx
on public.lunar_mission_source_citations (review_status, retrieved_at desc);

drop trigger if exists set_lunar_mission_source_citations_updated_at
on public.lunar_mission_source_citations;
create trigger set_lunar_mission_source_citations_updated_at
before update on public.lunar_mission_source_citations
for each row execute function public.set_updated_at();

create or replace function app_private.can_access_lunar_tracking_tier(
    required_tier text default 'explorer'
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select case required_tier
        when 'public' then true
        when 'explorer' then app_private.has_any_role(
            array['member', 'scout', 'command_user', 'editor', 'analyst', 'admin']
        )
        when 'scout' then app_private.has_any_role(
            array['scout', 'command_user', 'editor', 'analyst', 'admin']
        )
        when 'command' then app_private.has_any_role(
            array['command_user', 'editor', 'analyst', 'admin']
        )
        else app_private.has_any_role(array['editor', 'analyst', 'admin'])
    end;
$$;

grant execute on function app_private.can_access_lunar_tracking_tier(text)
to authenticated;

alter table public.lunar_operators enable row level security;
alter table public.lunar_missions enable row level security;
alter table public.lunar_mission_objects enable row level security;
alter table public.lunar_launch_windows enable row level security;
alter table public.lunar_landing_sites enable row level security;
alter table public.lunar_payloads enable row level security;
alter table public.lunar_mission_status_events enable row level security;
alter table public.lunar_mission_source_citations enable row level security;

grant select (
    id,
    slug,
    name,
    operator_type,
    country_code,
    website_url,
    summary,
    publication_status,
    visibility_tier,
    is_public,
    freshness_at,
    updated_at
) on public.lunar_operators to anon, authenticated;

grant select (
    id,
    slug,
    mission_name,
    program_name,
    summary,
    primary_operator_id,
    current_phase,
    current_status,
    target_body,
    mission_objectives,
    publication_status,
    visibility_tier,
    confidence_label,
    quality_score,
    freshness_at,
    last_source_at,
    analyst_reviewed_at,
    updated_at
) on public.lunar_missions to anon, authenticated;

grant select (
    id,
    mission_id,
    parent_object_id,
    operator_id,
    slug,
    object_name,
    object_type,
    current_phase,
    current_status,
    spacecraft_bus,
    launch_vehicle,
    cospar_id,
    norad_id,
    mass_kg,
    destination,
    orbit_name,
    description,
    publication_status,
    visibility_tier,
    confidence_label,
    freshness_at,
    last_source_at,
    updated_at
) on public.lunar_mission_objects to anon, authenticated;

grant select (
    id,
    mission_id,
    object_id,
    launch_operator_id,
    launch_vehicle,
    launch_site,
    window_open_at,
    window_close_at,
    target_launch_at,
    actual_launch_at,
    launch_status,
    source_note,
    publication_status,
    visibility_tier,
    confidence_label,
    freshness_at,
    updated_at
) on public.lunar_launch_windows to anon, authenticated;

grant select (
    id,
    mission_id,
    object_id,
    site_name,
    lunar_region,
    latitude_deg,
    longitude_deg,
    site_radius_km,
    target_landing_at,
    actual_landing_at,
    landing_status,
    geospatial_note,
    publication_status,
    visibility_tier,
    confidence_label,
    freshness_at,
    updated_at
) on public.lunar_landing_sites to anon, authenticated;

grant select (
    id,
    mission_id,
    parent_object_id,
    operator_id,
    payload_name,
    payload_type,
    instrument_category,
    science_objective,
    mass_kg,
    power_watts,
    payload_status,
    publication_status,
    visibility_tier,
    confidence_label,
    freshness_at,
    updated_at
) on public.lunar_payloads to anon, authenticated;

grant select (
    id,
    mission_id,
    object_id,
    from_phase,
    to_phase,
    from_status,
    to_status,
    event_at,
    event_summary,
    source_note,
    created_at
) on public.lunar_mission_status_events to authenticated;

grant select (
    id,
    mission_id,
    object_id,
    launch_window_id,
    landing_site_id,
    payload_id,
    source_name,
    title,
    url,
    publisher,
    published_at,
    retrieved_at,
    citation_text,
    summary,
    supports_fields,
    license_notes,
    review_status,
    confidence_label,
    display_order,
    updated_at
) on public.lunar_mission_source_citations to anon, authenticated;

grant insert, update, delete on
    public.lunar_operators,
    public.lunar_missions,
    public.lunar_mission_objects,
    public.lunar_launch_windows,
    public.lunar_landing_sites,
    public.lunar_payloads,
    public.lunar_mission_status_events,
    public.lunar_mission_source_citations
to authenticated;

grant all on
    public.lunar_operators,
    public.lunar_missions,
    public.lunar_mission_objects,
    public.lunar_launch_windows,
    public.lunar_landing_sites,
    public.lunar_payloads,
    public.lunar_mission_status_events,
    public.lunar_mission_source_citations
to service_role;

create policy "lunar_operators_select_public"
on public.lunar_operators
for select
to anon, authenticated
using (
    publication_status = 'published'
    and is_public
    and visibility_tier = 'public'
);

create policy "lunar_operators_select_members"
on public.lunar_operators
for select
to authenticated
using (
    publication_status = 'published'
    and app_private.can_access_lunar_tracking_tier(visibility_tier::text)
);

create policy "lunar_operators_manage_staff"
on public.lunar_operators
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

create policy "lunar_missions_select_public"
on public.lunar_missions
for select
to anon, authenticated
using (
    publication_status = 'published'
    and visibility_tier = 'public'
);

create policy "lunar_missions_select_members"
on public.lunar_missions
for select
to authenticated
using (
    publication_status = 'published'
    and app_private.can_access_lunar_tracking_tier(visibility_tier::text)
);

create policy "lunar_missions_manage_staff"
on public.lunar_missions
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

create policy "lunar_mission_objects_select_public"
on public.lunar_mission_objects
for select
to anon, authenticated
using (
    publication_status = 'published'
    and visibility_tier = 'public'
    and exists (
        select 1
        from public.lunar_missions mission
        where mission.id = lunar_mission_objects.mission_id
            and mission.publication_status = 'published'
            and mission.visibility_tier = 'public'
    )
);

create policy "lunar_mission_objects_select_members"
on public.lunar_mission_objects
for select
to authenticated
using (
    publication_status = 'published'
    and app_private.can_access_lunar_tracking_tier(visibility_tier::text)
    and exists (
        select 1
        from public.lunar_missions mission
        where mission.id = lunar_mission_objects.mission_id
            and mission.publication_status = 'published'
            and app_private.can_access_lunar_tracking_tier(
                mission.visibility_tier::text
            )
    )
);

create policy "lunar_mission_objects_manage_staff"
on public.lunar_mission_objects
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

create policy "lunar_launch_windows_select_public"
on public.lunar_launch_windows
for select
to anon, authenticated
using (
    publication_status = 'published'
    and visibility_tier = 'public'
    and exists (
        select 1
        from public.lunar_missions mission
        where mission.id = lunar_launch_windows.mission_id
            and mission.publication_status = 'published'
            and mission.visibility_tier = 'public'
    )
);

create policy "lunar_launch_windows_select_members"
on public.lunar_launch_windows
for select
to authenticated
using (
    publication_status = 'published'
    and app_private.can_access_lunar_tracking_tier(visibility_tier::text)
);

create policy "lunar_launch_windows_manage_staff"
on public.lunar_launch_windows
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

create policy "lunar_landing_sites_select_public"
on public.lunar_landing_sites
for select
to anon, authenticated
using (
    publication_status = 'published'
    and visibility_tier = 'public'
    and exists (
        select 1
        from public.lunar_missions mission
        where mission.id = lunar_landing_sites.mission_id
            and mission.publication_status = 'published'
            and mission.visibility_tier = 'public'
    )
);

create policy "lunar_landing_sites_select_members"
on public.lunar_landing_sites
for select
to authenticated
using (
    publication_status = 'published'
    and app_private.can_access_lunar_tracking_tier(visibility_tier::text)
);

create policy "lunar_landing_sites_manage_staff"
on public.lunar_landing_sites
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

create policy "lunar_payloads_select_public"
on public.lunar_payloads
for select
to anon, authenticated
using (
    publication_status = 'published'
    and visibility_tier = 'public'
    and exists (
        select 1
        from public.lunar_missions mission
        where mission.id = lunar_payloads.mission_id
            and mission.publication_status = 'published'
            and mission.visibility_tier = 'public'
    )
);

create policy "lunar_payloads_select_members"
on public.lunar_payloads
for select
to authenticated
using (
    publication_status = 'published'
    and app_private.can_access_lunar_tracking_tier(visibility_tier::text)
);

create policy "lunar_payloads_manage_staff"
on public.lunar_payloads
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

create policy "lunar_mission_status_events_select_members"
on public.lunar_mission_status_events
for select
to authenticated
using (
    exists (
        select 1
        from public.lunar_missions mission
        where mission.id = lunar_mission_status_events.mission_id
            and mission.publication_status = 'published'
            and app_private.can_access_lunar_tracking_tier(
                mission.visibility_tier::text
            )
    )
    or app_private.has_any_role(array['editor', 'analyst', 'admin'])
);

create policy "lunar_mission_status_events_manage_staff"
on public.lunar_mission_status_events
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

create policy "lunar_mission_source_citations_select_public"
on public.lunar_mission_source_citations
for select
to anon, authenticated
using (
    review_status = 'approved'
    and (
        exists (
            select 1
            from public.lunar_missions mission
            where mission.id = lunar_mission_source_citations.mission_id
                and mission.publication_status = 'published'
                and mission.visibility_tier = 'public'
        )
        or exists (
            select 1
            from public.lunar_mission_objects mission_object
            join public.lunar_missions mission
                on mission.id = mission_object.mission_id
            where mission_object.id =
                lunar_mission_source_citations.object_id
                and mission_object.publication_status = 'published'
                and mission_object.visibility_tier = 'public'
                and mission.publication_status = 'published'
                and mission.visibility_tier = 'public'
        )
    )
);

create policy "lunar_mission_source_citations_select_members"
on public.lunar_mission_source_citations
for select
to authenticated
using (
    review_status = 'approved'
    and (
        app_private.has_any_role(array['editor', 'analyst', 'admin'])
        or exists (
            select 1
            from public.lunar_missions mission
            where mission.id = lunar_mission_source_citations.mission_id
                and mission.publication_status = 'published'
                and app_private.can_access_lunar_tracking_tier(
                    mission.visibility_tier::text
                )
        )
        or exists (
            select 1
            from public.lunar_mission_objects mission_object
            where mission_object.id =
                lunar_mission_source_citations.object_id
                and mission_object.publication_status = 'published'
                and app_private.can_access_lunar_tracking_tier(
                    mission_object.visibility_tier::text
                )
        )
    )
);

create policy "lunar_mission_source_citations_manage_staff"
on public.lunar_mission_source_citations
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));
