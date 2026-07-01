do $$
begin
    create type public.data_market_request_status as enum (
        'draft',
        'open',
        'matched',
        'fulfilled',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.data_market_offer_status as enum (
        'draft',
        'available',
        'matched',
        'fulfilled',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.data_market_review_status as enum (
        'queued',
        'needs_review',
        'approved',
        'rejected',
        'expired'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.data_market_confidence_label as enum (
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
    create type public.data_market_extraction_status as enum (
        'queued',
        'running',
        'completed',
        'failed',
        'cancelled'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.data_market_extraction_runs (
    id uuid primary key default gen_random_uuid(),
    run_key text not null,
    pipeline_name text not null,
    source_type text not null default 'unknown',
    source_url text,
    status public.data_market_extraction_status not null default 'queued',
    started_at timestamptz,
    completed_at timestamptz,
    input_summary text,
    model_name text,
    prompt_version text,
    extractor_version text,
    records_found integer not null default 0,
    data_requests_created integer not null default 0,
    data_offers_created integer not null default 0,
    confidence_label public.data_market_confidence_label not null
        default 'experimental',
    rationale text,
    error_message text,
    metadata jsonb not null default '{}'::jsonb,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint data_market_extraction_runs_key_not_blank check (
        length(trim(run_key)) > 0
    ),
    constraint data_market_extraction_runs_pipeline_not_blank check (
        length(trim(pipeline_name)) > 0
    ),
    constraint data_market_extraction_runs_source_type_not_blank check (
        length(trim(source_type)) > 0
    ),
    constraint data_market_extraction_runs_url_format check (
        source_url is null
        or source_url ~* '^https?://'
    ),
    constraint data_market_extraction_runs_completed_after_started check (
        started_at is null
        or completed_at is null
        or completed_at >= started_at
    ),
    constraint data_market_extraction_runs_counts_nonnegative check (
        records_found >= 0
        and data_requests_created >= 0
        and data_offers_created >= 0
    ),
    constraint data_market_extraction_runs_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create unique index if not exists data_market_extraction_runs_key
on public.data_market_extraction_runs (lower(run_key));

create index if not exists data_market_extraction_runs_status_created_idx
on public.data_market_extraction_runs (status, created_at desc);

drop trigger if exists set_data_market_extraction_runs_updated_at
on public.data_market_extraction_runs;
create trigger set_data_market_extraction_runs_updated_at
before update on public.data_market_extraction_runs
for each row execute function public.set_updated_at();

create table if not exists public.data_market_source_documents (
    id uuid primary key default gen_random_uuid(),
    extraction_run_id uuid
        references public.data_market_extraction_runs(id)
        on delete set null,
    source_key text not null,
    title text not null,
    publisher text,
    document_type text not null default 'source',
    url text,
    published_at date,
    retrieved_at timestamptz,
    citation_text text,
    summary text,
    license_notes text,
    access_tier_required public.membership_tier not null default 'scout',
    review_status public.data_market_review_status not null default 'queued',
    confidence_label public.data_market_confidence_label not null
        default 'experimental',
    metadata jsonb not null default '{}'::jsonb,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint data_market_source_documents_key_not_blank check (
        length(trim(source_key)) > 0
    ),
    constraint data_market_source_documents_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint data_market_source_documents_type_not_blank check (
        length(trim(document_type)) > 0
    ),
    constraint data_market_source_documents_url_format check (
        url is null
        or url ~* '^https?://'
    ),
    constraint data_market_source_documents_paid_tier check (
        access_tier_required in ('scout', 'command')
    ),
    constraint data_market_source_documents_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create unique index if not exists data_market_source_documents_key
on public.data_market_source_documents (lower(source_key));

create index if not exists data_market_source_documents_review_idx
on public.data_market_source_documents (
    review_status,
    access_tier_required,
    confidence_label,
    updated_at desc
);

drop trigger if exists set_data_market_source_documents_updated_at
on public.data_market_source_documents;
create trigger set_data_market_source_documents_updated_at
before update on public.data_market_source_documents
for each row execute function public.set_updated_at();

create table if not exists public.data_market_data_requests (
    id uuid primary key default gen_random_uuid(),
    extraction_run_id uuid
        references public.data_market_extraction_runs(id)
        on delete set null,
    primary_source_document_id uuid
        references public.data_market_source_documents(id)
        on delete set null,
    slug text not null,
    title text not null,
    request_summary text not null,
    requester_name text,
    requester_organization text,
    status public.data_market_request_status not null default 'draft',
    access_tier_required public.membership_tier not null default 'scout',
    review_status public.data_market_review_status not null default 'queued',
    confidence_label public.data_market_confidence_label not null
        default 'experimental',
    confidence_score numeric(5, 2) not null default 0,
    extraction_rationale text,
    analyst_notes text,
    data_type text,
    requested_format text,
    mission_name text,
    mission_phase text,
    lunar_region text,
    location_name text,
    instrument_name text,
    needed_by date,
    priority_score integer not null default 0,
    published_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint data_market_data_requests_slug_not_blank check (
        length(trim(slug)) > 0
    ),
    constraint data_market_data_requests_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint data_market_data_requests_summary_not_blank check (
        length(trim(request_summary)) > 0
    ),
    constraint data_market_data_requests_confidence_score check (
        confidence_score between 0 and 100
    ),
    constraint data_market_data_requests_priority_score check (
        priority_score between 0 and 100
    ),
    constraint data_market_data_requests_paid_tier check (
        access_tier_required in ('scout', 'command')
    ),
    constraint data_market_data_requests_published_reviewed check (
        status not in ('open', 'matched', 'fulfilled')
        or (
            published_at is not null
            and review_status = 'approved'
        )
    ),
    constraint data_market_data_requests_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create unique index if not exists data_market_data_requests_slug_key
on public.data_market_data_requests (lower(slug));

create index if not exists data_market_data_requests_status_idx
on public.data_market_data_requests (
    status,
    review_status,
    access_tier_required,
    published_at desc
);

create index if not exists data_market_data_requests_mission_idx
on public.data_market_data_requests (
    mission_name,
    lunar_region,
    instrument_name
);

drop trigger if exists set_data_market_data_requests_updated_at
on public.data_market_data_requests;
create trigger set_data_market_data_requests_updated_at
before update on public.data_market_data_requests
for each row execute function public.set_updated_at();

create table if not exists public.data_market_data_offers (
    id uuid primary key default gen_random_uuid(),
    extraction_run_id uuid
        references public.data_market_extraction_runs(id)
        on delete set null,
    primary_source_document_id uuid
        references public.data_market_source_documents(id)
        on delete set null,
    slug text not null,
    title text not null,
    offer_summary text not null,
    provider_name text,
    provider_organization text,
    status public.data_market_offer_status not null default 'draft',
    access_tier_required public.membership_tier not null default 'scout',
    review_status public.data_market_review_status not null default 'queued',
    confidence_label public.data_market_confidence_label not null
        default 'experimental',
    confidence_score numeric(5, 2) not null default 0,
    extraction_rationale text,
    analyst_notes text,
    data_type text,
    delivery_mode text,
    availability_state text,
    mission_name text,
    mission_phase text,
    lunar_region text,
    location_name text,
    instrument_name text,
    coverage_start_at timestamptz,
    coverage_end_at timestamptz,
    sample_url text,
    published_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint data_market_data_offers_slug_not_blank check (
        length(trim(slug)) > 0
    ),
    constraint data_market_data_offers_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint data_market_data_offers_summary_not_blank check (
        length(trim(offer_summary)) > 0
    ),
    constraint data_market_data_offers_confidence_score check (
        confidence_score between 0 and 100
    ),
    constraint data_market_data_offers_paid_tier check (
        access_tier_required in ('scout', 'command')
    ),
    constraint data_market_data_offers_sample_url_format check (
        sample_url is null
        or sample_url ~* '^https?://'
    ),
    constraint data_market_data_offers_coverage_range check (
        coverage_start_at is null
        or coverage_end_at is null
        or coverage_end_at >= coverage_start_at
    ),
    constraint data_market_data_offers_published_reviewed check (
        status not in ('available', 'matched', 'fulfilled')
        or (
            published_at is not null
            and review_status = 'approved'
        )
    ),
    constraint data_market_data_offers_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create unique index if not exists data_market_data_offers_slug_key
on public.data_market_data_offers (lower(slug));

create index if not exists data_market_data_offers_status_idx
on public.data_market_data_offers (
    status,
    review_status,
    access_tier_required,
    published_at desc
);

create index if not exists data_market_data_offers_mission_idx
on public.data_market_data_offers (
    mission_name,
    lunar_region,
    instrument_name
);

drop trigger if exists set_data_market_data_offers_updated_at
on public.data_market_data_offers;
create trigger set_data_market_data_offers_updated_at
before update on public.data_market_data_offers
for each row execute function public.set_updated_at();

create table if not exists public.data_market_request_sources (
    id uuid primary key default gen_random_uuid(),
    data_request_id uuid not null
        references public.data_market_data_requests(id)
        on delete cascade,
    source_document_id uuid not null
        references public.data_market_source_documents(id)
        on delete cascade,
    relationship_type text not null default 'extracted_from',
    page_reference text,
    rationale text,
    confidence_label public.data_market_confidence_label not null
        default 'experimental',
    display_order integer not null default 100,
    created_at timestamptz not null default now(),
    constraint data_market_request_sources_type_not_blank check (
        length(trim(relationship_type)) > 0
    ),
    constraint data_market_request_sources_display_order check (
        display_order >= 0
    )
);

create unique index if not exists data_market_request_sources_key
on public.data_market_request_sources (
    data_request_id,
    source_document_id,
    lower(relationship_type)
);

create index if not exists data_market_request_sources_source_idx
on public.data_market_request_sources (source_document_id, display_order);

create table if not exists public.data_market_offer_sources (
    id uuid primary key default gen_random_uuid(),
    data_offer_id uuid not null
        references public.data_market_data_offers(id)
        on delete cascade,
    source_document_id uuid not null
        references public.data_market_source_documents(id)
        on delete cascade,
    relationship_type text not null default 'extracted_from',
    page_reference text,
    rationale text,
    confidence_label public.data_market_confidence_label not null
        default 'experimental',
    display_order integer not null default 100,
    created_at timestamptz not null default now(),
    constraint data_market_offer_sources_type_not_blank check (
        length(trim(relationship_type)) > 0
    ),
    constraint data_market_offer_sources_display_order check (
        display_order >= 0
    )
);

create unique index if not exists data_market_offer_sources_key
on public.data_market_offer_sources (
    data_offer_id,
    source_document_id,
    lower(relationship_type)
);

create index if not exists data_market_offer_sources_source_idx
on public.data_market_offer_sources (source_document_id, display_order);

create table if not exists public.data_market_audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_user_id uuid references auth.users(id) on delete set null,
    extraction_run_id uuid
        references public.data_market_extraction_runs(id)
        on delete set null,
    source_document_id uuid
        references public.data_market_source_documents(id)
        on delete set null,
    data_request_id uuid
        references public.data_market_data_requests(id)
        on delete set null,
    data_offer_id uuid
        references public.data_market_data_offers(id)
        on delete set null,
    event_type text not null,
    event_summary text not null,
    before_state jsonb,
    after_state jsonb,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint data_market_audit_logs_type_not_blank check (
        length(trim(event_type)) > 0
    ),
    constraint data_market_audit_logs_summary_not_blank check (
        length(trim(event_summary)) > 0
    ),
    constraint data_market_audit_logs_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create index if not exists data_market_audit_logs_run_created_idx
on public.data_market_audit_logs (extraction_run_id, created_at desc);

create index if not exists data_market_audit_logs_request_created_idx
on public.data_market_audit_logs (data_request_id, created_at desc);

create index if not exists data_market_audit_logs_offer_created_idx
on public.data_market_audit_logs (data_offer_id, created_at desc);

alter table public.data_market_extraction_runs enable row level security;
alter table public.data_market_source_documents enable row level security;
alter table public.data_market_data_requests enable row level security;
alter table public.data_market_data_offers enable row level security;
alter table public.data_market_request_sources enable row level security;
alter table public.data_market_offer_sources enable row level security;
alter table public.data_market_audit_logs enable row level security;

revoke all on
    public.data_market_extraction_runs,
    public.data_market_source_documents,
    public.data_market_data_requests,
    public.data_market_data_offers,
    public.data_market_request_sources,
    public.data_market_offer_sources,
    public.data_market_audit_logs
from anon;

grant select, insert, update, delete on
    public.data_market_extraction_runs,
    public.data_market_source_documents,
    public.data_market_data_requests,
    public.data_market_data_offers,
    public.data_market_request_sources,
    public.data_market_offer_sources,
    public.data_market_audit_logs
to authenticated;

grant all on
    public.data_market_extraction_runs,
    public.data_market_source_documents,
    public.data_market_data_requests,
    public.data_market_data_offers,
    public.data_market_request_sources,
    public.data_market_offer_sources,
    public.data_market_audit_logs
to service_role;

drop policy if exists "data_market_extraction_runs_select_staff"
on public.data_market_extraction_runs;
create policy "data_market_extraction_runs_select_staff"
on public.data_market_extraction_runs
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "data_market_extraction_runs_manage_staff"
on public.data_market_extraction_runs;
create policy "data_market_extraction_runs_manage_staff"
on public.data_market_extraction_runs
for all
to authenticated
using (app_private.has_any_role(array['analyst', 'admin']))
with check (app_private.has_any_role(array['analyst', 'admin']));

drop policy if exists "data_market_source_documents_select_paid"
on public.data_market_source_documents;
create policy "data_market_source_documents_select_paid"
on public.data_market_source_documents
for select
to authenticated
using (
    review_status = 'approved'
    and (
        (
            access_tier_required = 'scout'
            and app_private.has_any_role(array['scout', 'command_user'])
        )
        or (
            access_tier_required = 'command'
            and app_private.has_any_role(array['command_user'])
        )
    )
);

drop policy if exists "data_market_source_documents_select_staff"
on public.data_market_source_documents;
create policy "data_market_source_documents_select_staff"
on public.data_market_source_documents
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "data_market_source_documents_manage_staff"
on public.data_market_source_documents;
create policy "data_market_source_documents_manage_staff"
on public.data_market_source_documents
for all
to authenticated
using (app_private.has_any_role(array['analyst', 'admin']))
with check (app_private.has_any_role(array['analyst', 'admin']));

drop policy if exists "data_market_data_requests_select_paid"
on public.data_market_data_requests;
create policy "data_market_data_requests_select_paid"
on public.data_market_data_requests
for select
to authenticated
using (
    review_status = 'approved'
    and status in ('open', 'matched', 'fulfilled')
    and published_at is not null
    and published_at <= now()
    and (
        (
            access_tier_required = 'scout'
            and app_private.has_any_role(array['scout', 'command_user'])
        )
        or (
            access_tier_required = 'command'
            and app_private.has_any_role(array['command_user'])
        )
    )
);

drop policy if exists "data_market_data_requests_select_staff"
on public.data_market_data_requests;
create policy "data_market_data_requests_select_staff"
on public.data_market_data_requests
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "data_market_data_requests_manage_staff"
on public.data_market_data_requests;
create policy "data_market_data_requests_manage_staff"
on public.data_market_data_requests
for all
to authenticated
using (app_private.has_any_role(array['analyst', 'admin']))
with check (app_private.has_any_role(array['analyst', 'admin']));

drop policy if exists "data_market_data_offers_select_paid"
on public.data_market_data_offers;
create policy "data_market_data_offers_select_paid"
on public.data_market_data_offers
for select
to authenticated
using (
    review_status = 'approved'
    and status in ('available', 'matched', 'fulfilled')
    and published_at is not null
    and published_at <= now()
    and (
        (
            access_tier_required = 'scout'
            and app_private.has_any_role(array['scout', 'command_user'])
        )
        or (
            access_tier_required = 'command'
            and app_private.has_any_role(array['command_user'])
        )
    )
);

drop policy if exists "data_market_data_offers_select_staff"
on public.data_market_data_offers;
create policy "data_market_data_offers_select_staff"
on public.data_market_data_offers
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "data_market_data_offers_manage_staff"
on public.data_market_data_offers;
create policy "data_market_data_offers_manage_staff"
on public.data_market_data_offers
for all
to authenticated
using (app_private.has_any_role(array['analyst', 'admin']))
with check (app_private.has_any_role(array['analyst', 'admin']));

drop policy if exists "data_market_request_sources_select_paid"
on public.data_market_request_sources;
create policy "data_market_request_sources_select_paid"
on public.data_market_request_sources
for select
to authenticated
using (
    exists (
        select 1
        from public.data_market_data_requests data_request
        join public.data_market_source_documents source_document
            on source_document.id =
                data_market_request_sources.source_document_id
        where data_request.id = data_market_request_sources.data_request_id
            and source_document.review_status = 'approved'
            and data_request.review_status = 'approved'
            and data_request.status in ('open', 'matched', 'fulfilled')
            and data_request.published_at is not null
            and data_request.published_at <= now()
            and (
                (
                    data_request.access_tier_required = 'scout'
                    and app_private.has_any_role(
                        array['scout', 'command_user']
                    )
                )
                or (
                    data_request.access_tier_required = 'command'
                    and app_private.has_any_role(array['command_user'])
                )
            )
    )
);

drop policy if exists "data_market_request_sources_select_staff"
on public.data_market_request_sources;
create policy "data_market_request_sources_select_staff"
on public.data_market_request_sources
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "data_market_request_sources_manage_staff"
on public.data_market_request_sources;
create policy "data_market_request_sources_manage_staff"
on public.data_market_request_sources
for all
to authenticated
using (app_private.has_any_role(array['analyst', 'admin']))
with check (app_private.has_any_role(array['analyst', 'admin']));

drop policy if exists "data_market_offer_sources_select_paid"
on public.data_market_offer_sources;
create policy "data_market_offer_sources_select_paid"
on public.data_market_offer_sources
for select
to authenticated
using (
    exists (
        select 1
        from public.data_market_data_offers data_offer
        join public.data_market_source_documents source_document
            on source_document.id =
                data_market_offer_sources.source_document_id
        where data_offer.id = data_market_offer_sources.data_offer_id
            and source_document.review_status = 'approved'
            and data_offer.review_status = 'approved'
            and data_offer.status in ('available', 'matched', 'fulfilled')
            and data_offer.published_at is not null
            and data_offer.published_at <= now()
            and (
                (
                    data_offer.access_tier_required = 'scout'
                    and app_private.has_any_role(
                        array['scout', 'command_user']
                    )
                )
                or (
                    data_offer.access_tier_required = 'command'
                    and app_private.has_any_role(array['command_user'])
                )
            )
    )
);

drop policy if exists "data_market_offer_sources_select_staff"
on public.data_market_offer_sources;
create policy "data_market_offer_sources_select_staff"
on public.data_market_offer_sources
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "data_market_offer_sources_manage_staff"
on public.data_market_offer_sources;
create policy "data_market_offer_sources_manage_staff"
on public.data_market_offer_sources
for all
to authenticated
using (app_private.has_any_role(array['analyst', 'admin']))
with check (app_private.has_any_role(array['analyst', 'admin']));

drop policy if exists "data_market_audit_logs_select_staff"
on public.data_market_audit_logs;
create policy "data_market_audit_logs_select_staff"
on public.data_market_audit_logs
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "data_market_audit_logs_manage_staff"
on public.data_market_audit_logs;
create policy "data_market_audit_logs_manage_staff"
on public.data_market_audit_logs
for all
to authenticated
using (app_private.has_any_role(array['analyst', 'admin']))
with check (app_private.has_any_role(array['analyst', 'admin']));
