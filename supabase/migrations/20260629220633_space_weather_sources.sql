do $$
begin
    create type public.space_weather_freshness_status as enum (
        'current',
        'watching',
        'stale',
        'unavailable'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.space_weather_publication_status as enum (
        'draft',
        'published',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.space_weather_source_snapshots (
    id uuid primary key default gen_random_uuid(),
    source_key text not null unique,
    source_name text not null,
    source_agency text not null,
    source_product text not null,
    source_url text not null,
    source_updated_at timestamptz not null,
    source_retrieved_at timestamptz not null,
    stale_after_minutes integer not null default 120,
    freshness_status public.space_weather_freshness_status not null default 'watching',
    status_summary text not null,
    risk_label text not null default 'nominal',
    key_metrics jsonb not null default '{}'::jsonb,
    attribution_text text,
    access_tier_required public.membership_tier not null default 'member',
    publication_status public.space_weather_publication_status not null default 'draft',
    published_at timestamptz,
    display_order integer not null default 100,
    metadata jsonb not null default '{}'::jsonb,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint space_weather_source_snapshots_key_not_blank check (
        length(trim(source_key)) > 0
    ),
    constraint space_weather_source_snapshots_name_not_blank check (
        length(trim(source_name)) > 0
    ),
    constraint space_weather_source_snapshots_agency_not_blank check (
        length(trim(source_agency)) > 0
    ),
    constraint space_weather_source_snapshots_product_not_blank check (
        length(trim(source_product)) > 0
    ),
    constraint space_weather_source_snapshots_url_format check (
        source_url ~* '^https?://'
    ),
    constraint space_weather_source_snapshots_retrieved_after_updated check (
        source_retrieved_at >= source_updated_at
    ),
    constraint space_weather_source_snapshots_stale_after_positive check (
        stale_after_minutes > 0
    ),
    constraint space_weather_source_snapshots_summary_not_blank check (
        length(trim(status_summary)) > 0
    ),
    constraint space_weather_source_snapshots_risk_label check (
        risk_label in ('nominal', 'elevated', 'watch', 'warning', 'unknown')
    ),
    constraint space_weather_source_snapshots_metrics_object check (
        jsonb_typeof(key_metrics) = 'object'
    ),
    constraint space_weather_source_snapshots_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    ),
    constraint space_weather_source_snapshots_published_at_required check (
        publication_status <> 'published'
        or published_at is not null
    ),
    constraint space_weather_source_snapshots_display_order_nonnegative check (
        display_order >= 0
    )
);

create index if not exists space_weather_source_snapshots_dashboard_idx
on public.space_weather_source_snapshots (
    publication_status,
    freshness_status,
    display_order,
    source_updated_at desc
);

drop trigger if exists set_space_weather_source_snapshots_updated_at
on public.space_weather_source_snapshots;
create trigger set_space_weather_source_snapshots_updated_at
before update on public.space_weather_source_snapshots
for each row execute function public.set_updated_at();

alter table public.space_weather_source_snapshots enable row level security;

grant select on public.space_weather_source_snapshots to authenticated;
grant insert, update, delete on public.space_weather_source_snapshots to authenticated;
grant all on public.space_weather_source_snapshots to service_role;

drop policy if exists "space_weather_source_snapshots_select_members"
on public.space_weather_source_snapshots;
create policy "space_weather_source_snapshots_select_members"
on public.space_weather_source_snapshots
for select
to authenticated
using (
    publication_status = 'published'
    and published_at is not null
    and published_at <= now()
);

drop policy if exists "space_weather_source_snapshots_select_staff"
on public.space_weather_source_snapshots;
create policy "space_weather_source_snapshots_select_staff"
on public.space_weather_source_snapshots
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "space_weather_source_snapshots_manage_staff"
on public.space_weather_source_snapshots;
create policy "space_weather_source_snapshots_manage_staff"
on public.space_weather_source_snapshots
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

insert into public.space_weather_source_snapshots (
    source_key,
    source_name,
    source_agency,
    source_product,
    source_url,
    source_updated_at,
    source_retrieved_at,
    stale_after_minutes,
    freshness_status,
    status_summary,
    risk_label,
    key_metrics,
    attribution_text,
    access_tier_required,
    publication_status,
    published_at,
    display_order,
    metadata
)
values
    (
        'noaa-swpc-current-conditions',
        'NOAA SWPC Current Conditions',
        'NOAA / NWS Space Weather Prediction Center',
        'NOAA Scales current conditions',
        'https://www.spaceweather.gov/',
        '2026-06-29 22:04:52+00',
        '2026-06-29 22:06:00+00',
        60,
        'current',
        'Latest observed NOAA scales showed no active R, S, or G event; the 24-hour observed maximum included G1 minor geomagnetic activity.',
        'watch',
        '{"latest_observed":{"radio_blackout":"R none","solar_radiation_storm":"S none","geomagnetic_storm":"G none"},"observed_24h_max":{"radio_blackout":"R none","solar_radiation_storm":"S none","geomagnetic_storm":"G1 minor"}}'::jsonb,
        'Source: NOAA / NWS Space Weather Prediction Center current conditions page.',
        'member',
        'published',
        '2026-06-29 22:06:00+00',
        10,
        '{"seed":"task_041","source_scope":"official current conditions"}'::jsonb
    ),
    (
        'noaa-swpc-planetary-k-index',
        'NOAA SWPC Planetary K-index',
        'NOAA / NWS Space Weather Prediction Center',
        'Planetary K-index',
        'https://www.spaceweather.gov/products/planetary-k-index',
        '2026-06-29 22:06:00+00',
        '2026-06-29 22:06:00+00',
        15,
        'current',
        'Kp is tracked as the primary geomagnetic disturbance indicator for spacecraft, radio, power-grid, and aurora impacts.',
        'watch',
        '{"metric":"Kp","usage":"geomagnetic disturbance indicator","update_cadence":"chart updates every minute"}'::jsonb,
        'Source: NOAA / NWS Space Weather Prediction Center Planetary K-index product.',
        'member',
        'published',
        '2026-06-29 22:06:00+00',
        20,
        '{"seed":"task_041","source_scope":"official Kp product"}'::jsonb
    ),
    (
        'noaa-swpc-real-time-solar-wind',
        'NOAA SWPC Real-Time Solar Wind',
        'NOAA / NWS Space Weather Prediction Center',
        'Real-Time Solar Wind',
        'https://www.spaceweather.gov/products/real-time-solar-wind',
        '2026-06-29 20:00:00+00',
        '2026-06-29 22:06:00+00',
        30,
        'watching',
        'Real-time solar wind context is available from L1 spacecraft data, including magnetic field, density, speed, and temperature.',
        'nominal',
        '{"metrics":["Bt/Bz GSM","density","speed","temperature"],"spacecraft":["DSCOVR","ACE"],"window":"1 day at 1 minute"}'::jsonb,
        'Source: NOAA / NWS Space Weather Prediction Center Real-Time Solar Wind product.',
        'member',
        'published',
        '2026-06-29 22:06:00+00',
        30,
        '{"seed":"task_041","source_scope":"official solar wind product"}'::jsonb
    ),
    (
        'nasa-ccmc-donki',
        'NASA CCMC DONKI',
        'NASA Community Coordinated Modeling Center',
        'Space Weather Database Of Notifications, Knowledge, Information',
        'https://ccmc.gsfc.nasa.gov/tools/DONKI/',
        '2026-04-14 00:00:00+00',
        '2026-06-29 22:06:00+00',
        10080,
        'stale',
        'DONKI is tracked as a comprehensive reference source for space-weather notifications, knowledge, information, and model context.',
        'unknown',
        '{"source_type":"space weather event database","events":["CME","solar flare","geomagnetic storm","notifications"],"last_page_update":"2026-04-14"}'::jsonb,
        'Source: NASA CCMC DONKI system page.',
        'member',
        'published',
        '2026-06-29 22:06:00+00',
        40,
        '{"seed":"task_041","source_scope":"official NASA DONKI overview"}'::jsonb
    )
on conflict (source_key) do update set
    source_name = excluded.source_name,
    source_agency = excluded.source_agency,
    source_product = excluded.source_product,
    source_url = excluded.source_url,
    source_updated_at = excluded.source_updated_at,
    source_retrieved_at = excluded.source_retrieved_at,
    stale_after_minutes = excluded.stale_after_minutes,
    freshness_status = excluded.freshness_status,
    status_summary = excluded.status_summary,
    risk_label = excluded.risk_label,
    key_metrics = excluded.key_metrics,
    attribution_text = excluded.attribution_text,
    access_tier_required = excluded.access_tier_required,
    publication_status = excluded.publication_status,
    published_at = excluded.published_at,
    display_order = excluded.display_order,
    metadata = excluded.metadata,
    updated_at = now();
