do $$
begin
    create type public.lunar_intel_publication_status as enum (
        'draft',
        'review',
        'published',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_intel_visibility_tier as enum (
        'public',
        'member',
        'scout',
        'command'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_intel_confidence_label as enum (
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
    create type public.lunar_procurement_status as enum (
        'forecast',
        'draft',
        'open',
        'questions_due',
        'responses_due',
        'evaluation',
        'awarded',
        'cancelled',
        'closed'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_procurement_kind as enum (
        'solicitation',
        'award',
        'rfi',
        'sources_sought',
        'baa',
        'sbir',
        'sttr',
        'ota',
        'grant',
        'prize',
        'contract_vehicle',
        'other'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_regulatory_status as enum (
        'monitoring',
        'filed',
        'open_for_comment',
        'comment_closed',
        'under_review',
        'issued',
        'effective',
        'withdrawn',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_regulatory_kind as enum (
        'filing',
        'rulemaking',
        'license',
        'permit',
        'advisory',
        'policy',
        'guidance',
        'notice',
        'comment_period',
        'compliance_note',
        'other'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_intel_source_review_status as enum (
        'queued',
        'reviewed',
        'licensed',
        'restricted',
        'rejected'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.lunar_intel_agencies (
    id uuid primary key default gen_random_uuid(),
    slug text not null,
    name text not null,
    acronym text,
    country_code text,
    agency_type text not null default 'government',
    website_url text,
    summary text not null default '',
    publication_status public.lunar_intel_publication_status not null
        default 'draft',
    visibility_tier public.lunar_intel_visibility_tier not null default 'public',
    confidence_label public.lunar_intel_confidence_label not null default 'medium',
    freshness_at timestamptz,
    last_source_at timestamptz,
    analyst_reviewed_at timestamptz,
    analyst_reviewed_by uuid references auth.users(id) on delete set null,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_intel_agencies_slug_not_blank check (length(trim(slug)) > 0),
    constraint lunar_intel_agencies_name_not_blank check (length(trim(name)) > 0),
    constraint lunar_intel_agencies_url_format check (
        website_url is null
        or website_url ~* '^https?://'
    )
);

create unique index if not exists lunar_intel_agencies_slug_key
on public.lunar_intel_agencies (lower(slug));

create index if not exists lunar_intel_agencies_public_idx
on public.lunar_intel_agencies (
    publication_status,
    visibility_tier,
    name
);

drop trigger if exists set_lunar_intel_agencies_updated_at
on public.lunar_intel_agencies;
create trigger set_lunar_intel_agencies_updated_at
before update on public.lunar_intel_agencies
for each row execute function public.set_updated_at();

create table if not exists public.lunar_procurements (
    id uuid primary key default gen_random_uuid(),
    slug text not null,
    title text not null,
    procurement_kind public.lunar_procurement_kind not null,
    status public.lunar_procurement_status not null default 'forecast',
    agency_id uuid references public.lunar_intel_agencies(id) on delete set null,
    external_reference text,
    solicitation_number text,
    notice_id text,
    program_name text,
    lunar_relevance text not null default '',
    opportunity_summary text not null default '',
    eligibility_summary text,
    place_of_performance text,
    naics_code text,
    psc_code text,
    set_aside text,
    estimated_value numeric(16, 2),
    currency_code text not null default 'USD',
    posted_at timestamptz,
    questions_due_at timestamptz,
    response_due_at timestamptz,
    award_expected_at timestamptz,
    source_url text,
    publication_status public.lunar_intel_publication_status not null
        default 'draft',
    visibility_tier public.lunar_intel_visibility_tier not null default 'scout',
    confidence_label public.lunar_intel_confidence_label not null default 'medium',
    quality_score numeric(5, 2) not null default 0,
    analyst_review_state text not null default 'queued',
    freshness_at timestamptz,
    last_source_at timestamptz,
    analyst_reviewed_at timestamptz,
    analyst_reviewed_by uuid references auth.users(id) on delete set null,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_procurements_slug_not_blank check (length(trim(slug)) > 0),
    constraint lunar_procurements_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint lunar_procurements_currency_format check (
        currency_code ~ '^[A-Z]{3}$'
    ),
    constraint lunar_procurements_estimated_value_nonnegative check (
        estimated_value is null
        or estimated_value >= 0
    ),
    constraint lunar_procurements_quality_score check (
        quality_score between 0 and 100
    ),
    constraint lunar_procurements_source_url_format check (
        source_url is null
        or source_url ~* '^https?://'
    )
);

create unique index if not exists lunar_procurements_slug_key
on public.lunar_procurements (lower(slug));

create index if not exists lunar_procurements_due_status_idx
on public.lunar_procurements (
    status,
    response_due_at asc nulls last,
    questions_due_at asc nulls last
);

create index if not exists lunar_procurements_kind_review_idx
on public.lunar_procurements (
    procurement_kind,
    analyst_review_state,
    freshness_at desc nulls last
);

create index if not exists lunar_procurements_agency_idx
on public.lunar_procurements (agency_id, status)
where agency_id is not null;

drop trigger if exists set_lunar_procurements_updated_at
on public.lunar_procurements;
create trigger set_lunar_procurements_updated_at
before update on public.lunar_procurements
for each row execute function public.set_updated_at();

create table if not exists public.lunar_procurement_awards (
    id uuid primary key default gen_random_uuid(),
    procurement_id uuid not null references public.lunar_procurements(id)
        on delete cascade,
    award_number text,
    recipient_name text not null,
    recipient_uei text,
    award_type text,
    award_status text not null default 'announced',
    awarded_at timestamptz,
    period_start_at timestamptz,
    period_end_at timestamptz,
    obligated_value numeric(16, 2),
    ceiling_value numeric(16, 2),
    currency_code text not null default 'USD',
    sbir_sttr_phase text,
    lunar_scope_note text not null default '',
    source_url text,
    publication_status public.lunar_intel_publication_status not null
        default 'draft',
    visibility_tier public.lunar_intel_visibility_tier not null default 'scout',
    confidence_label public.lunar_intel_confidence_label not null default 'medium',
    analyst_review_state text not null default 'queued',
    freshness_at timestamptz,
    last_source_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_procurement_awards_recipient_not_blank check (
        length(trim(recipient_name)) > 0
    ),
    constraint lunar_procurement_awards_currency_format check (
        currency_code ~ '^[A-Z]{3}$'
    ),
    constraint lunar_procurement_awards_value_nonnegative check (
        (obligated_value is null or obligated_value >= 0)
        and (ceiling_value is null or ceiling_value >= 0)
    ),
    constraint lunar_procurement_awards_source_url_format check (
        source_url is null
        or source_url ~* '^https?://'
    )
);

create index if not exists lunar_procurement_awards_procurement_idx
on public.lunar_procurement_awards (procurement_id, awarded_at desc nulls last);

create index if not exists lunar_procurement_awards_recipient_idx
on public.lunar_procurement_awards (recipient_name, award_status);

drop trigger if exists set_lunar_procurement_awards_updated_at
on public.lunar_procurement_awards;
create trigger set_lunar_procurement_awards_updated_at
before update on public.lunar_procurement_awards
for each row execute function public.set_updated_at();

create table if not exists public.lunar_regulatory_records (
    id uuid primary key default gen_random_uuid(),
    slug text not null,
    title text not null,
    regulatory_kind public.lunar_regulatory_kind not null,
    status public.lunar_regulatory_status not null default 'monitoring',
    agency_id uuid references public.lunar_intel_agencies(id) on delete set null,
    docket_number text,
    filing_number text,
    jurisdiction text,
    affected_parties text[] not null default '{}'::text[],
    lunar_relevance text not null default '',
    public_summary text not null default '',
    compliance_guidance text,
    risk_note text,
    filed_at timestamptz,
    published_at timestamptz,
    comment_open_at timestamptz,
    comment_due_at timestamptz,
    effective_at timestamptz,
    source_url text,
    publication_status public.lunar_intel_publication_status not null
        default 'draft',
    visibility_tier public.lunar_intel_visibility_tier not null default 'scout',
    confidence_label public.lunar_intel_confidence_label not null default 'medium',
    risk_level text not null default 'monitor',
    analyst_review_state text not null default 'queued',
    freshness_at timestamptz,
    last_source_at timestamptz,
    analyst_reviewed_at timestamptz,
    analyst_reviewed_by uuid references auth.users(id) on delete set null,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_regulatory_records_slug_not_blank check (
        length(trim(slug)) > 0
    ),
    constraint lunar_regulatory_records_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint lunar_regulatory_records_comment_window check (
        comment_open_at is null
        or comment_due_at is null
        or comment_due_at >= comment_open_at
    ),
    constraint lunar_regulatory_records_source_url_format check (
        source_url is null
        or source_url ~* '^https?://'
    )
);

create unique index if not exists lunar_regulatory_records_slug_key
on public.lunar_regulatory_records (lower(slug));

create index if not exists lunar_regulatory_records_status_due_idx
on public.lunar_regulatory_records (
    status,
    comment_due_at asc nulls last,
    effective_at asc nulls last
);

create index if not exists lunar_regulatory_records_kind_review_idx
on public.lunar_regulatory_records (
    regulatory_kind,
    analyst_review_state,
    freshness_at desc nulls last
);

create index if not exists lunar_regulatory_records_agency_idx
on public.lunar_regulatory_records (agency_id, status)
where agency_id is not null;

drop trigger if exists set_lunar_regulatory_records_updated_at
on public.lunar_regulatory_records;
create trigger set_lunar_regulatory_records_updated_at
before update on public.lunar_regulatory_records
for each row execute function public.set_updated_at();

create table if not exists public.lunar_policy_milestones (
    id uuid primary key default gen_random_uuid(),
    regulatory_record_id uuid references public.lunar_regulatory_records(id)
        on delete cascade,
    agency_id uuid references public.lunar_intel_agencies(id) on delete set null,
    milestone_key text not null,
    milestone_title text not null,
    milestone_status text not null default 'planned',
    milestone_at timestamptz,
    summary text not null default '',
    compliance_note text,
    risk_note text,
    publication_status public.lunar_intel_publication_status not null
        default 'draft',
    visibility_tier public.lunar_intel_visibility_tier not null default 'scout',
    confidence_label public.lunar_intel_confidence_label not null default 'medium',
    analyst_review_state text not null default 'queued',
    freshness_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_policy_milestones_key_not_blank check (
        length(trim(milestone_key)) > 0
    ),
    constraint lunar_policy_milestones_title_not_blank check (
        length(trim(milestone_title)) > 0
    )
);

create index if not exists lunar_policy_milestones_record_idx
on public.lunar_policy_milestones (
    regulatory_record_id,
    milestone_at desc nulls last
)
where regulatory_record_id is not null;

create index if not exists lunar_policy_milestones_time_idx
on public.lunar_policy_milestones (
    milestone_status,
    milestone_at asc nulls last
);

drop trigger if exists set_lunar_policy_milestones_updated_at
on public.lunar_policy_milestones;
create trigger set_lunar_policy_milestones_updated_at
before update on public.lunar_policy_milestones
for each row execute function public.set_updated_at();

create table if not exists public.lunar_intel_source_citations (
    id uuid primary key default gen_random_uuid(),
    agency_id uuid references public.lunar_intel_agencies(id) on delete cascade,
    procurement_id uuid references public.lunar_procurements(id) on delete cascade,
    award_id uuid references public.lunar_procurement_awards(id)
        on delete cascade,
    regulatory_record_id uuid references public.lunar_regulatory_records(id)
        on delete cascade,
    policy_milestone_id uuid references public.lunar_policy_milestones(id)
        on delete cascade,
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
    review_status public.lunar_intel_source_review_status not null
        default 'queued',
    confidence_label public.lunar_intel_confidence_label not null default 'medium',
    display_order integer not null default 100,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_intel_source_citations_target check (
        agency_id is not null
        or procurement_id is not null
        or award_id is not null
        or regulatory_record_id is not null
        or policy_milestone_id is not null
    ),
    constraint lunar_intel_source_citations_source_not_blank check (
        length(trim(source_name)) > 0
    ),
    constraint lunar_intel_source_citations_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint lunar_intel_source_citations_url_format check (
        url is null
        or url ~* '^https?://'
    ),
    constraint lunar_intel_source_citations_display_order check (
        display_order >= 0
    )
);

create index if not exists lunar_intel_source_citations_procurement_idx
on public.lunar_intel_source_citations (procurement_id, display_order)
where procurement_id is not null;

create index if not exists lunar_intel_source_citations_regulatory_idx
on public.lunar_intel_source_citations (regulatory_record_id, display_order)
where regulatory_record_id is not null;

create index if not exists lunar_intel_source_citations_review_idx
on public.lunar_intel_source_citations (review_status, retrieved_at desc);

drop trigger if exists set_lunar_intel_source_citations_updated_at
on public.lunar_intel_source_citations;
create trigger set_lunar_intel_source_citations_updated_at
before update on public.lunar_intel_source_citations
for each row execute function public.set_updated_at();

create or replace function app_private.can_read_lunar_market_intel(
    target_tier public.lunar_intel_visibility_tier
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select target_tier = 'public'
        or (
            target_tier = 'member'
            and app_private.has_any_role(array[
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
        );
$$;

create or replace function app_private.can_manage_lunar_market_intel()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select app_private.has_any_role(array['editor', 'analyst', 'admin']);
$$;

alter table public.lunar_intel_agencies enable row level security;
alter table public.lunar_procurements enable row level security;
alter table public.lunar_procurement_awards enable row level security;
alter table public.lunar_regulatory_records enable row level security;
alter table public.lunar_policy_milestones enable row level security;
alter table public.lunar_intel_source_citations enable row level security;

grant select (
    id,
    slug,
    name,
    acronym,
    country_code,
    agency_type,
    website_url,
    summary,
    publication_status,
    visibility_tier,
    confidence_label,
    freshness_at,
    last_source_at,
    analyst_reviewed_at,
    updated_at
) on public.lunar_intel_agencies to anon, authenticated;

grant select (
    id,
    slug,
    title,
    procurement_kind,
    status,
    agency_id,
    external_reference,
    solicitation_number,
    notice_id,
    program_name,
    lunar_relevance,
    opportunity_summary,
    eligibility_summary,
    place_of_performance,
    naics_code,
    psc_code,
    set_aside,
    estimated_value,
    currency_code,
    posted_at,
    questions_due_at,
    response_due_at,
    award_expected_at,
    source_url,
    publication_status,
    visibility_tier,
    confidence_label,
    quality_score,
    analyst_review_state,
    freshness_at,
    last_source_at,
    analyst_reviewed_at,
    updated_at
) on public.lunar_procurements to anon, authenticated;

grant select (
    id,
    procurement_id,
    award_number,
    recipient_name,
    recipient_uei,
    award_type,
    award_status,
    awarded_at,
    period_start_at,
    period_end_at,
    obligated_value,
    ceiling_value,
    currency_code,
    sbir_sttr_phase,
    lunar_scope_note,
    source_url,
    publication_status,
    visibility_tier,
    confidence_label,
    analyst_review_state,
    freshness_at,
    last_source_at,
    updated_at
) on public.lunar_procurement_awards to anon, authenticated;

grant select (
    id,
    slug,
    title,
    regulatory_kind,
    status,
    agency_id,
    docket_number,
    filing_number,
    jurisdiction,
    affected_parties,
    lunar_relevance,
    public_summary,
    compliance_guidance,
    risk_note,
    filed_at,
    published_at,
    comment_open_at,
    comment_due_at,
    effective_at,
    source_url,
    publication_status,
    visibility_tier,
    confidence_label,
    risk_level,
    analyst_review_state,
    freshness_at,
    last_source_at,
    analyst_reviewed_at,
    updated_at
) on public.lunar_regulatory_records to anon, authenticated;

grant select (
    id,
    regulatory_record_id,
    agency_id,
    milestone_key,
    milestone_title,
    milestone_status,
    milestone_at,
    summary,
    compliance_note,
    risk_note,
    publication_status,
    visibility_tier,
    confidence_label,
    analyst_review_state,
    freshness_at,
    updated_at
) on public.lunar_policy_milestones to anon, authenticated;

grant select (
    id,
    agency_id,
    procurement_id,
    award_id,
    regulatory_record_id,
    policy_milestone_id,
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
) on public.lunar_intel_source_citations to anon, authenticated;

grant insert, update, delete on
    public.lunar_intel_agencies,
    public.lunar_procurements,
    public.lunar_procurement_awards,
    public.lunar_regulatory_records,
    public.lunar_policy_milestones,
    public.lunar_intel_source_citations
to authenticated;

drop policy if exists "lunar_intel_agencies_select_visible"
on public.lunar_intel_agencies;
create policy "lunar_intel_agencies_select_visible"
on public.lunar_intel_agencies
for select
to anon, authenticated
using (
    publication_status = 'published'
    and app_private.can_read_lunar_market_intel(visibility_tier)
);

drop policy if exists "lunar_intel_agencies_manage_staff"
on public.lunar_intel_agencies;
create policy "lunar_intel_agencies_manage_staff"
on public.lunar_intel_agencies
for all
to authenticated
using (app_private.can_manage_lunar_market_intel())
with check (app_private.can_manage_lunar_market_intel());

drop policy if exists "lunar_procurements_select_visible"
on public.lunar_procurements;
create policy "lunar_procurements_select_visible"
on public.lunar_procurements
for select
to anon, authenticated
using (
    publication_status = 'published'
    and app_private.can_read_lunar_market_intel(visibility_tier)
);

drop policy if exists "lunar_procurements_manage_staff"
on public.lunar_procurements;
create policy "lunar_procurements_manage_staff"
on public.lunar_procurements
for all
to authenticated
using (app_private.can_manage_lunar_market_intel())
with check (app_private.can_manage_lunar_market_intel());

drop policy if exists "lunar_procurement_awards_select_visible"
on public.lunar_procurement_awards;
create policy "lunar_procurement_awards_select_visible"
on public.lunar_procurement_awards
for select
to anon, authenticated
using (
    publication_status = 'published'
    and app_private.can_read_lunar_market_intel(visibility_tier)
    and exists (
        select 1
        from public.lunar_procurements procurement
        where procurement.id = lunar_procurement_awards.procurement_id
            and procurement.publication_status = 'published'
            and app_private.can_read_lunar_market_intel(
                procurement.visibility_tier
            )
    )
);

drop policy if exists "lunar_procurement_awards_manage_staff"
on public.lunar_procurement_awards;
create policy "lunar_procurement_awards_manage_staff"
on public.lunar_procurement_awards
for all
to authenticated
using (app_private.can_manage_lunar_market_intel())
with check (app_private.can_manage_lunar_market_intel());

drop policy if exists "lunar_regulatory_records_select_visible"
on public.lunar_regulatory_records;
create policy "lunar_regulatory_records_select_visible"
on public.lunar_regulatory_records
for select
to anon, authenticated
using (
    publication_status = 'published'
    and app_private.can_read_lunar_market_intel(visibility_tier)
);

drop policy if exists "lunar_regulatory_records_manage_staff"
on public.lunar_regulatory_records;
create policy "lunar_regulatory_records_manage_staff"
on public.lunar_regulatory_records
for all
to authenticated
using (app_private.can_manage_lunar_market_intel())
with check (app_private.can_manage_lunar_market_intel());

drop policy if exists "lunar_policy_milestones_select_visible"
on public.lunar_policy_milestones;
create policy "lunar_policy_milestones_select_visible"
on public.lunar_policy_milestones
for select
to anon, authenticated
using (
    publication_status = 'published'
    and app_private.can_read_lunar_market_intel(visibility_tier)
    and (
        regulatory_record_id is null
        or exists (
            select 1
            from public.lunar_regulatory_records regulatory_record
            where regulatory_record.id = lunar_policy_milestones.regulatory_record_id
                and regulatory_record.publication_status = 'published'
                and app_private.can_read_lunar_market_intel(
                    regulatory_record.visibility_tier
                )
        )
    )
);

drop policy if exists "lunar_policy_milestones_manage_staff"
on public.lunar_policy_milestones;
create policy "lunar_policy_milestones_manage_staff"
on public.lunar_policy_milestones
for all
to authenticated
using (app_private.can_manage_lunar_market_intel())
with check (app_private.can_manage_lunar_market_intel());

drop policy if exists "lunar_intel_source_citations_select_visible"
on public.lunar_intel_source_citations;
create policy "lunar_intel_source_citations_select_visible"
on public.lunar_intel_source_citations
for select
to anon, authenticated
using (
    (
        agency_id is not null
        and exists (
            select 1
            from public.lunar_intel_agencies agency
            where agency.id = lunar_intel_source_citations.agency_id
                and agency.publication_status = 'published'
                and app_private.can_read_lunar_market_intel(
                    agency.visibility_tier
                )
        )
    )
    or (
        procurement_id is not null
        and exists (
            select 1
            from public.lunar_procurements procurement
            where procurement.id = lunar_intel_source_citations.procurement_id
                and procurement.publication_status = 'published'
                and app_private.can_read_lunar_market_intel(
                    procurement.visibility_tier
                )
        )
    )
    or (
        award_id is not null
        and exists (
            select 1
            from public.lunar_procurement_awards award
            join public.lunar_procurements procurement
                on procurement.id = award.procurement_id
            where award.id = lunar_intel_source_citations.award_id
                and award.publication_status = 'published'
                and procurement.publication_status = 'published'
                and app_private.can_read_lunar_market_intel(
                    award.visibility_tier
                )
                and app_private.can_read_lunar_market_intel(
                    procurement.visibility_tier
                )
        )
    )
    or (
        regulatory_record_id is not null
        and exists (
            select 1
            from public.lunar_regulatory_records regulatory_record
            where regulatory_record.id =
                lunar_intel_source_citations.regulatory_record_id
                and regulatory_record.publication_status = 'published'
                and app_private.can_read_lunar_market_intel(
                    regulatory_record.visibility_tier
                )
        )
    )
    or (
        policy_milestone_id is not null
        and exists (
            select 1
            from public.lunar_policy_milestones milestone
            where milestone.id =
                lunar_intel_source_citations.policy_milestone_id
                and milestone.publication_status = 'published'
                and app_private.can_read_lunar_market_intel(
                    milestone.visibility_tier
                )
        )
    )
);

drop policy if exists "lunar_intel_source_citations_manage_staff"
on public.lunar_intel_source_citations;
create policy "lunar_intel_source_citations_manage_staff"
on public.lunar_intel_source_citations
for all
to authenticated
using (app_private.can_manage_lunar_market_intel())
with check (app_private.can_manage_lunar_market_intel());
