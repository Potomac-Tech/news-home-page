do $$
begin
    create type public.dataset_catalog_entry_kind as enum (
        'public_science',
        'potomac_proprietary',
        'partner',
        'derived_model'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.dataset_catalog_availability_state as enum (
        'available',
        'upcoming',
        'preview',
        'restricted',
        'retired'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.dataset_catalog_publication_status as enum (
        'draft',
        'published',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.dataset_catalog_entries (
    id uuid primary key default gen_random_uuid(),
    dataset_key text not null unique,
    slug text not null unique,
    title text not null,
    summary text not null,
    dataset_kind public.dataset_catalog_entry_kind not null,
    provider_name text not null,
    owner_name text,
    collection_name text,
    availability_state public.dataset_catalog_availability_state not null
        default 'upcoming',
    availability_note text,
    access_tier_required public.membership_tier,
    is_sample_available boolean not null default false,
    sample_url text,
    is_demo_available boolean not null default false,
    demo_url text,
    sample_note text,
    coverage_start_at timestamptz,
    coverage_end_at timestamptz,
    geography_scope text,
    mission_name text,
    instrument_name text,
    data_types text[] not null default '{}'::text[],
    update_frequency text,
    source_landing_url text,
    source_license text,
    source_retrieved_at timestamptz,
    release_target_date date,
    publication_status public.dataset_catalog_publication_status not null
        default 'draft',
    published_at timestamptz,
    display_order integer not null default 100,
    metadata jsonb not null default '{}'::jsonb,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint dataset_catalog_entries_key_not_blank check (
        length(trim(dataset_key)) > 0
    ),
    constraint dataset_catalog_entries_slug_not_blank check (
        length(trim(slug)) > 0
    ),
    constraint dataset_catalog_entries_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint dataset_catalog_entries_summary_not_blank check (
        length(trim(summary)) > 0
    ),
    constraint dataset_catalog_entries_provider_not_blank check (
        length(trim(provider_name)) > 0
    ),
    constraint dataset_catalog_entries_data_types_present check (
        cardinality(data_types) > 0
    ),
    constraint dataset_catalog_entries_sample_url_format check (
        sample_url is null
        or sample_url ~* '^https?://'
    ),
    constraint dataset_catalog_entries_demo_url_format check (
        demo_url is null
        or demo_url ~* '^https?://'
    ),
    constraint dataset_catalog_entries_source_url_format check (
        source_landing_url is null
        or source_landing_url ~* '^https?://'
    ),
    constraint dataset_catalog_entries_coverage_range check (
        coverage_start_at is null
        or coverage_end_at is null
        or coverage_end_at >= coverage_start_at
    ),
    constraint dataset_catalog_entries_published_at_required check (
        publication_status <> 'published'
        or published_at is not null
    ),
    constraint dataset_catalog_entries_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create index if not exists dataset_catalog_entries_publication_idx
on public.dataset_catalog_entries (
    publication_status,
    availability_state,
    access_tier_required,
    display_order,
    published_at desc
);

create index if not exists dataset_catalog_entries_kind_idx
on public.dataset_catalog_entries (
    dataset_kind,
    availability_state,
    display_order
);

drop trigger if exists set_dataset_catalog_entries_updated_at
on public.dataset_catalog_entries;
create trigger set_dataset_catalog_entries_updated_at
before update on public.dataset_catalog_entries
for each row execute function public.set_updated_at();

create table if not exists public.dataset_catalog_sources (
    id uuid primary key default gen_random_uuid(),
    dataset_id uuid not null
        references public.dataset_catalog_entries(id)
        on delete cascade,
    source_key text not null,
    source_name text not null,
    source_publisher text,
    source_type text not null default 'source',
    source_url text,
    citation_text text,
    license_notes text,
    published_at date,
    retrieved_at timestamptz,
    is_public boolean not null default true,
    confidence_label text not null default 'medium',
    display_order integer not null default 100,
    created_at timestamptz not null default now(),
    constraint dataset_catalog_sources_key_not_blank check (
        length(trim(source_key)) > 0
    ),
    constraint dataset_catalog_sources_name_not_blank check (
        length(trim(source_name)) > 0
    ),
    constraint dataset_catalog_sources_type_not_blank check (
        length(trim(source_type)) > 0
    ),
    constraint dataset_catalog_sources_url_format check (
        source_url is null
        or source_url ~* '^https?://'
    ),
    constraint dataset_catalog_sources_confidence_label check (
        confidence_label in ('experimental', 'low', 'medium', 'high')
    ),
    constraint dataset_catalog_sources_display_order check (
        display_order >= 0
    )
);

create unique index if not exists dataset_catalog_sources_dataset_key
on public.dataset_catalog_sources (dataset_id, source_key);

create index if not exists dataset_catalog_sources_public_idx
on public.dataset_catalog_sources (dataset_id, is_public, display_order);

alter table public.dataset_catalog_entries enable row level security;
alter table public.dataset_catalog_sources enable row level security;

grant select on
    public.dataset_catalog_entries,
    public.dataset_catalog_sources
to anon, authenticated;

grant insert, update, delete on
    public.dataset_catalog_entries,
    public.dataset_catalog_sources
to authenticated;

grant all on
    public.dataset_catalog_entries,
    public.dataset_catalog_sources
to service_role;

drop policy if exists "dataset_catalog_entries_select_published"
on public.dataset_catalog_entries;
create policy "dataset_catalog_entries_select_published"
on public.dataset_catalog_entries
for select
to anon, authenticated
using (
    publication_status = 'published'
    and published_at is not null
    and published_at <= now()
);

drop policy if exists "dataset_catalog_entries_select_staff"
on public.dataset_catalog_entries;
create policy "dataset_catalog_entries_select_staff"
on public.dataset_catalog_entries
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "dataset_catalog_entries_manage_staff"
on public.dataset_catalog_entries;
create policy "dataset_catalog_entries_manage_staff"
on public.dataset_catalog_entries
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "dataset_catalog_sources_select_public_published"
on public.dataset_catalog_sources;
create policy "dataset_catalog_sources_select_public_published"
on public.dataset_catalog_sources
for select
to anon, authenticated
using (
    is_public
    and exists (
        select 1
        from public.dataset_catalog_entries entry
        where entry.id = dataset_catalog_sources.dataset_id
            and entry.publication_status = 'published'
            and entry.published_at is not null
            and entry.published_at <= now()
    )
);

drop policy if exists "dataset_catalog_sources_select_staff"
on public.dataset_catalog_sources;
create policy "dataset_catalog_sources_select_staff"
on public.dataset_catalog_sources
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "dataset_catalog_sources_manage_staff"
on public.dataset_catalog_sources;
create policy "dataset_catalog_sources_manage_staff"
on public.dataset_catalog_sources
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

insert into public.dataset_catalog_entries (
    dataset_key,
    slug,
    title,
    summary,
    dataset_kind,
    provider_name,
    owner_name,
    collection_name,
    availability_state,
    availability_note,
    access_tier_required,
    is_sample_available,
    sample_url,
    is_demo_available,
    demo_url,
    sample_note,
    geography_scope,
    mission_name,
    instrument_name,
    data_types,
    update_frequency,
    source_landing_url,
    source_license,
    source_retrieved_at,
    release_target_date,
    publication_status,
    published_at,
    display_order,
    metadata
)
values
    (
        'nasa-pds-lunar-ode',
        'nasa-pds-lunar-orbital-data-explorer',
        'NASA PDS Lunar Orbital Data Explorer',
        'Cross-mission lunar archive access for searching, displaying, and downloading PDS science data from major lunar orbital missions.',
        'public_science',
        'PDS Geosciences Node',
        'NASA Planetary Data System',
        'Lunar Orbital Data Explorer',
        'available',
        'Public science archive with source-hosted data access.',
        null,
        true,
        'https://ode.rsl.wustl.edu/moon/',
        true,
        'https://ode.rsl.wustl.edu/moon/mapsearch',
        'Use the source archive for data access and source-specific download terms.',
        'Moon; multi-mission orbital coverage',
        'LRO, GRAIL, Clementine, Lunar Prospector, Lunar Orbiter, Chandrayaan-1',
        null,
        array[
            'orbital imagery',
            'spectroscopy',
            'altimetry',
            'radar',
            'mission archive'
        ],
        'Source archive updates vary by mission and release.',
        'https://ode.rsl.wustl.edu/moon/',
        'Public PDS archive; users must follow source archive terms and citations.',
        '2026-06-29 13:00:00+00',
        null,
        'published',
        '2026-06-29 13:00:00+00',
        10,
        '{"catalog_seed":"task_037"}'::jsonb
    ),
    (
        'nasa-pds-lro-lroc-rdr',
        'nasa-pds-lro-lroc-reduced-data-records',
        'LRO LROC Reduced Data Records',
        'Calibrated and reduced Lunar Reconnaissance Orbiter Camera products for lunar imaging, mosaics, and terrain context.',
        'public_science',
        'PDS Imaging Node / LROC Data Node',
        'NASA Planetary Data System',
        'LRO LROC archive',
        'available',
        'Public science archive with source-hosted LROC products.',
        null,
        true,
        'https://pds.lroc.im-ldi.com/',
        true,
        'https://pds-imaging.jpl.nasa.gov/volumes/lro.html',
        'Use the source archive for product download and citation requirements.',
        'Moon; LRO orbital imaging coverage',
        'Lunar Reconnaissance Orbiter',
        'LROC',
        array[
            'calibrated imagery',
            'reduced data records',
            'mosaics',
            'terrain context'
        ],
        'Periodic PDS releases.',
        'https://pds.nasa.gov/ds-view/pds/viewBundle.jsp?identifier=urn%3Anasa%3Apds%3Alro-l-lroc-5-rdr&version=3.0',
        'Public PDS archive; users must follow source archive terms and citations.',
        '2026-06-29 13:00:00+00',
        null,
        'published',
        '2026-06-29 13:00:00+00',
        20,
        '{"catalog_seed":"task_037"}'::jsonb
    ),
    (
        'usgs-unified-geologic-map-moon',
        'usgs-unified-geologic-map-of-the-moon',
        'USGS Unified Geologic Map of the Moon',
        'Global 1:5,000,000-scale lunar geologic map that summarizes lunar geologic units and provides context for exploration planning.',
        'public_science',
        'USGS Astrogeology Science Center',
        'U.S. Geological Survey',
        'Unified Geologic Map of the Moon',
        'available',
        'Public science map and associated download products.',
        null,
        true,
        'https://astrogeology.usgs.gov/search/map/unified_geologic_map_of_the_moon_1_5m_2020',
        true,
        'https://www.usgs.gov/news/national-news-release/usgs-releases-first-ever-comprehensive-geologic-map-moon',
        'Use USGS source pages for authoritative downloads and citation details.',
        'Global lunar geology',
        null,
        null,
        array[
            'geologic map',
            'stratigraphy',
            'surface units',
            'planning reference'
        ],
        'Published map product; source updates may occur.',
        'https://astrogeology.usgs.gov/search/map/unified_geologic_map_of_the_moon_1_5m_2020',
        'USGS public source; users must follow source usage and citation guidance.',
        '2026-06-29 13:00:00+00',
        null,
        'published',
        '2026-06-29 13:00:00+00',
        30,
        '{"catalog_seed":"task_037"}'::jsonb
    ),
    (
        'potomac-lunar-site-intelligence-demo',
        'potomac-lunar-site-intelligence-demo',
        'Potomac Lunar Site Intelligence Demo',
        'Potomac proprietary site-scoring preview that packages public lunar context, operator needs, and proposal-ready location intelligence.',
        'potomac_proprietary',
        'Potomac Database Systems',
        'Potomac Database Systems',
        'Nexus lunar intelligence',
        'preview',
        'Demo entry is visible publicly; full working data is reserved for paid access.',
        'scout',
        true,
        'https://potomacdb.com/nexus',
        true,
        'https://potomacdb.com/nexus',
        'Public demo only; underlying enriched records remain proprietary.',
        'Selected lunar regions and candidate operating areas',
        null,
        null,
        array[
            'site scoring',
            'terrain context',
            'operator workflow',
            'GIS-ready preview'
        ],
        'Preview cadence controlled by Potomac analyst review.',
        'https://potomacdb.com/nexus',
        'Potomac proprietary catalog entry; no redistribution without written permission.',
        '2026-06-29 13:00:00+00',
        null,
        'published',
        '2026-06-29 13:00:00+00',
        40,
        '{"catalog_seed":"task_037","potomac_proprietary":true}'::jsonb
    ),
    (
        'potomac-lunar-economy-benchmark-pack',
        'potomac-lunar-economy-benchmark-pack',
        'Potomac Lunar Economy Benchmark Pack',
        'Source-backed Potomac benchmark pack for lunar data economics, including the full NASA-paid Firefly Blue Ghost cost basis.',
        'derived_model',
        'Potomac Database Systems',
        'Potomac Database Systems',
        'Lunar economy intelligence',
        'upcoming',
        'Cataloged before full dataset release; current public preview is limited to methodology summaries.',
        'scout',
        false,
        null,
        true,
        'https://potomacdb.com/member/economy',
        'Scout and Command users can review the connected methodology dashboard after sign-in.',
        'Lunar economy benchmarks',
        'Firefly Blue Ghost Mission 1',
        null,
        array[
            'benchmark model',
            'source table',
            'cost basis',
            'economy estimate'
        ],
        'Updated as methodology versions are published.',
        'https://potomacdb.com/member/economy',
        'Potomac proprietary derived model; source citations remain visible where licensed or public.',
        '2026-06-29 13:00:00+00',
        '2026-07-31',
        'published',
        '2026-06-29 13:00:00+00',
        50,
        '{"catalog_seed":"task_037","potomac_proprietary":true}'::jsonb
    )
on conflict (dataset_key) do update set
    slug = excluded.slug,
    title = excluded.title,
    summary = excluded.summary,
    dataset_kind = excluded.dataset_kind,
    provider_name = excluded.provider_name,
    owner_name = excluded.owner_name,
    collection_name = excluded.collection_name,
    availability_state = excluded.availability_state,
    availability_note = excluded.availability_note,
    access_tier_required = excluded.access_tier_required,
    is_sample_available = excluded.is_sample_available,
    sample_url = excluded.sample_url,
    is_demo_available = excluded.is_demo_available,
    demo_url = excluded.demo_url,
    sample_note = excluded.sample_note,
    geography_scope = excluded.geography_scope,
    mission_name = excluded.mission_name,
    instrument_name = excluded.instrument_name,
    data_types = excluded.data_types,
    update_frequency = excluded.update_frequency,
    source_landing_url = excluded.source_landing_url,
    source_license = excluded.source_license,
    source_retrieved_at = excluded.source_retrieved_at,
    release_target_date = excluded.release_target_date,
    publication_status = excluded.publication_status,
    published_at = excluded.published_at,
    display_order = excluded.display_order,
    metadata = excluded.metadata,
    updated_at = now();

with source_seed (
    dataset_key,
    source_key,
    source_name,
    source_publisher,
    source_type,
    source_url,
    citation_text,
    license_notes,
    published_at,
    retrieved_at,
    is_public,
    confidence_label,
    display_order
) as (
    values
        (
            'nasa-pds-lunar-ode',
            'pds-ode-home',
            'Lunar Orbital Data Explorer home page',
            'PDS Geosciences Node',
            'archive',
            'https://ode.rsl.wustl.edu/moon/',
            'PDS Geosciences Node Lunar Orbital Data Explorer page for Moon archives.',
            'Use source archive terms and citation guidance.',
            '',
            '2026-06-29 13:00:00+00',
            'true',
            'high',
            '10'
        ),
        (
            'nasa-pds-lro-lroc-rdr',
            'pds-lroc-rdr-bundle',
            'PDS LRO LROC RDR bundle record',
            'NASA Planetary Data System',
            'archive',
            'https://pds.nasa.gov/ds-view/pds/viewBundle.jsp?identifier=urn%3Anasa%3Apds%3Alro-l-lroc-5-rdr&version=3.0',
            'PDS bundle record for LRO LROC reduced data products.',
            'Use source archive terms and citation guidance.',
            '2023-01-01',
            '2026-06-29 13:00:00+00',
            'true',
            'high',
            '10'
        ),
        (
            'usgs-unified-geologic-map-moon',
            'usgs-astrogeology-map',
            'Unified Geologic Map of the Moon, 1:5M, 2020',
            'USGS Astrogeology Science Center',
            'map',
            'https://astrogeology.usgs.gov/search/map/unified_geologic_map_of_the_moon_1_5m_2020',
            'USGS Astrogeology map product page for the unified lunar geologic map.',
            'Use USGS source usage and citation guidance.',
            '2020-04-20',
            '2026-06-29 13:00:00+00',
            'true',
            'high',
            '10'
        ),
        (
            'potomac-lunar-site-intelligence-demo',
            'potomac-nexus-public-page',
            'Potomac Nexus public product page',
            'Potomac Database Systems',
            'product',
            'https://potomacdb.com/nexus',
            'Potomac public Nexus page describing proprietary lunar site intelligence positioning.',
            'Potomac proprietary material; no redistribution without written permission.',
            '',
            '2026-06-29 13:00:00+00',
            'true',
            'medium',
            '10'
        ),
        (
            'potomac-lunar-economy-benchmark-pack',
            'potomac-economy-dashboard-reference',
            'Potomac lunar economy dashboard reference',
            'Potomac Database Systems',
            'derived_model',
            'https://potomacdb.com/member/economy',
            'Potomac member economy route connected to the Firefly full NASA-paid cost benchmark methodology.',
            'Potomac proprietary derived model with public-source citations where permitted.',
            '',
            '2026-06-29 13:00:00+00',
            'true',
            'medium',
            '10'
        )
)
insert into public.dataset_catalog_sources (
    dataset_id,
    source_key,
    source_name,
    source_publisher,
    source_type,
    source_url,
    citation_text,
    license_notes,
    published_at,
    retrieved_at,
    is_public,
    confidence_label,
    display_order
)
select
    entry.id,
    source_seed.source_key,
    source_seed.source_name,
    source_seed.source_publisher,
    source_seed.source_type,
    source_seed.source_url,
    source_seed.citation_text,
    source_seed.license_notes,
    nullif(source_seed.published_at, '')::date,
    source_seed.retrieved_at::timestamptz,
    source_seed.is_public::boolean,
    source_seed.confidence_label,
    source_seed.display_order::integer
from source_seed
join public.dataset_catalog_entries entry
    on entry.dataset_key = source_seed.dataset_key
on conflict (dataset_id, source_key) do update set
    source_name = excluded.source_name,
    source_publisher = excluded.source_publisher,
    source_type = excluded.source_type,
    source_url = excluded.source_url,
    citation_text = excluded.citation_text,
    license_notes = excluded.license_notes,
    published_at = excluded.published_at,
    retrieved_at = excluded.retrieved_at,
    is_public = excluded.is_public,
    confidence_label = excluded.confidence_label,
    display_order = excluded.display_order;
