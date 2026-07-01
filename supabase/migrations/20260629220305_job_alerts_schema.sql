do $$
begin
    create type public.job_alert_employer_kind as enum (
        'nasa',
        'large_space_company',
        'launch_provider',
        'prime_contractor',
        'government',
        'lunar_company'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.job_alert_freshness_status as enum (
        'fresh',
        'watching',
        'stale',
        'closed'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.job_alert_publication_status as enum (
        'draft',
        'published',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.space_sector_job_alerts (
    id uuid primary key default gen_random_uuid(),
    alert_key text not null unique,
    employer_name text not null,
    employer_kind public.job_alert_employer_kind not null,
    role_title text not null,
    role_family text,
    location_name text not null,
    work_mode text,
    source_name text not null,
    source_url text not null,
    posting_date date not null,
    source_retrieved_at timestamptz not null,
    source_last_seen_at timestamptz,
    freshness_status public.job_alert_freshness_status not null default 'watching',
    freshness_note text,
    access_tier_required public.membership_tier not null default 'member',
    publication_status public.job_alert_publication_status not null default 'draft',
    published_at timestamptz,
    display_order integer not null default 100,
    metadata jsonb not null default '{}'::jsonb,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint space_sector_job_alerts_key_not_blank check (
        length(trim(alert_key)) > 0
    ),
    constraint space_sector_job_alerts_employer_not_blank check (
        length(trim(employer_name)) > 0
    ),
    constraint space_sector_job_alerts_role_not_blank check (
        length(trim(role_title)) > 0
    ),
    constraint space_sector_job_alerts_location_not_blank check (
        length(trim(location_name)) > 0
    ),
    constraint space_sector_job_alerts_source_name_not_blank check (
        length(trim(source_name)) > 0
    ),
    constraint space_sector_job_alerts_source_url_format check (
        source_url ~* '^https?://'
    ),
    constraint space_sector_job_alerts_last_seen_after_retrieved check (
        source_last_seen_at is null
        or source_last_seen_at >= source_retrieved_at
    ),
    constraint space_sector_job_alerts_published_at_required check (
        publication_status <> 'published'
        or published_at is not null
    ),
    constraint space_sector_job_alerts_display_order_nonnegative check (
        display_order >= 0
    ),
    constraint space_sector_job_alerts_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create index if not exists space_sector_job_alerts_dashboard_idx
on public.space_sector_job_alerts (
    publication_status,
    freshness_status,
    display_order,
    posting_date desc
);

create index if not exists space_sector_job_alerts_employer_idx
on public.space_sector_job_alerts (
    employer_kind,
    employer_name,
    posting_date desc
);

drop trigger if exists set_space_sector_job_alerts_updated_at
on public.space_sector_job_alerts;
create trigger set_space_sector_job_alerts_updated_at
before update on public.space_sector_job_alerts
for each row execute function public.set_updated_at();

alter table public.space_sector_job_alerts enable row level security;

grant select on public.space_sector_job_alerts to authenticated;
grant insert, update, delete on public.space_sector_job_alerts to authenticated;
grant all on public.space_sector_job_alerts to service_role;

drop policy if exists "space_sector_job_alerts_select_published_members"
on public.space_sector_job_alerts;
create policy "space_sector_job_alerts_select_published_members"
on public.space_sector_job_alerts
for select
to authenticated
using (
    publication_status = 'published'
    and published_at is not null
    and published_at <= now()
    and freshness_status <> 'closed'
);

drop policy if exists "space_sector_job_alerts_select_staff"
on public.space_sector_job_alerts;
create policy "space_sector_job_alerts_select_staff"
on public.space_sector_job_alerts
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "space_sector_job_alerts_manage_staff"
on public.space_sector_job_alerts;
create policy "space_sector_job_alerts_manage_staff"
on public.space_sector_job_alerts
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

insert into public.space_sector_job_alerts (
    alert_key,
    employer_name,
    employer_kind,
    role_title,
    role_family,
    location_name,
    work_mode,
    source_name,
    source_url,
    posting_date,
    source_retrieved_at,
    source_last_seen_at,
    freshness_status,
    freshness_note,
    access_tier_required,
    publication_status,
    published_at,
    display_order,
    metadata
)
values
    (
        'nasa-usajobs-artemis-systems-engineering-watch',
        'NASA',
        'nasa',
        'Artemis systems engineering roles',
        'Systems engineering',
        'NASA centers / USAJOBS',
        'Varies by posting',
        'NASA Careers / USAJOBS',
        'https://www.nasa.gov/careers/',
        '2026-06-29',
        '2026-06-29 22:00:00+00',
        '2026-06-29 22:00:00+00',
        'fresh',
        'Watch NASA career listings and USAJOBS searches for Artemis, lunar surface, avionics, power, and mission systems roles.',
        'member',
        'published',
        '2026-06-29 22:00:00+00',
        10,
        '{"seed":"task_040","source_scope":"official careers landing page"}'::jsonb
    ),
    (
        'spacex-starship-lunar-systems-watch',
        'SpaceX',
        'launch_provider',
        'Starship and lunar systems roles',
        'Launch systems',
        'Hawthorne, CA; Starbase, TX; Cape Canaveral, FL',
        'On-site',
        'SpaceX Careers',
        'https://www.spacex.com/careers/jobs',
        '2026-06-29',
        '2026-06-29 22:00:00+00',
        '2026-06-29 22:00:00+00',
        'fresh',
        'Monitor SpaceX openings tied to Starship, launch operations, avionics, propulsion, payload integration, and lunar transport programs.',
        'member',
        'published',
        '2026-06-29 22:00:00+00',
        20,
        '{"seed":"task_040","source_scope":"official careers search"}'::jsonb
    ),
    (
        'blue-origin-lunar-systems-watch',
        'Blue Origin',
        'large_space_company',
        'Lunar systems, engines, and mission operations roles',
        'Lunar systems',
        'Kent, WA; Huntsville, AL; Space Coast, FL; Denver, CO',
        'Varies by posting',
        'Blue Origin Careers',
        'https://www.blueorigin.com/careers/search',
        '2026-06-29',
        '2026-06-29 22:00:00+00',
        '2026-06-29 22:00:00+00',
        'fresh',
        'Track openings across lunar transportation, Blue Moon-adjacent systems, propulsion, fluids, thermal, software, and mission operations.',
        'member',
        'published',
        '2026-06-29 22:00:00+00',
        30,
        '{"seed":"task_040","source_scope":"official careers search"}'::jsonb
    ),
    (
        'lockheed-martin-space-lunar-architecture-watch',
        'Lockheed Martin Space',
        'prime_contractor',
        'Space systems and lunar architecture roles',
        'Space systems',
        'Denver, CO; Sunnyvale, CA; Huntsville, AL; Cape Canaveral, FL',
        'Varies by posting',
        'Lockheed Martin Space Careers',
        'https://www.lockheedmartinjobs.com/space-careers',
        '2026-06-29',
        '2026-06-29 22:00:00+00',
        '2026-06-29 22:00:00+00',
        'fresh',
        'Watch Lockheed Martin Space roles related to spacecraft, mission systems, lunar architecture, avionics, software, and mission assurance.',
        'member',
        'published',
        '2026-06-29 22:00:00+00',
        40,
        '{"seed":"task_040","source_scope":"official careers search"}'::jsonb
    )
on conflict (alert_key) do update set
    employer_name = excluded.employer_name,
    employer_kind = excluded.employer_kind,
    role_title = excluded.role_title,
    role_family = excluded.role_family,
    location_name = excluded.location_name,
    work_mode = excluded.work_mode,
    source_name = excluded.source_name,
    source_url = excluded.source_url,
    posting_date = excluded.posting_date,
    source_retrieved_at = excluded.source_retrieved_at,
    source_last_seen_at = excluded.source_last_seen_at,
    freshness_status = excluded.freshness_status,
    freshness_note = excluded.freshness_note,
    access_tier_required = excluded.access_tier_required,
    publication_status = excluded.publication_status,
    published_at = excluded.published_at,
    display_order = excluded.display_order,
    metadata = excluded.metadata,
    updated_at = now();
