do $$
begin
    create type public.intelligence_search_record_kind as enum (
        'article',
        'event',
        'company',
        'lunar_mission',
        'dataset',
        'data_request',
        'data_offer',
        'job',
        'procurement',
        'regulatory_record',
        'methodology_source',
        'dashboard_module',
        'calculator',
        'rfq',
        'forum_thread',
        'member_profile'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.intelligence_search_publication_status as enum (
        'draft',
        'review',
        'published',
        'archived',
        'hidden'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.intelligence_search_visibility_tier as enum (
        'public',
        'explorer',
        'scout',
        'command',
        'staff'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.intelligence_search_confidence_label as enum (
        'low',
        'medium',
        'high',
        'experimental'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.intelligence_command_entry_kind as enum (
        'route',
        'record',
        'action',
        'admin_action',
        'external_link'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.intelligence_search_records (
    id uuid primary key default gen_random_uuid(),
    source_kind public.intelligence_search_record_kind not null,
    source_table text,
    source_record_id uuid,
    source_slug text,
    route_path text not null,
    title text not null,
    eyebrow text,
    summary text not null default '',
    snippet text not null default '',
    keywords text[] not null default '{}'::text[],
    entities text[] not null default '{}'::text[],
    tags text[] not null default '{}'::text[],
    region_scope text,
    program_scope text,
    source_published_at timestamptz,
    source_updated_at timestamptz,
    freshness_at timestamptz,
    quality_score numeric(5, 2) not null default 0,
    confidence_label public.intelligence_search_confidence_label not null
        default 'medium',
    publication_status public.intelligence_search_publication_status not null
        default 'draft',
    visibility_tier public.intelligence_search_visibility_tier not null
        default 'explorer',
    is_command_enabled boolean not null default true,
    is_search_enabled boolean not null default true,
    is_admin_pinned boolean not null default false,
    admin_pin_label text,
    admin_pin_rank integer,
    pinned_until timestamptz,
    result_rank integer not null default 100,
    citation_count integer not null default 0,
    source_count integer not null default 0,
    source_license_summary text,
    metadata jsonb not null default '{}'::jsonb,
    indexed_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    search_document tsvector not null default ''::tsvector,
    constraint intelligence_search_records_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint intelligence_search_records_route_not_blank check (
        length(trim(route_path)) > 0
    ),
    constraint intelligence_search_records_route_format check (
        route_path ~ '^/'
        or route_path ~* '^https?://'
    ),
    constraint intelligence_search_records_source_table_not_blank check (
        source_table is null
        or length(trim(source_table)) > 0
    ),
    constraint intelligence_search_records_source_slug_not_blank check (
        source_slug is null
        or length(trim(source_slug)) > 0
    ),
    constraint intelligence_search_records_quality_score check (
        quality_score between 0 and 100
    ),
    constraint intelligence_search_records_counts_nonnegative check (
        citation_count >= 0
        and source_count >= 0
    ),
    constraint intelligence_search_records_rank_nonnegative check (
        result_rank >= 0
        and (admin_pin_rank is null or admin_pin_rank >= 0)
    ),
    constraint intelligence_search_records_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create or replace function public.set_intelligence_search_records_document()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    new.search_document :=
        setweight(to_tsvector('english', coalesce(new.title, '')), 'A')
        || setweight(to_tsvector('english', coalesce(new.eyebrow, '')), 'B')
        || setweight(to_tsvector('english', coalesce(new.summary, '')), 'B')
        || setweight(to_tsvector('english', coalesce(new.snippet, '')), 'C')
        || setweight(
            to_tsvector(
                'english',
                array_to_string(coalesce(new.keywords, '{}'::text[]), ' ')
            ),
            'A'
        )
        || setweight(
            to_tsvector(
                'english',
                array_to_string(coalesce(new.entities, '{}'::text[]), ' ')
            ),
            'B'
        )
        || setweight(
            to_tsvector(
                'english',
                array_to_string(coalesce(new.tags, '{}'::text[]), ' ')
            ),
            'C'
        );

    return new;
end;
$$;

drop trigger if exists set_intelligence_search_records_document
on public.intelligence_search_records;
create trigger set_intelligence_search_records_document
before insert or update of
    title,
    eyebrow,
    summary,
    snippet,
    keywords,
    entities,
    tags
on public.intelligence_search_records
for each row execute function public.set_intelligence_search_records_document();

create unique index if not exists intelligence_search_records_source_key
on public.intelligence_search_records (
    source_kind,
    coalesce(source_table, ''),
    coalesce(source_record_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(lower(source_slug), '')
);

create index if not exists intelligence_search_records_document_idx
on public.intelligence_search_records using gin (search_document);

create index if not exists intelligence_search_records_keywords_idx
on public.intelligence_search_records using gin (keywords);

create index if not exists intelligence_search_records_entities_idx
on public.intelligence_search_records using gin (entities);

create index if not exists intelligence_search_records_visible_idx
on public.intelligence_search_records (
    publication_status,
    visibility_tier,
    source_kind,
    result_rank,
    freshness_at desc nulls last
)
where is_search_enabled;

create index if not exists intelligence_search_records_pinned_idx
on public.intelligence_search_records (
    is_admin_pinned,
    admin_pin_rank,
    result_rank
)
where is_admin_pinned;

drop trigger if exists set_intelligence_search_records_updated_at
on public.intelligence_search_records;
create trigger set_intelligence_search_records_updated_at
before update on public.intelligence_search_records
for each row execute function public.set_updated_at();

create table if not exists public.intelligence_search_sources (
    id uuid primary key default gen_random_uuid(),
    search_record_id uuid not null
        references public.intelligence_search_records(id) on delete cascade,
    source_name text not null,
    title text not null,
    url text,
    publisher text,
    published_at timestamptz,
    retrieved_at timestamptz,
    citation_text text,
    license_notes text,
    confidence_label public.intelligence_search_confidence_label not null
        default 'medium',
    display_order integer not null default 100,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint intelligence_search_sources_name_not_blank check (
        length(trim(source_name)) > 0
    ),
    constraint intelligence_search_sources_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint intelligence_search_sources_url_format check (
        url is null
        or url ~* '^https?://'
    ),
    constraint intelligence_search_sources_display_order check (
        display_order >= 0
    ),
    constraint intelligence_search_sources_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create index if not exists intelligence_search_sources_record_idx
on public.intelligence_search_sources (search_record_id, display_order);

drop trigger if exists set_intelligence_search_sources_updated_at
on public.intelligence_search_sources;
create trigger set_intelligence_search_sources_updated_at
before update on public.intelligence_search_sources
for each row execute function public.set_updated_at();

create table if not exists public.intelligence_command_entries (
    id uuid primary key default gen_random_uuid(),
    search_record_id uuid references public.intelligence_search_records(id)
        on delete cascade,
    command_key text not null,
    label text not null,
    description text not null default '',
    entry_kind public.intelligence_command_entry_kind not null default 'route',
    route_path text not null,
    keyboard_shortcut text,
    icon_name text,
    section_label text not null default 'Terminal',
    keywords text[] not null default '{}'::text[],
    visibility_tier public.intelligence_search_visibility_tier not null
        default 'explorer',
    publication_status public.intelligence_search_publication_status not null
        default 'published',
    is_admin_pinned boolean not null default false,
    admin_pin_rank integer,
    requires_confirmation boolean not null default false,
    metadata jsonb not null default '{}'::jsonb,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    command_document tsvector not null default ''::tsvector,
    constraint intelligence_command_entries_key_not_blank check (
        length(trim(command_key)) > 0
    ),
    constraint intelligence_command_entries_label_not_blank check (
        length(trim(label)) > 0
    ),
    constraint intelligence_command_entries_route_not_blank check (
        length(trim(route_path)) > 0
    ),
    constraint intelligence_command_entries_route_format check (
        route_path ~ '^/'
        or route_path ~* '^https?://'
    ),
    constraint intelligence_command_entries_pin_rank check (
        admin_pin_rank is null
        or admin_pin_rank >= 0
    ),
    constraint intelligence_command_entries_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create or replace function public.set_intelligence_command_entries_document()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
    new.command_document :=
        setweight(to_tsvector('english', coalesce(new.label, '')), 'A')
        || setweight(to_tsvector('english', coalesce(new.description, '')), 'B')
        || setweight(to_tsvector('english', coalesce(new.section_label, '')), 'B')
        || setweight(
            to_tsvector(
                'english',
                array_to_string(coalesce(new.keywords, '{}'::text[]), ' ')
            ),
            'A'
        );

    return new;
end;
$$;

drop trigger if exists set_intelligence_command_entries_document
on public.intelligence_command_entries;
create trigger set_intelligence_command_entries_document
before insert or update of
    label,
    description,
    section_label,
    keywords
on public.intelligence_command_entries
for each row execute function public.set_intelligence_command_entries_document();

create unique index if not exists intelligence_command_entries_key
on public.intelligence_command_entries (lower(command_key));

create index if not exists intelligence_command_entries_document_idx
on public.intelligence_command_entries using gin (command_document);

create index if not exists intelligence_command_entries_visible_idx
on public.intelligence_command_entries (
    publication_status,
    visibility_tier,
    section_label,
    admin_pin_rank nulls last
);

drop trigger if exists set_intelligence_command_entries_updated_at
on public.intelligence_command_entries;
create trigger set_intelligence_command_entries_updated_at
before update on public.intelligence_command_entries
for each row execute function public.set_updated_at();

create table if not exists public.intelligence_search_synonyms (
    id uuid primary key default gen_random_uuid(),
    term text not null,
    synonyms text[] not null,
    source_kind public.intelligence_search_record_kind,
    is_active boolean not null default true,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint intelligence_search_synonyms_term_not_blank check (
        length(trim(term)) > 0
    ),
    constraint intelligence_search_synonyms_has_values check (
        cardinality(synonyms) > 0
    )
);

create unique index if not exists intelligence_search_synonyms_term_key
on public.intelligence_search_synonyms (
    lower(term),
    source_kind
) nulls not distinct;

drop trigger if exists set_intelligence_search_synonyms_updated_at
on public.intelligence_search_synonyms;
create trigger set_intelligence_search_synonyms_updated_at
before update on public.intelligence_search_synonyms
for each row execute function public.set_updated_at();

create or replace function app_private.can_read_intelligence_search(
    target_tier public.intelligence_search_visibility_tier
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select target_tier = 'public'
        or (
            target_tier = 'explorer'
            and app_private.has_any_role(array[
                'explorer',
                'member',
                'scout',
                'command_user',
                'editor',
                'analyst',
                'admin'
            ])
        )
        or (
            target_tier = 'scout'
            and app_private.has_any_role(array[
                'scout',
                'command_user',
                'editor',
                'analyst',
                'admin'
            ])
        )
        or (
            target_tier = 'command'
            and app_private.has_any_role(array[
                'command_user',
                'editor',
                'analyst',
                'admin'
            ])
        )
        or (
            target_tier = 'staff'
            and app_private.has_any_role(array['editor', 'analyst', 'admin'])
        );
$$;

create or replace function app_private.can_manage_intelligence_search()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select app_private.has_any_role(array['editor', 'analyst', 'admin']);
$$;

grant execute on function app_private.can_read_intelligence_search(
    public.intelligence_search_visibility_tier
) to anon, authenticated;
grant execute on function app_private.can_manage_intelligence_search()
to authenticated;

alter table public.intelligence_search_records enable row level security;
alter table public.intelligence_search_sources enable row level security;
alter table public.intelligence_command_entries enable row level security;
alter table public.intelligence_search_synonyms enable row level security;

grant select (
    id,
    source_kind,
    source_table,
    source_record_id,
    source_slug,
    route_path,
    title,
    eyebrow,
    summary,
    snippet,
    keywords,
    entities,
    tags,
    region_scope,
    program_scope,
    source_published_at,
    source_updated_at,
    freshness_at,
    quality_score,
    confidence_label,
    publication_status,
    visibility_tier,
    is_command_enabled,
    is_search_enabled,
    is_admin_pinned,
    admin_pin_label,
    admin_pin_rank,
    pinned_until,
    result_rank,
    citation_count,
    source_count,
    source_license_summary,
    metadata,
    indexed_at,
    updated_at,
    search_document
) on public.intelligence_search_records to anon, authenticated;

grant select (
    id,
    search_record_id,
    source_name,
    title,
    url,
    publisher,
    published_at,
    retrieved_at,
    citation_text,
    license_notes,
    confidence_label,
    display_order,
    metadata,
    updated_at
) on public.intelligence_search_sources to anon, authenticated;

grant select (
    id,
    search_record_id,
    command_key,
    label,
    description,
    entry_kind,
    route_path,
    keyboard_shortcut,
    icon_name,
    section_label,
    keywords,
    visibility_tier,
    publication_status,
    is_admin_pinned,
    admin_pin_rank,
    requires_confirmation,
    metadata,
    updated_at,
    command_document
) on public.intelligence_command_entries to anon, authenticated;

grant select (
    id,
    term,
    synonyms,
    source_kind,
    is_active,
    updated_at
) on public.intelligence_search_synonyms to anon, authenticated;

grant insert, update, delete on
    public.intelligence_search_records,
    public.intelligence_search_sources,
    public.intelligence_command_entries,
    public.intelligence_search_synonyms
to authenticated;

grant all on
    public.intelligence_search_records,
    public.intelligence_search_sources,
    public.intelligence_command_entries,
    public.intelligence_search_synonyms
to service_role;

drop policy if exists "intelligence_search_records_select_visible"
on public.intelligence_search_records;
create policy "intelligence_search_records_select_visible"
on public.intelligence_search_records
for select
to anon, authenticated
using (
    publication_status = 'published'
    and is_search_enabled
    and (
        pinned_until is null
        or pinned_until > now()
        or not is_admin_pinned
    )
    and app_private.can_read_intelligence_search(visibility_tier)
);

drop policy if exists "intelligence_search_records_manage_staff"
on public.intelligence_search_records;
create policy "intelligence_search_records_manage_staff"
on public.intelligence_search_records
for all
to authenticated
using (app_private.can_manage_intelligence_search())
with check (app_private.can_manage_intelligence_search());

drop policy if exists "intelligence_search_sources_select_visible"
on public.intelligence_search_sources;
create policy "intelligence_search_sources_select_visible"
on public.intelligence_search_sources
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.intelligence_search_records record
        where record.id = intelligence_search_sources.search_record_id
            and record.publication_status = 'published'
            and record.is_search_enabled
            and app_private.can_read_intelligence_search(record.visibility_tier)
    )
);

drop policy if exists "intelligence_search_sources_manage_staff"
on public.intelligence_search_sources;
create policy "intelligence_search_sources_manage_staff"
on public.intelligence_search_sources
for all
to authenticated
using (app_private.can_manage_intelligence_search())
with check (app_private.can_manage_intelligence_search());

drop policy if exists "intelligence_command_entries_select_visible"
on public.intelligence_command_entries;
create policy "intelligence_command_entries_select_visible"
on public.intelligence_command_entries
for select
to anon, authenticated
using (
    publication_status = 'published'
    and app_private.can_read_intelligence_search(visibility_tier)
    and (
        search_record_id is null
        or exists (
            select 1
            from public.intelligence_search_records record
            where record.id = intelligence_command_entries.search_record_id
                and record.publication_status = 'published'
                and record.is_command_enabled
                and app_private.can_read_intelligence_search(
                    record.visibility_tier
                )
        )
    )
);

drop policy if exists "intelligence_command_entries_manage_staff"
on public.intelligence_command_entries;
create policy "intelligence_command_entries_manage_staff"
on public.intelligence_command_entries
for all
to authenticated
using (app_private.can_manage_intelligence_search())
with check (app_private.can_manage_intelligence_search());

drop policy if exists "intelligence_search_synonyms_select_active"
on public.intelligence_search_synonyms;
create policy "intelligence_search_synonyms_select_active"
on public.intelligence_search_synonyms
for select
to anon, authenticated
using (is_active);

drop policy if exists "intelligence_search_synonyms_manage_staff"
on public.intelligence_search_synonyms;
create policy "intelligence_search_synonyms_manage_staff"
on public.intelligence_search_synonyms
for all
to authenticated
using (app_private.can_manage_intelligence_search())
with check (app_private.can_manage_intelligence_search());

insert into public.intelligence_search_records (
    source_kind,
    source_table,
    source_slug,
    route_path,
    title,
    eyebrow,
    summary,
    snippet,
    keywords,
    entities,
    tags,
    visibility_tier,
    publication_status,
    result_rank,
    is_admin_pinned,
    admin_pin_label,
    admin_pin_rank,
    metadata
)
values
    (
        'dashboard_module',
        'terminal_modules',
        'terminal',
        '/terminal',
        'Lunar Intelligence Terminal',
        'Dashboard module',
        'Command-center overview for lunar news, missions, companies, procurements, regulatory watch, datasets, calculators, and alerts.',
        'Jump to the main lunar industry terminal.',
        array['terminal', 'dashboard', 'lunar intelligence', 'command center'],
        array['Potomac', 'Moon', 'lunar industry'],
        array['dashboard', 'navigation'],
        'public',
        'published',
        5,
        true,
        'Primary terminal',
        5,
        '{"seed":"task_063","module":"terminal"}'::jsonb
    ),
    (
        'dashboard_module',
        'terminal_modules',
        'news',
        '/news/vipc-grant-winner',
        'News and Analysis',
        'Editorial module',
        'Public and member-gated lunar industry reporting, source citations, and article teasers.',
        'Search across Potomac article teasers and member intelligence.',
        array['news', 'articles', 'analysis', 'citations'],
        array['VIPC', 'Potomac'],
        array['editorial', 'news'],
        'public',
        'published',
        10,
        true,
        'Latest intelligence',
        10,
        '{"seed":"task_063","module":"news"}'::jsonb
    ),
    (
        'dashboard_module',
        'terminal_modules',
        'missions',
        '/launches',
        'Launch and Spacecraft Tracker',
        'Mission module',
        'Lunar launch, spacecraft, lander, payload, and satellite tracking with source freshness and status context.',
        'Find lunar missions, launches, landers, satellites, and payloads.',
        array['launches', 'spacecraft', 'landers', 'satellites', 'missions'],
        array['Artemis', 'CLPS', 'Moon'],
        array['missions', 'tracking'],
        'explorer',
        'published',
        20,
        true,
        'Mission tracker',
        20,
        '{"seed":"task_063","module":"missions"}'::jsonb
    ),
    (
        'dashboard_module',
        'terminal_modules',
        'procurement',
        '/procurement',
        'Lunar Procurement Hub',
        'Scout module',
        'Searchable opportunity and award intelligence for lunar-relevant procurements, SBIR/STTR items, and due dates.',
        'Find lunar procurement opportunities, awards, deadlines, and agencies.',
        array['procurement', 'awards', 'SBIR', 'STTR', 'solicitations'],
        array['NASA', 'CLPS', 'SBIR', 'STTR'],
        array['procurement', 'paid intelligence'],
        'scout',
        'published',
        30,
        false,
        null,
        null,
        '{"seed":"task_063","module":"procurement"}'::jsonb
    ),
    (
        'dashboard_module',
        'terminal_modules',
        'regulatory',
        '/regulatory',
        'Lunar Regulatory Watch',
        'Scout module',
        'Policy, filing, comment-period, compliance, and risk intelligence for lunar operators.',
        'Find lunar regulatory records, FCC filings, policy milestones, and comment periods.',
        array['regulatory', 'policy', 'filings', 'comment periods', 'compliance'],
        array['FCC', 'NOAA', 'FAA', 'NASA'],
        array['regulatory', 'policy'],
        'scout',
        'published',
        35,
        false,
        null,
        null,
        '{"seed":"task_063","module":"regulatory"}'::jsonb
    ),
    (
        'dashboard_module',
        'terminal_modules',
        'companies',
        '/companies',
        'Lunar Company Directory',
        'Company module',
        'Search and compare lunar company profiles, sectors, programs, facilities, contracts, leadership, and source labels.',
        'Find company profiles, comparison attributes, and lunar market participants.',
        array['companies', 'directory', 'comparison', 'contracts', 'facilities'],
        array['Intuitive Machines', 'Astrobotic', 'Firefly Aerospace'],
        array['companies', 'profiles'],
        'explorer',
        'published',
        40,
        false,
        null,
        null,
        '{"seed":"task_063","module":"companies"}'::jsonb
    ),
    (
        'dashboard_module',
        'terminal_modules',
        'datasets',
        '/datasets',
        'Lunar Dataset Catalog',
        'Data module',
        'Public and paid dataset catalog entries with release states, source metadata, sample links, and availability labels.',
        'Find lunar datasets, demo entries, source archives, and release states.',
        array['datasets', 'catalog', 'data', 'release states', 'sources'],
        array['NASA PDS', 'USGS', 'Potomac'],
        array['datasets', 'sources'],
        'public',
        'published',
        45,
        false,
        null,
        null,
        '{"seed":"task_063","module":"datasets"}'::jsonb
    ),
    (
        'dashboard_module',
        'terminal_modules',
        'marketplace',
        '/member/marketplace',
        'Data Requests and Offers',
        'Scout module',
        'Paid data-market records for lunar data requests, offers, evidence, and extraction-backed marketplace intelligence.',
        'Find data requests, offers, source documents, and marketplace evidence.',
        array['data requests', 'data offers', 'marketplace', 'source documents'],
        array['Potomac', 'Nexus'],
        array['data market', 'paid intelligence'],
        'scout',
        'published',
        50,
        false,
        null,
        null,
        '{"seed":"task_063","module":"marketplace"}'::jsonb
    ),
    (
        'dashboard_module',
        'terminal_modules',
        'jobs',
        '/member',
        'Space Sector Job Alerts',
        'Member module',
        'Member-visible job alert module for lunar and space-sector hiring signals from official career sources.',
        'Find job alert surfaces and hiring signals.',
        array['jobs', 'careers', 'hiring', 'alerts'],
        array['NASA', 'SpaceX', 'Blue Origin', 'Lockheed Martin'],
        array['jobs', 'alerts'],
        'explorer',
        'published',
        60,
        false,
        null,
        null,
        '{"seed":"task_063","module":"jobs"}'::jsonb
    ),
    (
        'dashboard_module',
        'terminal_modules',
        'calculators',
        '/calculators',
        'Lunar Mission Calculators',
        'Planning module',
        'Interactive lunar planning calculators for mission cost, windows, RF links, thermal balance, radiation, and power.',
        'Run lunar mission cost, launch-window, RF, thermal, radiation, and power calculators.',
        array['calculators', 'mission planning', 'cost', 'RF', 'thermal', 'radiation', 'power'],
        array['NASA', 'Moon'],
        array['calculators', 'planning'],
        'explorer',
        'published',
        70,
        false,
        null,
        null,
        '{"seed":"task_063","module":"calculators"}'::jsonb
    ),
    (
        'methodology_source',
        'lunar_economy_source_documents',
        'lunar-economy-methodology',
        '/member/economy',
        'Lunar Economy Methodology Sources',
        'Methodology module',
        'Source-backed methodology and evidence records for lunar economy estimates and benchmark calculations.',
        'Find methodology sources, assumptions, benchmark evidence, and model versions.',
        array['methodology', 'sources', 'economy', 'Firefly', 'benchmark'],
        array['Firefly Aerospace', 'NASA', 'CLPS', 'PRISM'],
        array['methodology', 'economy'],
        'scout',
        'published',
        80,
        false,
        null,
        null,
        '{"seed":"task_063","module":"methodology"}'::jsonb
    )
on conflict (
    source_kind,
    (coalesce(source_table, '')),
    (coalesce(source_record_id, '00000000-0000-0000-0000-000000000000'::uuid)),
    (coalesce(lower(source_slug), ''))
) do update set
    route_path = excluded.route_path,
    title = excluded.title,
    eyebrow = excluded.eyebrow,
    summary = excluded.summary,
    snippet = excluded.snippet,
    keywords = excluded.keywords,
    entities = excluded.entities,
    tags = excluded.tags,
    visibility_tier = excluded.visibility_tier,
    publication_status = excluded.publication_status,
    result_rank = excluded.result_rank,
    is_admin_pinned = excluded.is_admin_pinned,
    admin_pin_label = excluded.admin_pin_label,
    admin_pin_rank = excluded.admin_pin_rank,
    metadata = excluded.metadata,
    indexed_at = now(),
    updated_at = now();

insert into public.intelligence_command_entries (
    command_key,
    label,
    description,
    entry_kind,
    route_path,
    keyboard_shortcut,
    icon_name,
    section_label,
    keywords,
    visibility_tier,
    publication_status,
    is_admin_pinned,
    admin_pin_rank,
    metadata
)
values
    (
        'open-terminal',
        'Open terminal',
        'Go to the lunar intelligence terminal.',
        'route',
        '/terminal',
        'mod+k terminal',
        'LayoutDashboard',
        'Navigation',
        array['terminal', 'dashboard', 'home'],
        'public',
        'published',
        true,
        5,
        '{"seed":"task_063"}'::jsonb
    ),
    (
        'search-news',
        'Search news',
        'Open public news and analysis.',
        'route',
        '/news/vipc-grant-winner',
        null,
        'Newspaper',
        'Navigation',
        array['news', 'articles', 'analysis'],
        'public',
        'published',
        true,
        10,
        '{"seed":"task_063"}'::jsonb
    ),
    (
        'open-missions',
        'Open mission tracker',
        'Go to lunar launches, spacecraft, landers, satellites, and payloads.',
        'route',
        '/launches',
        null,
        'Rocket',
        'Lunar terminal',
        array['launches', 'missions', 'spacecraft', 'landers'],
        'explorer',
        'published',
        true,
        20,
        '{"seed":"task_063"}'::jsonb
    ),
    (
        'open-procurement',
        'Open procurement hub',
        'Go to Scout lunar procurement and award intelligence.',
        'route',
        '/procurement',
        null,
        'BriefcaseBusiness',
        'Lunar terminal',
        array['procurement', 'awards', 'SBIR', 'STTR'],
        'scout',
        'published',
        false,
        null,
        '{"seed":"task_063"}'::jsonb
    ),
    (
        'open-regulatory',
        'Open regulatory watch',
        'Go to Scout lunar regulatory and policy intelligence.',
        'route',
        '/regulatory',
        null,
        'Scale',
        'Lunar terminal',
        array['regulatory', 'policy', 'filings'],
        'scout',
        'published',
        false,
        null,
        '{"seed":"task_063"}'::jsonb
    ),
    (
        'open-companies',
        'Open company directory',
        'Go to lunar company profiles and comparisons.',
        'route',
        '/companies',
        null,
        'Building2',
        'Lunar terminal',
        array['companies', 'directory', 'profiles'],
        'explorer',
        'published',
        false,
        null,
        '{"seed":"task_063"}'::jsonb
    ),
    (
        'open-datasets',
        'Open dataset catalog',
        'Go to lunar datasets and release-state intelligence.',
        'route',
        '/datasets',
        null,
        'Database',
        'Lunar terminal',
        array['datasets', 'catalog', 'sources'],
        'public',
        'published',
        false,
        null,
        '{"seed":"task_063"}'::jsonb
    ),
    (
        'open-calculators',
        'Open calculators',
        'Go to lunar mission planning calculators.',
        'route',
        '/calculators',
        null,
        'Calculator',
        'Lunar terminal',
        array['calculators', 'planning', 'cost', 'power', 'RF'],
        'explorer',
        'published',
        false,
        null,
        '{"seed":"task_063"}'::jsonb
    ),
    (
        'admin-search-index',
        'Manage search index',
        'Admin action placeholder for pinned results and search index review.',
        'admin_action',
        '/admin/editorial',
        null,
        'ListFilter',
        'Admin',
        array['admin', 'search index', 'pinned results'],
        'staff',
        'published',
        false,
        null,
        '{"seed":"task_063","future_route":"/admin/search"}'::jsonb
    )
on conflict ((lower(command_key))) do update set
    label = excluded.label,
    description = excluded.description,
    entry_kind = excluded.entry_kind,
    route_path = excluded.route_path,
    keyboard_shortcut = excluded.keyboard_shortcut,
    icon_name = excluded.icon_name,
    section_label = excluded.section_label,
    keywords = excluded.keywords,
    visibility_tier = excluded.visibility_tier,
    publication_status = excluded.publication_status,
    is_admin_pinned = excluded.is_admin_pinned,
    admin_pin_rank = excluded.admin_pin_rank,
    metadata = excluded.metadata,
    updated_at = now();

insert into public.intelligence_search_synonyms (
    term,
    synonyms,
    source_kind,
    is_active
)
values
    ('CLPS', array['commercial lunar payload services', 'lunar lander'], null, true),
    ('SBIR', array['small business innovation research', 'procurement'], 'procurement', true),
    ('STTR', array['small business technology transfer', 'procurement'], 'procurement', true),
    ('RFI', array['request for information', 'sources sought'], 'procurement', true),
    ('lander', array['spacecraft', 'payload delivery', 'lunar surface'], 'lunar_mission', true),
    ('dataset', array['data catalog', 'source archive', 'data product'], 'dataset', true),
    ('Firefly', array['Blue Ghost', 'CLPS', 'lunar economy benchmark'], null, true),
    ('FCC', array['spectrum', 'filing', 'regulatory'], 'regulatory_record', true)
on conflict ((lower(term)), source_kind) do update set
    synonyms = excluded.synonyms,
    is_active = excluded.is_active,
    updated_at = now();
