do $$
begin
    create type public.lunar_company_publication_status as enum (
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
    create type public.lunar_company_visibility_tier as enum (
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
    create type public.lunar_company_confidence_label as enum (
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
    create type public.lunar_company_source_review_status as enum (
        'queued',
        'reviewed',
        'licensed',
        'restricted',
        'rejected'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_company_relationship_kind as enum (
        'customer',
        'supplier',
        'partner',
        'investor',
        'competitor',
        'parent',
        'subsidiary',
        'joint_venture',
        'prime_contractor',
        'subcontractor',
        'other'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.lunar_companies (
    id uuid primary key default gen_random_uuid(),
    slug text not null,
    name text not null,
    legal_name text,
    company_type text not null default 'private_company',
    sectors text[] not null default '{}'::text[],
    lunar_programs text[] not null default '{}'::text[],
    summary text not null default '',
    lunar_relevance text not null default '',
    headquarters text,
    country_code text,
    website_url text,
    founded_year integer,
    employee_count_estimate integer,
    public_financial_summary text,
    licensed_financial_summary text,
    comparison_summary text,
    publication_status public.lunar_company_publication_status not null
        default 'draft',
    visibility_tier public.lunar_company_visibility_tier not null
        default 'public',
    confidence_label public.lunar_company_confidence_label not null
        default 'medium',
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
    constraint lunar_companies_slug_not_blank check (length(trim(slug)) > 0),
    constraint lunar_companies_name_not_blank check (length(trim(name)) > 0),
    constraint lunar_companies_country_format check (
        country_code is null
        or country_code ~ '^[A-Z]{2}$'
    ),
    constraint lunar_companies_website_url_format check (
        website_url is null
        or website_url ~* '^https?://'
    ),
    constraint lunar_companies_founded_year_reasonable check (
        founded_year is null
        or founded_year between 1800 and extract(year from now())::integer + 1
    ),
    constraint lunar_companies_employee_count_nonnegative check (
        employee_count_estimate is null
        or employee_count_estimate >= 0
    ),
    constraint lunar_companies_quality_score check (
        quality_score between 0 and 100
    )
);

create unique index if not exists lunar_companies_slug_key
on public.lunar_companies (lower(slug));

create index if not exists lunar_companies_sector_status_idx
on public.lunar_companies using gin (sectors);

create index if not exists lunar_companies_public_idx
on public.lunar_companies (
    publication_status,
    visibility_tier,
    quality_score desc,
    freshness_at desc nulls last
);

drop trigger if exists set_lunar_companies_updated_at
on public.lunar_companies;
create trigger set_lunar_companies_updated_at
before update on public.lunar_companies
for each row execute function public.set_updated_at();

create table if not exists public.lunar_company_facilities (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.lunar_companies(id)
        on delete cascade,
    facility_name text not null,
    facility_type text not null default 'site',
    location text,
    country_code text,
    lunar_role text not null default '',
    capabilities text[] not null default '{}'::text[],
    latitude_deg numeric(9, 6),
    longitude_deg numeric(9, 6),
    publication_status public.lunar_company_publication_status not null
        default 'draft',
    visibility_tier public.lunar_company_visibility_tier not null
        default 'member',
    confidence_label public.lunar_company_confidence_label not null
        default 'medium',
    freshness_at timestamptz,
    last_source_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_company_facilities_name_not_blank check (
        length(trim(facility_name)) > 0
    ),
    constraint lunar_company_facilities_country_format check (
        country_code is null
        or country_code ~ '^[A-Z]{2}$'
    ),
    constraint lunar_company_facilities_latitude_range check (
        latitude_deg is null
        or latitude_deg between -90 and 90
    ),
    constraint lunar_company_facilities_longitude_range check (
        longitude_deg is null
        or longitude_deg between -180 and 180
    )
);

create index if not exists lunar_company_facilities_company_idx
on public.lunar_company_facilities (company_id, facility_type);

drop trigger if exists set_lunar_company_facilities_updated_at
on public.lunar_company_facilities;
create trigger set_lunar_company_facilities_updated_at
before update on public.lunar_company_facilities
for each row execute function public.set_updated_at();

create table if not exists public.lunar_company_leadership (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.lunar_companies(id)
        on delete cascade,
    person_name text not null,
    title text not null,
    role_area text,
    biography text,
    public_profile_url text,
    started_at date,
    ended_at date,
    publication_status public.lunar_company_publication_status not null
        default 'draft',
    visibility_tier public.lunar_company_visibility_tier not null
        default 'member',
    confidence_label public.lunar_company_confidence_label not null
        default 'medium',
    freshness_at timestamptz,
    last_source_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_company_leadership_person_not_blank check (
        length(trim(person_name)) > 0
    ),
    constraint lunar_company_leadership_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint lunar_company_leadership_profile_url_format check (
        public_profile_url is null
        or public_profile_url ~* '^https?://'
    ),
    constraint lunar_company_leadership_date_order check (
        started_at is null
        or ended_at is null
        or ended_at >= started_at
    )
);

create index if not exists lunar_company_leadership_company_idx
on public.lunar_company_leadership (company_id, ended_at nulls first);

drop trigger if exists set_lunar_company_leadership_updated_at
on public.lunar_company_leadership;
create trigger set_lunar_company_leadership_updated_at
before update on public.lunar_company_leadership
for each row execute function public.set_updated_at();

create table if not exists public.lunar_company_contracts (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.lunar_companies(id)
        on delete cascade,
    procurement_id uuid references public.lunar_procurements(id)
        on delete set null,
    award_id uuid references public.lunar_procurement_awards(id)
        on delete set null,
    contract_title text not null,
    customer_name text,
    contract_number text,
    program_name text,
    contract_role text not null default 'recipient',
    contract_status text not null default 'active',
    obligated_value numeric(16, 2),
    ceiling_value numeric(16, 2),
    currency_code text not null default 'USD',
    award_at date,
    period_start_at date,
    period_end_at date,
    lunar_scope_note text not null default '',
    source_url text,
    publication_status public.lunar_company_publication_status not null
        default 'draft',
    visibility_tier public.lunar_company_visibility_tier not null
        default 'scout',
    confidence_label public.lunar_company_confidence_label not null
        default 'medium',
    freshness_at timestamptz,
    last_source_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_company_contracts_title_not_blank check (
        length(trim(contract_title)) > 0
    ),
    constraint lunar_company_contracts_currency_format check (
        currency_code ~ '^[A-Z]{3}$'
    ),
    constraint lunar_company_contracts_value_nonnegative check (
        (obligated_value is null or obligated_value >= 0)
        and (ceiling_value is null or ceiling_value >= 0)
    ),
    constraint lunar_company_contracts_period_order check (
        period_start_at is null
        or period_end_at is null
        or period_end_at >= period_start_at
    ),
    constraint lunar_company_contracts_source_url_format check (
        source_url is null
        or source_url ~* '^https?://'
    )
);

create index if not exists lunar_company_contracts_company_idx
on public.lunar_company_contracts (
    company_id,
    contract_status,
    award_at desc nulls last
);

create index if not exists lunar_company_contracts_procurement_idx
on public.lunar_company_contracts (procurement_id, award_id)
where procurement_id is not null or award_id is not null;

drop trigger if exists set_lunar_company_contracts_updated_at
on public.lunar_company_contracts;
create trigger set_lunar_company_contracts_updated_at
before update on public.lunar_company_contracts
for each row execute function public.set_updated_at();

create table if not exists public.lunar_company_financials (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.lunar_companies(id)
        on delete cascade,
    metric_key text not null,
    metric_label text not null,
    period_label text,
    period_start_at date,
    period_end_at date,
    value_numeric numeric(18, 4),
    value_text text,
    currency_code text,
    unit_label text,
    is_public_record boolean not null default false,
    license_notes text,
    publication_status public.lunar_company_publication_status not null
        default 'draft',
    visibility_tier public.lunar_company_visibility_tier not null
        default 'scout',
    confidence_label public.lunar_company_confidence_label not null
        default 'medium',
    freshness_at timestamptz,
    last_source_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_company_financials_metric_key_not_blank check (
        length(trim(metric_key)) > 0
    ),
    constraint lunar_company_financials_metric_label_not_blank check (
        length(trim(metric_label)) > 0
    ),
    constraint lunar_company_financials_has_value check (
        value_numeric is not null
        or value_text is not null
    ),
    constraint lunar_company_financials_currency_format check (
        currency_code is null
        or currency_code ~ '^[A-Z]{3}$'
    ),
    constraint lunar_company_financials_period_order check (
        period_start_at is null
        or period_end_at is null
        or period_end_at >= period_start_at
    )
);

create index if not exists lunar_company_financials_company_metric_idx
on public.lunar_company_financials (
    company_id,
    metric_key,
    period_end_at desc nulls last
);

drop trigger if exists set_lunar_company_financials_updated_at
on public.lunar_company_financials;
create trigger set_lunar_company_financials_updated_at
before update on public.lunar_company_financials
for each row execute function public.set_updated_at();

create table if not exists public.lunar_company_news_links (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.lunar_companies(id)
        on delete cascade,
    article_id uuid references public.editorial_articles(id) on delete set null,
    title text not null,
    url text,
    publisher text,
    published_at timestamptz,
    summary text not null default '',
    news_relevance text not null default '',
    publication_status public.lunar_company_publication_status not null
        default 'draft',
    visibility_tier public.lunar_company_visibility_tier not null
        default 'public',
    confidence_label public.lunar_company_confidence_label not null
        default 'medium',
    freshness_at timestamptz,
    last_source_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_company_news_links_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint lunar_company_news_links_url_format check (
        url is null
        or url ~* '^https?://'
    )
);

create index if not exists lunar_company_news_links_company_idx
on public.lunar_company_news_links (
    company_id,
    published_at desc nulls last
);

drop trigger if exists set_lunar_company_news_links_updated_at
on public.lunar_company_news_links;
create trigger set_lunar_company_news_links_updated_at
before update on public.lunar_company_news_links
for each row execute function public.set_updated_at();

create table if not exists public.lunar_company_relationships (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.lunar_companies(id)
        on delete cascade,
    related_company_id uuid references public.lunar_companies(id)
        on delete cascade,
    related_mission_id uuid references public.lunar_missions(id)
        on delete set null,
    relationship_kind public.lunar_company_relationship_kind not null,
    relationship_summary text not null default '',
    started_at date,
    ended_at date,
    publication_status public.lunar_company_publication_status not null
        default 'draft',
    visibility_tier public.lunar_company_visibility_tier not null
        default 'member',
    confidence_label public.lunar_company_confidence_label not null
        default 'medium',
    freshness_at timestamptz,
    last_source_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_company_relationships_target check (
        related_company_id is not null
        or related_mission_id is not null
    ),
    constraint lunar_company_relationships_not_self check (
        related_company_id is null
        or related_company_id <> company_id
    ),
    constraint lunar_company_relationships_date_order check (
        started_at is null
        or ended_at is null
        or ended_at >= started_at
    )
);

create index if not exists lunar_company_relationships_company_idx
on public.lunar_company_relationships (company_id, relationship_kind);

create index if not exists lunar_company_relationships_related_company_idx
on public.lunar_company_relationships (related_company_id, relationship_kind)
where related_company_id is not null;

drop trigger if exists set_lunar_company_relationships_updated_at
on public.lunar_company_relationships;
create trigger set_lunar_company_relationships_updated_at
before update on public.lunar_company_relationships
for each row execute function public.set_updated_at();

create table if not exists public.lunar_company_comparison_attributes (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references public.lunar_companies(id)
        on delete cascade,
    attribute_key text not null,
    attribute_label text not null,
    category text not null default 'profile',
    value_text text,
    value_numeric numeric(18, 4),
    value_date date,
    value_json jsonb,
    unit_label text,
    rank_value numeric(18, 4),
    display_order integer not null default 100,
    publication_status public.lunar_company_publication_status not null
        default 'draft',
    visibility_tier public.lunar_company_visibility_tier not null
        default 'member',
    confidence_label public.lunar_company_confidence_label not null
        default 'medium',
    freshness_at timestamptz,
    last_source_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_company_comparison_attributes_key_not_blank check (
        length(trim(attribute_key)) > 0
    ),
    constraint lunar_company_comparison_attributes_label_not_blank check (
        length(trim(attribute_label)) > 0
    ),
    constraint lunar_company_comparison_attributes_has_value check (
        value_text is not null
        or value_numeric is not null
        or value_date is not null
        or value_json is not null
    ),
    constraint lunar_company_comparison_attributes_display_order check (
        display_order >= 0
    )
);

create unique index if not exists lunar_company_comparison_attributes_key
on public.lunar_company_comparison_attributes (
    company_id,
    lower(attribute_key)
);

create index if not exists lunar_company_comparison_attributes_category_idx
on public.lunar_company_comparison_attributes (
    category,
    attribute_key,
    rank_value desc nulls last
);

drop trigger if exists set_lunar_company_comparison_attributes_updated_at
on public.lunar_company_comparison_attributes;
create trigger set_lunar_company_comparison_attributes_updated_at
before update on public.lunar_company_comparison_attributes
for each row execute function public.set_updated_at();

create table if not exists public.lunar_company_source_citations (
    id uuid primary key default gen_random_uuid(),
    company_id uuid references public.lunar_companies(id) on delete cascade,
    facility_id uuid references public.lunar_company_facilities(id)
        on delete cascade,
    leadership_id uuid references public.lunar_company_leadership(id)
        on delete cascade,
    contract_id uuid references public.lunar_company_contracts(id)
        on delete cascade,
    financial_id uuid references public.lunar_company_financials(id)
        on delete cascade,
    news_link_id uuid references public.lunar_company_news_links(id)
        on delete cascade,
    relationship_id uuid references public.lunar_company_relationships(id)
        on delete cascade,
    comparison_attribute_id uuid
        references public.lunar_company_comparison_attributes(id)
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
    review_status public.lunar_company_source_review_status not null
        default 'queued',
    confidence_label public.lunar_company_confidence_label not null
        default 'medium',
    display_order integer not null default 100,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_company_source_citations_target check (
        company_id is not null
        or facility_id is not null
        or leadership_id is not null
        or contract_id is not null
        or financial_id is not null
        or news_link_id is not null
        or relationship_id is not null
        or comparison_attribute_id is not null
    ),
    constraint lunar_company_source_citations_source_not_blank check (
        length(trim(source_name)) > 0
    ),
    constraint lunar_company_source_citations_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint lunar_company_source_citations_url_format check (
        url is null
        or url ~* '^https?://'
    ),
    constraint lunar_company_source_citations_display_order check (
        display_order >= 0
    )
);

create index if not exists lunar_company_source_citations_company_idx
on public.lunar_company_source_citations (company_id, display_order)
where company_id is not null;

create index if not exists lunar_company_source_citations_review_idx
on public.lunar_company_source_citations (review_status, retrieved_at desc);

drop trigger if exists set_lunar_company_source_citations_updated_at
on public.lunar_company_source_citations;
create trigger set_lunar_company_source_citations_updated_at
before update on public.lunar_company_source_citations
for each row execute function public.set_updated_at();

create or replace function app_private.can_read_lunar_company_profile(
    target_tier public.lunar_company_visibility_tier
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

create or replace function app_private.can_manage_lunar_company_profiles()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select app_private.has_any_role(array['editor', 'analyst', 'admin']);
$$;

grant execute on function app_private.can_read_lunar_company_profile(
    public.lunar_company_visibility_tier
) to anon, authenticated;
grant execute on function app_private.can_manage_lunar_company_profiles()
to authenticated;

alter table public.lunar_companies enable row level security;
alter table public.lunar_company_facilities enable row level security;
alter table public.lunar_company_leadership enable row level security;
alter table public.lunar_company_contracts enable row level security;
alter table public.lunar_company_financials enable row level security;
alter table public.lunar_company_news_links enable row level security;
alter table public.lunar_company_relationships enable row level security;
alter table public.lunar_company_comparison_attributes enable row level security;
alter table public.lunar_company_source_citations enable row level security;

grant select (
    id,
    slug,
    name,
    legal_name,
    company_type,
    sectors,
    lunar_programs,
    summary,
    lunar_relevance,
    headquarters,
    country_code,
    website_url,
    founded_year,
    employee_count_estimate,
    public_financial_summary,
    comparison_summary,
    publication_status,
    visibility_tier,
    confidence_label,
    quality_score,
    analyst_review_state,
    freshness_at,
    last_source_at,
    analyst_reviewed_at,
    updated_at
) on public.lunar_companies to anon, authenticated;

grant select (
    id,
    company_id,
    facility_name,
    facility_type,
    location,
    country_code,
    lunar_role,
    capabilities,
    latitude_deg,
    longitude_deg,
    publication_status,
    visibility_tier,
    confidence_label,
    freshness_at,
    last_source_at,
    updated_at
) on public.lunar_company_facilities to anon, authenticated;

grant select (
    id,
    company_id,
    person_name,
    title,
    role_area,
    biography,
    public_profile_url,
    started_at,
    ended_at,
    publication_status,
    visibility_tier,
    confidence_label,
    freshness_at,
    last_source_at,
    updated_at
) on public.lunar_company_leadership to anon, authenticated;

grant select (
    id,
    company_id,
    procurement_id,
    award_id,
    contract_title,
    customer_name,
    contract_number,
    program_name,
    contract_role,
    contract_status,
    obligated_value,
    ceiling_value,
    currency_code,
    award_at,
    period_start_at,
    period_end_at,
    lunar_scope_note,
    source_url,
    publication_status,
    visibility_tier,
    confidence_label,
    freshness_at,
    last_source_at,
    updated_at
) on public.lunar_company_contracts to anon, authenticated;

grant select (
    id,
    company_id,
    metric_key,
    metric_label,
    period_label,
    period_start_at,
    period_end_at,
    value_numeric,
    value_text,
    currency_code,
    unit_label,
    is_public_record,
    license_notes,
    publication_status,
    visibility_tier,
    confidence_label,
    freshness_at,
    last_source_at,
    updated_at
) on public.lunar_company_financials to anon, authenticated;

grant select (
    id,
    company_id,
    article_id,
    title,
    url,
    publisher,
    published_at,
    summary,
    news_relevance,
    publication_status,
    visibility_tier,
    confidence_label,
    freshness_at,
    last_source_at,
    updated_at
) on public.lunar_company_news_links to anon, authenticated;

grant select (
    id,
    company_id,
    related_company_id,
    related_mission_id,
    relationship_kind,
    relationship_summary,
    started_at,
    ended_at,
    publication_status,
    visibility_tier,
    confidence_label,
    freshness_at,
    last_source_at,
    updated_at
) on public.lunar_company_relationships to anon, authenticated;

grant select (
    id,
    company_id,
    attribute_key,
    attribute_label,
    category,
    value_text,
    value_numeric,
    value_date,
    value_json,
    unit_label,
    rank_value,
    display_order,
    publication_status,
    visibility_tier,
    confidence_label,
    freshness_at,
    last_source_at,
    updated_at
) on public.lunar_company_comparison_attributes to anon, authenticated;

grant select (
    id,
    company_id,
    facility_id,
    leadership_id,
    contract_id,
    financial_id,
    news_link_id,
    relationship_id,
    comparison_attribute_id,
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
) on public.lunar_company_source_citations to anon, authenticated;

grant insert, update, delete on
    public.lunar_companies,
    public.lunar_company_facilities,
    public.lunar_company_leadership,
    public.lunar_company_contracts,
    public.lunar_company_financials,
    public.lunar_company_news_links,
    public.lunar_company_relationships,
    public.lunar_company_comparison_attributes,
    public.lunar_company_source_citations
to authenticated;

grant all on
    public.lunar_companies,
    public.lunar_company_facilities,
    public.lunar_company_leadership,
    public.lunar_company_contracts,
    public.lunar_company_financials,
    public.lunar_company_news_links,
    public.lunar_company_relationships,
    public.lunar_company_comparison_attributes,
    public.lunar_company_source_citations
to service_role;

drop policy if exists "lunar_companies_select_visible"
on public.lunar_companies;
create policy "lunar_companies_select_visible"
on public.lunar_companies
for select
to anon, authenticated
using (
    publication_status = 'published'
    and app_private.can_read_lunar_company_profile(visibility_tier)
);

drop policy if exists "lunar_companies_manage_staff"
on public.lunar_companies;
create policy "lunar_companies_manage_staff"
on public.lunar_companies
for all
to authenticated
using (app_private.can_manage_lunar_company_profiles())
with check (app_private.can_manage_lunar_company_profiles());

drop policy if exists "lunar_company_facilities_select_visible"
on public.lunar_company_facilities;
create policy "lunar_company_facilities_select_visible"
on public.lunar_company_facilities
for select
to anon, authenticated
using (
    publication_status = 'published'
    and app_private.can_read_lunar_company_profile(visibility_tier)
    and exists (
        select 1
        from public.lunar_companies company
        where company.id = lunar_company_facilities.company_id
            and company.publication_status = 'published'
            and app_private.can_read_lunar_company_profile(
                company.visibility_tier
            )
    )
);

drop policy if exists "lunar_company_facilities_manage_staff"
on public.lunar_company_facilities;
create policy "lunar_company_facilities_manage_staff"
on public.lunar_company_facilities
for all
to authenticated
using (app_private.can_manage_lunar_company_profiles())
with check (app_private.can_manage_lunar_company_profiles());

drop policy if exists "lunar_company_leadership_select_visible"
on public.lunar_company_leadership;
create policy "lunar_company_leadership_select_visible"
on public.lunar_company_leadership
for select
to anon, authenticated
using (
    publication_status = 'published'
    and app_private.can_read_lunar_company_profile(visibility_tier)
    and exists (
        select 1
        from public.lunar_companies company
        where company.id = lunar_company_leadership.company_id
            and company.publication_status = 'published'
            and app_private.can_read_lunar_company_profile(
                company.visibility_tier
            )
    )
);

drop policy if exists "lunar_company_leadership_manage_staff"
on public.lunar_company_leadership;
create policy "lunar_company_leadership_manage_staff"
on public.lunar_company_leadership
for all
to authenticated
using (app_private.can_manage_lunar_company_profiles())
with check (app_private.can_manage_lunar_company_profiles());

drop policy if exists "lunar_company_contracts_select_visible"
on public.lunar_company_contracts;
create policy "lunar_company_contracts_select_visible"
on public.lunar_company_contracts
for select
to anon, authenticated
using (
    publication_status = 'published'
    and app_private.can_read_lunar_company_profile(visibility_tier)
    and exists (
        select 1
        from public.lunar_companies company
        where company.id = lunar_company_contracts.company_id
            and company.publication_status = 'published'
            and app_private.can_read_lunar_company_profile(
                company.visibility_tier
            )
    )
);

drop policy if exists "lunar_company_contracts_manage_staff"
on public.lunar_company_contracts;
create policy "lunar_company_contracts_manage_staff"
on public.lunar_company_contracts
for all
to authenticated
using (app_private.can_manage_lunar_company_profiles())
with check (app_private.can_manage_lunar_company_profiles());

drop policy if exists "lunar_company_financials_select_visible"
on public.lunar_company_financials;
create policy "lunar_company_financials_select_visible"
on public.lunar_company_financials
for select
to anon, authenticated
using (
    publication_status = 'published'
    and app_private.can_read_lunar_company_profile(visibility_tier)
    and exists (
        select 1
        from public.lunar_companies company
        where company.id = lunar_company_financials.company_id
            and company.publication_status = 'published'
            and app_private.can_read_lunar_company_profile(
                company.visibility_tier
            )
    )
);

drop policy if exists "lunar_company_financials_manage_staff"
on public.lunar_company_financials;
create policy "lunar_company_financials_manage_staff"
on public.lunar_company_financials
for all
to authenticated
using (app_private.can_manage_lunar_company_profiles())
with check (app_private.can_manage_lunar_company_profiles());

drop policy if exists "lunar_company_news_links_select_visible"
on public.lunar_company_news_links;
create policy "lunar_company_news_links_select_visible"
on public.lunar_company_news_links
for select
to anon, authenticated
using (
    publication_status = 'published'
    and app_private.can_read_lunar_company_profile(visibility_tier)
    and exists (
        select 1
        from public.lunar_companies company
        where company.id = lunar_company_news_links.company_id
            and company.publication_status = 'published'
            and app_private.can_read_lunar_company_profile(
                company.visibility_tier
            )
    )
);

drop policy if exists "lunar_company_news_links_manage_staff"
on public.lunar_company_news_links;
create policy "lunar_company_news_links_manage_staff"
on public.lunar_company_news_links
for all
to authenticated
using (app_private.can_manage_lunar_company_profiles())
with check (app_private.can_manage_lunar_company_profiles());

drop policy if exists "lunar_company_relationships_select_visible"
on public.lunar_company_relationships;
create policy "lunar_company_relationships_select_visible"
on public.lunar_company_relationships
for select
to anon, authenticated
using (
    publication_status = 'published'
    and app_private.can_read_lunar_company_profile(visibility_tier)
    and exists (
        select 1
        from public.lunar_companies company
        where company.id = lunar_company_relationships.company_id
            and company.publication_status = 'published'
            and app_private.can_read_lunar_company_profile(
                company.visibility_tier
            )
    )
);

drop policy if exists "lunar_company_relationships_manage_staff"
on public.lunar_company_relationships;
create policy "lunar_company_relationships_manage_staff"
on public.lunar_company_relationships
for all
to authenticated
using (app_private.can_manage_lunar_company_profiles())
with check (app_private.can_manage_lunar_company_profiles());

drop policy if exists "lunar_company_comparison_attributes_select_visible"
on public.lunar_company_comparison_attributes;
create policy "lunar_company_comparison_attributes_select_visible"
on public.lunar_company_comparison_attributes
for select
to anon, authenticated
using (
    publication_status = 'published'
    and app_private.can_read_lunar_company_profile(visibility_tier)
    and exists (
        select 1
        from public.lunar_companies company
        where company.id = lunar_company_comparison_attributes.company_id
            and company.publication_status = 'published'
            and app_private.can_read_lunar_company_profile(
                company.visibility_tier
            )
    )
);

drop policy if exists "lunar_company_comparison_attributes_manage_staff"
on public.lunar_company_comparison_attributes;
create policy "lunar_company_comparison_attributes_manage_staff"
on public.lunar_company_comparison_attributes
for all
to authenticated
using (app_private.can_manage_lunar_company_profiles())
with check (app_private.can_manage_lunar_company_profiles());

drop policy if exists "lunar_company_source_citations_select_visible"
on public.lunar_company_source_citations;
create policy "lunar_company_source_citations_select_visible"
on public.lunar_company_source_citations
for select
to anon, authenticated
using (
    review_status in ('reviewed', 'licensed')
    and (
        (
            company_id is not null
            and exists (
                select 1
                from public.lunar_companies company
                where company.id = lunar_company_source_citations.company_id
                    and company.publication_status = 'published'
                    and app_private.can_read_lunar_company_profile(
                        company.visibility_tier
                    )
            )
        )
        or (
            facility_id is not null
            and exists (
                select 1
                from public.lunar_company_facilities facility
                join public.lunar_companies company
                    on company.id = facility.company_id
                where facility.id =
                    lunar_company_source_citations.facility_id
                    and facility.publication_status = 'published'
                    and company.publication_status = 'published'
                    and app_private.can_read_lunar_company_profile(
                        facility.visibility_tier
                    )
                    and app_private.can_read_lunar_company_profile(
                        company.visibility_tier
                    )
            )
        )
        or (
            leadership_id is not null
            and exists (
                select 1
                from public.lunar_company_leadership leader
                join public.lunar_companies company
                    on company.id = leader.company_id
                where leader.id =
                    lunar_company_source_citations.leadership_id
                    and leader.publication_status = 'published'
                    and company.publication_status = 'published'
                    and app_private.can_read_lunar_company_profile(
                        leader.visibility_tier
                    )
                    and app_private.can_read_lunar_company_profile(
                        company.visibility_tier
                    )
            )
        )
        or (
            contract_id is not null
            and exists (
                select 1
                from public.lunar_company_contracts contract
                join public.lunar_companies company
                    on company.id = contract.company_id
                where contract.id =
                    lunar_company_source_citations.contract_id
                    and contract.publication_status = 'published'
                    and company.publication_status = 'published'
                    and app_private.can_read_lunar_company_profile(
                        contract.visibility_tier
                    )
                    and app_private.can_read_lunar_company_profile(
                        company.visibility_tier
                    )
            )
        )
        or (
            financial_id is not null
            and exists (
                select 1
                from public.lunar_company_financials financial
                join public.lunar_companies company
                    on company.id = financial.company_id
                where financial.id =
                    lunar_company_source_citations.financial_id
                    and financial.publication_status = 'published'
                    and company.publication_status = 'published'
                    and app_private.can_read_lunar_company_profile(
                        financial.visibility_tier
                    )
                    and app_private.can_read_lunar_company_profile(
                        company.visibility_tier
                    )
            )
        )
        or (
            news_link_id is not null
            and exists (
                select 1
                from public.lunar_company_news_links news_link
                join public.lunar_companies company
                    on company.id = news_link.company_id
                where news_link.id =
                    lunar_company_source_citations.news_link_id
                    and news_link.publication_status = 'published'
                    and company.publication_status = 'published'
                    and app_private.can_read_lunar_company_profile(
                        news_link.visibility_tier
                    )
                    and app_private.can_read_lunar_company_profile(
                        company.visibility_tier
                    )
            )
        )
        or (
            relationship_id is not null
            and exists (
                select 1
                from public.lunar_company_relationships relationship
                join public.lunar_companies company
                    on company.id = relationship.company_id
                where relationship.id =
                    lunar_company_source_citations.relationship_id
                    and relationship.publication_status = 'published'
                    and company.publication_status = 'published'
                    and app_private.can_read_lunar_company_profile(
                        relationship.visibility_tier
                    )
                    and app_private.can_read_lunar_company_profile(
                        company.visibility_tier
                    )
            )
        )
        or (
            comparison_attribute_id is not null
            and exists (
                select 1
                from public.lunar_company_comparison_attributes attribute
                join public.lunar_companies company
                    on company.id = attribute.company_id
                where attribute.id =
                    lunar_company_source_citations.comparison_attribute_id
                    and attribute.publication_status = 'published'
                    and company.publication_status = 'published'
                    and app_private.can_read_lunar_company_profile(
                        attribute.visibility_tier
                    )
                    and app_private.can_read_lunar_company_profile(
                        company.visibility_tier
                    )
            )
        )
    )
);

drop policy if exists "lunar_company_source_citations_manage_staff"
on public.lunar_company_source_citations;
create policy "lunar_company_source_citations_manage_staff"
on public.lunar_company_source_citations
for all
to authenticated
using (app_private.can_manage_lunar_company_profiles())
with check (app_private.can_manage_lunar_company_profiles());
