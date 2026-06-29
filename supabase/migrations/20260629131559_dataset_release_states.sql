do $$
begin
    create type public.dataset_catalog_release_state as enum (
        'command_exclusive',
        'scout_delayed',
        'public_demo',
        'unavailable'
    );
exception
    when duplicate_object then null;
end $$;

alter table public.dataset_catalog_entries
add column if not exists release_state
    public.dataset_catalog_release_state not null default 'public_demo',
add column if not exists exclusive_access_starts_at timestamptz,
add column if not exists exclusive_access_ends_at timestamptz,
add column if not exists scout_release_at timestamptz,
add column if not exists public_release_at timestamptz,
add column if not exists release_state_note text,
add column if not exists unavailable_reason text;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'dataset_catalog_entries_exclusive_range'
    ) then
        alter table public.dataset_catalog_entries
        add constraint dataset_catalog_entries_exclusive_range check (
            exclusive_access_starts_at is null
            or exclusive_access_ends_at is null
            or exclusive_access_ends_at >= exclusive_access_starts_at
        );
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'dataset_catalog_entries_command_exclusive_one_year'
    ) then
        alter table public.dataset_catalog_entries
        add constraint dataset_catalog_entries_command_exclusive_one_year check (
            release_state <> 'command_exclusive'
            or exclusive_access_starts_at is null
            or exclusive_access_ends_at is null
            or exclusive_access_ends_at >=
                exclusive_access_starts_at + interval '1 year'
        );
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'dataset_catalog_entries_scout_release_after_exclusive'
    ) then
        alter table public.dataset_catalog_entries
        add constraint dataset_catalog_entries_scout_release_after_exclusive check (
            scout_release_at is null
            or exclusive_access_ends_at is null
            or scout_release_at >= exclusive_access_ends_at
        );
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'dataset_catalog_entries_unavailable_reason'
    ) then
        alter table public.dataset_catalog_entries
        add constraint dataset_catalog_entries_unavailable_reason check (
            release_state <> 'unavailable'
            or (
                unavailable_reason is not null
                and length(trim(unavailable_reason)) > 0
            )
        );
    end if;
end $$;

create index if not exists dataset_catalog_entries_release_state_idx
on public.dataset_catalog_entries (
    release_state,
    exclusive_access_ends_at,
    scout_release_at,
    public_release_at
);

update public.dataset_catalog_entries
set
    release_state = 'public_demo',
    public_release_at = coalesce(public_release_at, published_at),
    release_state_note = 'Public source-hosted dataset or demo is immediately visible in the catalog.',
    unavailable_reason = null,
    updated_at = now()
where dataset_key in (
    'nasa-pds-lunar-ode',
    'nasa-pds-lro-lroc-rdr',
    'usgs-unified-geologic-map-moon'
);

update public.dataset_catalog_entries
set
    release_state = 'scout_delayed',
    scout_release_at = '2026-07-31 13:00:00+00',
    public_release_at = null,
    release_state_note = 'Public demo is visible now; enriched working records are queued for Scout release.',
    unavailable_reason = null,
    updated_at = now()
where dataset_key = 'potomac-lunar-site-intelligence-demo';

update public.dataset_catalog_entries
set
    access_tier_required = 'command',
    release_state = 'command_exclusive',
    exclusive_access_starts_at = '2026-06-29 13:00:00+00',
    exclusive_access_ends_at = '2027-06-29 13:00:00+00',
    scout_release_at = '2027-06-29 13:00:00+00',
    public_release_at = null,
    release_target_date = '2027-06-29',
    release_state_note = 'Command-exclusive benchmark pack for the first year after cataloged collection; Scout access begins after the exclusivity window.',
    unavailable_reason = null,
    updated_at = now()
where dataset_key = 'potomac-lunar-economy-benchmark-pack';

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
    release_state,
    exclusive_access_starts_at,
    exclusive_access_ends_at,
    scout_release_at,
    public_release_at,
    release_state_note,
    unavailable_reason,
    metadata
)
values (
    'potomac-near-real-time-polar-volatiles-feed',
    'potomac-near-real-time-polar-volatiles-feed',
    'Potomac Near-Real-Time Polar Volatiles Feed',
    'Placeholder catalog record for future near-real-time lunar polar volatiles intelligence once collection, rights, and customer allocation are approved.',
    'potomac_proprietary',
    'Potomac Database Systems',
    'Potomac Database Systems',
    'Command intelligence',
    'restricted',
    'Unavailable until collection rights, review workflow, and Command allocation are approved.',
    'command',
    false,
    null,
    false,
    null,
    'No public sample is available while collection and rights review are pending.',
    'Lunar polar regions',
    null,
    null,
    array[
        'near-real-time intelligence',
        'volatiles',
        'polar operations',
        'collection placeholder'
    ],
    'Unavailable until production collection is approved.',
    null,
    'Potomac proprietary placeholder; no redistribution or data access is available.',
    '2026-06-29 13:00:00+00',
    null,
    'published',
    '2026-06-29 13:00:00+00',
    60,
    'unavailable',
    null,
    null,
    null,
    null,
    'Unavailable records are represented explicitly so members can see planned categories without assuming access.',
    'Collection rights, security review, and customer allocation are not approved.',
    '{"catalog_seed":"task_038","potomac_proprietary":true}'::jsonb
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
    release_state = excluded.release_state,
    exclusive_access_starts_at = excluded.exclusive_access_starts_at,
    exclusive_access_ends_at = excluded.exclusive_access_ends_at,
    scout_release_at = excluded.scout_release_at,
    public_release_at = excluded.public_release_at,
    release_state_note = excluded.release_state_note,
    unavailable_reason = excluded.unavailable_reason,
    metadata = excluded.metadata,
    updated_at = now();

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
    'potomac-volatiles-placeholder',
    'Potomac near-real-time volatiles placeholder',
    'Potomac Database Systems',
    'placeholder',
    null,
    'Internal placeholder catalog source for a future near-real-time polar volatiles intelligence product.',
    'Potomac proprietary planning record; no source data is distributed.',
    null,
    '2026-06-29 13:00:00+00',
    true,
    'experimental',
    10
from public.dataset_catalog_entries entry
where entry.dataset_key = 'potomac-near-real-time-polar-volatiles-feed'
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
