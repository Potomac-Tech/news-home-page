do $$
begin
    create type public.data_source_owner_kind as enum (
        'government',
        'commercial',
        'academic',
        'nonprofit',
        'media',
        'community',
        'internal',
        'unknown'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.data_source_license_status as enum (
        'queued',
        'approved',
        'restricted',
        'rejected',
        'expired',
        'unknown'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.data_source_health_status as enum (
        'healthy',
        'degraded',
        'failing',
        'paused',
        'retired',
        'unknown'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.data_source_refresh_frequency as enum (
        'realtime',
        'hourly',
        'daily',
        'weekly',
        'monthly',
        'manual',
        'static'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.data_source_confidence_label as enum (
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
    create type public.data_source_analyst_review_state as enum (
        'not_started',
        'in_review',
        'approved',
        'needs_changes',
        'blocked',
        'retired'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.data_source_job_status as enum (
        'queued',
        'running',
        'succeeded',
        'failed',
        'cancelled',
        'skipped'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.intelligence_data_sources (
    id uuid primary key default gen_random_uuid(),
    source_key text not null,
    source_name text not null,
    source_owner text not null,
    owner_kind public.data_source_owner_kind not null default 'unknown',
    primary_url text,
    terms_url text,
    license_name text,
    license_status public.data_source_license_status not null default 'queued',
    license_reviewed_at timestamptz,
    license_reviewed_by uuid references auth.users(id) on delete set null,
    license_notes text,
    refresh_frequency public.data_source_refresh_frequency not null
        default 'manual',
    parser_key text,
    parser_repository_url text,
    job_name text,
    health_status public.data_source_health_status not null default 'unknown',
    last_checked_at timestamptz,
    last_success_at timestamptz,
    last_failure_at timestamptz,
    stale_after_hours integer,
    next_refresh_at timestamptz,
    citation_required boolean not null default true,
    citation_format text,
    attribution_text text,
    quality_score numeric(5, 2) not null default 0,
    confidence_label public.data_source_confidence_label not null
        default 'experimental',
    analyst_review_state public.data_source_analyst_review_state not null
        default 'not_started',
    analyst_notes text,
    publication_status public.intelligence_search_publication_status not null
        default 'draft',
    metadata jsonb not null default '{}'::jsonb,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint intelligence_data_sources_key_not_blank check (
        length(trim(source_key)) > 0
    ),
    constraint intelligence_data_sources_name_not_blank check (
        length(trim(source_name)) > 0
    ),
    constraint intelligence_data_sources_owner_not_blank check (
        length(trim(source_owner)) > 0
    ),
    constraint intelligence_data_sources_primary_url_format check (
        primary_url is null or primary_url ~* '^https?://'
    ),
    constraint intelligence_data_sources_terms_url_format check (
        terms_url is null or terms_url ~* '^https?://'
    ),
    constraint intelligence_data_sources_repo_url_format check (
        parser_repository_url is null
        or parser_repository_url ~* '^https?://'
    ),
    constraint intelligence_data_sources_stale_positive check (
        stale_after_hours is null or stale_after_hours > 0
    ),
    constraint intelligence_data_sources_quality_score check (
        quality_score between 0 and 100
    ),
    constraint intelligence_data_sources_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create unique index if not exists intelligence_data_sources_key_idx
on public.intelligence_data_sources (lower(source_key));

create index if not exists intelligence_data_sources_review_idx
on public.intelligence_data_sources (
    analyst_review_state,
    license_status,
    health_status,
    updated_at desc
);

create index if not exists intelligence_data_sources_refresh_idx
on public.intelligence_data_sources (
    health_status,
    next_refresh_at nulls first,
    last_success_at desc nulls last
)
where health_status not in ('retired', 'paused');

drop trigger if exists set_intelligence_data_sources_updated_at
on public.intelligence_data_sources;
create trigger set_intelligence_data_sources_updated_at
before update on public.intelligence_data_sources
for each row execute function public.set_updated_at();

create table if not exists public.intelligence_source_citation_requirements (
    id uuid primary key default gen_random_uuid(),
    data_source_id uuid not null
        references public.intelligence_data_sources(id) on delete cascade,
    requirement_key text not null,
    display_label text not null,
    is_required boolean not null default true,
    guidance text,
    example_value text,
    display_order integer not null default 100,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint intelligence_source_citation_req_key_not_blank check (
        length(trim(requirement_key)) > 0
    ),
    constraint intelligence_source_citation_req_label_not_blank check (
        length(trim(display_label)) > 0
    ),
    constraint intelligence_source_citation_req_order_nonnegative check (
        display_order >= 0
    )
);

create unique index if not exists intelligence_source_citation_req_key_idx
on public.intelligence_source_citation_requirements (
    data_source_id,
    lower(requirement_key)
);

create index if not exists intelligence_source_citation_req_source_idx
on public.intelligence_source_citation_requirements (
    data_source_id,
    display_order
);

drop trigger if exists set_intelligence_source_citation_req_updated_at
on public.intelligence_source_citation_requirements;
create trigger set_intelligence_source_citation_req_updated_at
before update on public.intelligence_source_citation_requirements
for each row execute function public.set_updated_at();

create table if not exists public.intelligence_source_parser_runs (
    id uuid primary key default gen_random_uuid(),
    data_source_id uuid not null
        references public.intelligence_data_sources(id) on delete cascade,
    parser_key text not null,
    job_name text,
    job_status public.data_source_job_status not null default 'queued',
    started_at timestamptz,
    finished_at timestamptz,
    records_seen integer not null default 0,
    records_created integer not null default 0,
    records_updated integer not null default 0,
    records_failed integer not null default 0,
    error_message text,
    run_metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint intelligence_source_parser_runs_key_not_blank check (
        length(trim(parser_key)) > 0
    ),
    constraint intelligence_source_parser_runs_counts_nonnegative check (
        records_seen >= 0
        and records_created >= 0
        and records_updated >= 0
        and records_failed >= 0
    ),
    constraint intelligence_source_parser_runs_time_order check (
        finished_at is null
        or started_at is null
        or finished_at >= started_at
    ),
    constraint intelligence_source_parser_runs_metadata_object check (
        jsonb_typeof(run_metadata) = 'object'
    )
);

create index if not exists intelligence_source_parser_runs_source_idx
on public.intelligence_source_parser_runs (
    data_source_id,
    created_at desc
);

create index if not exists intelligence_source_parser_runs_status_idx
on public.intelligence_source_parser_runs (
    job_status,
    started_at desc nulls last
);

create table if not exists public.intelligence_source_health_checks (
    id uuid primary key default gen_random_uuid(),
    data_source_id uuid not null
        references public.intelligence_data_sources(id) on delete cascade,
    health_status public.data_source_health_status not null default 'unknown',
    checked_at timestamptz not null default now(),
    freshness_at timestamptz,
    freshness_lag_hours numeric(10, 2),
    response_ms integer,
    observed_record_count integer,
    issue_summary text,
    checked_by uuid references auth.users(id) on delete set null,
    metadata jsonb not null default '{}'::jsonb,
    constraint intelligence_source_health_lag_nonnegative check (
        freshness_lag_hours is null or freshness_lag_hours >= 0
    ),
    constraint intelligence_source_health_response_nonnegative check (
        response_ms is null or response_ms >= 0
    ),
    constraint intelligence_source_health_record_count_nonnegative check (
        observed_record_count is null or observed_record_count >= 0
    ),
    constraint intelligence_source_health_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create index if not exists intelligence_source_health_checks_source_idx
on public.intelligence_source_health_checks (
    data_source_id,
    checked_at desc
);

create table if not exists public.intelligence_source_quality_reviews (
    id uuid primary key default gen_random_uuid(),
    data_source_id uuid not null
        references public.intelligence_data_sources(id) on delete cascade,
    review_state public.data_source_analyst_review_state not null
        default 'in_review',
    quality_score numeric(5, 2) not null,
    confidence_label public.data_source_confidence_label not null
        default 'experimental',
    coverage_score numeric(5, 2),
    accuracy_score numeric(5, 2),
    timeliness_score numeric(5, 2),
    citation_score numeric(5, 2),
    review_notes text,
    reviewed_by uuid references auth.users(id) on delete set null,
    reviewed_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    constraint intelligence_source_quality_score_range check (
        quality_score between 0 and 100
        and (coverage_score is null or coverage_score between 0 and 100)
        and (accuracy_score is null or accuracy_score between 0 and 100)
        and (timeliness_score is null or timeliness_score between 0 and 100)
        and (citation_score is null or citation_score between 0 and 100)
    )
);

create index if not exists intelligence_source_quality_reviews_source_idx
on public.intelligence_source_quality_reviews (
    data_source_id,
    reviewed_at desc
);

create table if not exists public.intelligence_source_registry_links (
    id uuid primary key default gen_random_uuid(),
    data_source_id uuid not null
        references public.intelligence_data_sources(id) on delete cascade,
    source_kind public.intelligence_search_record_kind not null,
    source_table text,
    source_record_id uuid,
    source_slug text,
    route_path text,
    citation_text text,
    freshness_at timestamptz,
    confidence_label public.data_source_confidence_label not null
        default 'experimental',
    quality_score numeric(5, 2) not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint intelligence_source_registry_links_target_check check (
        source_record_id is not null
        or source_slug is not null
        or route_path is not null
    ),
    constraint intelligence_source_registry_links_source_table_not_blank check (
        source_table is null or length(trim(source_table)) > 0
    ),
    constraint intelligence_source_registry_links_slug_not_blank check (
        source_slug is null or length(trim(source_slug)) > 0
    ),
    constraint intelligence_source_registry_links_route_format check (
        route_path is null
        or route_path ~ '^/'
        or route_path ~* '^https?://'
    ),
    constraint intelligence_source_registry_links_quality_score check (
        quality_score between 0 and 100
    )
);

create unique index if not exists intelligence_source_registry_links_key_idx
on public.intelligence_source_registry_links (
    data_source_id,
    source_kind,
    coalesce(source_table, ''),
    coalesce(source_record_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(lower(source_slug), ''),
    coalesce(route_path, '')
);

create index if not exists intelligence_source_registry_links_source_idx
on public.intelligence_source_registry_links (
    data_source_id,
    freshness_at desc nulls last
);

drop trigger if exists set_intelligence_source_registry_links_updated_at
on public.intelligence_source_registry_links;
create trigger set_intelligence_source_registry_links_updated_at
before update on public.intelligence_source_registry_links
for each row execute function public.set_updated_at();

create or replace function app_private.can_manage_data_sources()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select app_private.has_any_role(array['editor', 'analyst', 'admin']);
$$;

grant execute on function app_private.can_manage_data_sources()
to authenticated;

alter table public.intelligence_data_sources enable row level security;
alter table public.intelligence_source_citation_requirements
    enable row level security;
alter table public.intelligence_source_parser_runs enable row level security;
alter table public.intelligence_source_health_checks enable row level security;
alter table public.intelligence_source_quality_reviews enable row level security;
alter table public.intelligence_source_registry_links enable row level security;

grant select on
    public.intelligence_data_sources,
    public.intelligence_source_citation_requirements,
    public.intelligence_source_parser_runs,
    public.intelligence_source_health_checks,
    public.intelligence_source_quality_reviews,
    public.intelligence_source_registry_links
to authenticated;

grant insert, update, delete on
    public.intelligence_data_sources,
    public.intelligence_source_citation_requirements,
    public.intelligence_source_parser_runs,
    public.intelligence_source_health_checks,
    public.intelligence_source_quality_reviews,
    public.intelligence_source_registry_links
to authenticated;

grant all on
    public.intelligence_data_sources,
    public.intelligence_source_citation_requirements,
    public.intelligence_source_parser_runs,
    public.intelligence_source_health_checks,
    public.intelligence_source_quality_reviews,
    public.intelligence_source_registry_links
to service_role;

drop policy if exists "intelligence_data_sources_manage_staff"
on public.intelligence_data_sources;
create policy "intelligence_data_sources_manage_staff"
on public.intelligence_data_sources
for all
to authenticated
using (app_private.can_manage_data_sources())
with check (app_private.can_manage_data_sources());

drop policy if exists "intelligence_source_citation_req_manage_staff"
on public.intelligence_source_citation_requirements;
create policy "intelligence_source_citation_req_manage_staff"
on public.intelligence_source_citation_requirements
for all
to authenticated
using (app_private.can_manage_data_sources())
with check (app_private.can_manage_data_sources());

drop policy if exists "intelligence_source_parser_runs_manage_staff"
on public.intelligence_source_parser_runs;
create policy "intelligence_source_parser_runs_manage_staff"
on public.intelligence_source_parser_runs
for all
to authenticated
using (app_private.can_manage_data_sources())
with check (app_private.can_manage_data_sources());

drop policy if exists "intelligence_source_health_checks_manage_staff"
on public.intelligence_source_health_checks;
create policy "intelligence_source_health_checks_manage_staff"
on public.intelligence_source_health_checks
for all
to authenticated
using (app_private.can_manage_data_sources())
with check (app_private.can_manage_data_sources());

drop policy if exists "intelligence_source_quality_reviews_manage_staff"
on public.intelligence_source_quality_reviews;
create policy "intelligence_source_quality_reviews_manage_staff"
on public.intelligence_source_quality_reviews
for all
to authenticated
using (app_private.can_manage_data_sources())
with check (app_private.can_manage_data_sources());

drop policy if exists "intelligence_source_registry_links_manage_staff"
on public.intelligence_source_registry_links;
create policy "intelligence_source_registry_links_manage_staff"
on public.intelligence_source_registry_links
for all
to authenticated
using (app_private.can_manage_data_sources())
with check (app_private.can_manage_data_sources());
