do $$
begin
    create type public.lunar_economy_record_status as enum (
        'draft',
        'active',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_economy_publication_status as enum (
        'draft',
        'published',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.lunar_economy_confidence_label as enum (
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
    create type public.lunar_economy_source_review_status as enum (
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
    create type public.lunar_economy_scenario_type as enum (
        'conservative',
        'baseline',
        'upside',
        'stress',
        'custom'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.lunar_economy_model_versions (
    id uuid primary key default gen_random_uuid(),
    version_key text not null,
    version_name text not null,
    status public.lunar_economy_record_status not null default 'draft',
    summary text not null default '',
    methodology_markdown text not null default '',
    model_scope text not null default 'lunar_economy_tracker',
    currency_code text not null default 'USD',
    valid_from date not null default current_date,
    valid_to date,
    is_public boolean not null default false,
    published_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_economy_model_versions_key_not_blank check (
        length(trim(version_key)) > 0
    ),
    constraint lunar_economy_model_versions_name_not_blank check (
        length(trim(version_name)) > 0
    ),
    constraint lunar_economy_model_versions_scope_not_blank check (
        length(trim(model_scope)) > 0
    ),
    constraint lunar_economy_model_versions_currency_format check (
        currency_code = upper(currency_code)
        and currency_code ~ '^[A-Z]{3}$'
    ),
    constraint lunar_economy_model_versions_valid_dates check (
        valid_to is null
        or valid_to >= valid_from
    )
);

create unique index if not exists lunar_economy_model_versions_key
on public.lunar_economy_model_versions (lower(version_key));

create index if not exists lunar_economy_model_versions_public_idx
on public.lunar_economy_model_versions (
    status,
    is_public,
    valid_from desc
);

drop trigger if exists set_lunar_economy_model_versions_updated_at
on public.lunar_economy_model_versions;
create trigger set_lunar_economy_model_versions_updated_at
before update on public.lunar_economy_model_versions
for each row execute function public.set_updated_at();

create table if not exists public.lunar_economy_model_assumptions (
    id uuid primary key default gen_random_uuid(),
    model_version_id uuid not null
        references public.lunar_economy_model_versions(id)
        on delete cascade,
    assumption_key text not null,
    assumption_name text not null,
    category text not null default 'general',
    value_numeric numeric(24, 6),
    value_text text,
    unit_name text,
    unit_symbol text,
    confidence_label public.lunar_economy_confidence_label not null
        default 'experimental',
    is_public boolean not null default false,
    source_note text,
    rationale text,
    display_order integer not null default 100,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_economy_model_assumptions_key_not_blank check (
        length(trim(assumption_key)) > 0
    ),
    constraint lunar_economy_model_assumptions_name_not_blank check (
        length(trim(assumption_name)) > 0
    ),
    constraint lunar_economy_model_assumptions_category_not_blank check (
        length(trim(category)) > 0
    ),
    constraint lunar_economy_model_assumptions_has_value check (
        value_numeric is not null
        or nullif(trim(coalesce(value_text, '')), '') is not null
    ),
    constraint lunar_economy_model_assumptions_display_order check (
        display_order >= 0
    )
);

create unique index if not exists lunar_economy_assumptions_key
on public.lunar_economy_model_assumptions (
    model_version_id,
    lower(assumption_key)
);

create index if not exists lunar_economy_assumptions_model_idx
on public.lunar_economy_model_assumptions (
    model_version_id,
    category,
    display_order
);

drop trigger if exists set_lunar_economy_model_assumptions_updated_at
on public.lunar_economy_model_assumptions;
create trigger set_lunar_economy_model_assumptions_updated_at
before update on public.lunar_economy_model_assumptions
for each row execute function public.set_updated_at();

create table if not exists public.lunar_economy_source_documents (
    id uuid primary key default gen_random_uuid(),
    model_version_id uuid not null
        references public.lunar_economy_model_versions(id)
        on delete cascade,
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
    review_status public.lunar_economy_source_review_status not null
        default 'queued',
    confidence_label public.lunar_economy_confidence_label not null
        default 'experimental',
    is_public boolean not null default false,
    display_order integer not null default 100,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_economy_source_documents_key_not_blank check (
        length(trim(source_key)) > 0
    ),
    constraint lunar_economy_source_documents_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint lunar_economy_source_documents_type_not_blank check (
        length(trim(document_type)) > 0
    ),
    constraint lunar_economy_source_documents_url_format check (
        url is null
        or url ~* '^https?://'
    ),
    constraint lunar_economy_source_documents_display_order check (
        display_order >= 0
    )
);

create unique index if not exists lunar_economy_source_documents_key
on public.lunar_economy_source_documents (
    model_version_id,
    lower(source_key)
);

create index if not exists lunar_economy_source_documents_review_idx
on public.lunar_economy_source_documents (
    model_version_id,
    review_status,
    is_public,
    display_order
);

drop trigger if exists set_lunar_economy_source_documents_updated_at
on public.lunar_economy_source_documents;
create trigger set_lunar_economy_source_documents_updated_at
before update on public.lunar_economy_source_documents
for each row execute function public.set_updated_at();

create table if not exists public.lunar_economy_assumption_sources (
    id uuid primary key default gen_random_uuid(),
    assumption_id uuid not null
        references public.lunar_economy_model_assumptions(id)
        on delete cascade,
    source_document_id uuid not null
        references public.lunar_economy_source_documents(id)
        on delete cascade,
    relationship_type text not null default 'supports',
    notes text,
    display_order integer not null default 100,
    created_at timestamptz not null default now(),
    constraint lunar_economy_assumption_sources_type_not_blank check (
        length(trim(relationship_type)) > 0
    ),
    constraint lunar_economy_assumption_sources_display_order check (
        display_order >= 0
    )
);

create unique index if not exists lunar_economy_assumption_sources_key
on public.lunar_economy_assumption_sources (
    assumption_id,
    source_document_id,
    lower(relationship_type)
);

create index if not exists lunar_economy_assumption_sources_source_idx
on public.lunar_economy_assumption_sources (
    source_document_id,
    display_order
);

create table if not exists public.lunar_economy_scenario_estimates (
    id uuid primary key default gen_random_uuid(),
    model_version_id uuid not null
        references public.lunar_economy_model_versions(id)
        on delete cascade,
    scenario_key text not null,
    scenario_name text not null,
    scenario_type public.lunar_economy_scenario_type not null
        default 'baseline',
    estimate_date date not null default current_date,
    estimate_value numeric(24, 2) not null,
    range_low_value numeric(24, 2),
    range_high_value numeric(24, 2),
    currency_code text not null default 'USD',
    confidence_score numeric(5, 2) not null default 0,
    confidence_label public.lunar_economy_confidence_label not null
        default 'experimental',
    methodology_notes text,
    primary_source_document_id uuid
        references public.lunar_economy_source_documents(id)
        on delete set null,
    publication_status public.lunar_economy_publication_status not null
        default 'draft',
    is_public boolean not null default false,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_economy_scenario_estimates_key_not_blank check (
        length(trim(scenario_key)) > 0
    ),
    constraint lunar_economy_scenario_estimates_name_not_blank check (
        length(trim(scenario_name)) > 0
    ),
    constraint lunar_economy_scenario_estimates_nonnegative check (
        estimate_value >= 0
        and (range_low_value is null or range_low_value >= 0)
        and (range_high_value is null or range_high_value >= 0)
    ),
    constraint lunar_economy_scenario_estimates_range check (
        range_low_value is null
        or range_high_value is null
        or range_high_value >= range_low_value
    ),
    constraint lunar_economy_scenario_estimates_currency_format check (
        currency_code = upper(currency_code)
        and currency_code ~ '^[A-Z]{3}$'
    ),
    constraint lunar_economy_scenario_estimates_confidence_score check (
        confidence_score between 0 and 100
    )
);

create unique index if not exists lunar_economy_scenario_estimates_key
on public.lunar_economy_scenario_estimates (
    model_version_id,
    lower(scenario_key),
    estimate_date
);

create index if not exists lunar_economy_scenario_estimates_public_idx
on public.lunar_economy_scenario_estimates (
    publication_status,
    is_public,
    estimate_date desc
);

drop trigger if exists set_lunar_economy_scenario_estimates_updated_at
on public.lunar_economy_scenario_estimates;
create trigger set_lunar_economy_scenario_estimates_updated_at
before update on public.lunar_economy_scenario_estimates
for each row execute function public.set_updated_at();

create table if not exists public.lunar_economy_daily_outputs (
    id uuid primary key default gen_random_uuid(),
    model_version_id uuid not null
        references public.lunar_economy_model_versions(id)
        on delete cascade,
    scenario_estimate_id uuid
        references public.lunar_economy_scenario_estimates(id)
        on delete set null,
    output_date date not null default current_date,
    scenario_key text not null,
    headline_value numeric(24, 2) not null,
    range_low_value numeric(24, 2),
    range_high_value numeric(24, 2),
    currency_code text not null default 'USD',
    confidence_score numeric(5, 2) not null default 0,
    confidence_label public.lunar_economy_confidence_label not null
        default 'experimental',
    methodology_note text,
    source_count integer not null default 0,
    freshness_at timestamptz not null default now(),
    publication_status public.lunar_economy_publication_status not null
        default 'draft',
    is_public boolean not null default false,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_economy_daily_outputs_scenario_not_blank check (
        length(trim(scenario_key)) > 0
    ),
    constraint lunar_economy_daily_outputs_nonnegative check (
        headline_value >= 0
        and (range_low_value is null or range_low_value >= 0)
        and (range_high_value is null or range_high_value >= 0)
        and source_count >= 0
    ),
    constraint lunar_economy_daily_outputs_range check (
        range_low_value is null
        or range_high_value is null
        or range_high_value >= range_low_value
    ),
    constraint lunar_economy_daily_outputs_currency_format check (
        currency_code = upper(currency_code)
        and currency_code ~ '^[A-Z]{3}$'
    ),
    constraint lunar_economy_daily_outputs_confidence_score check (
        confidence_score between 0 and 100
    )
);

create unique index if not exists lunar_economy_daily_outputs_key
on public.lunar_economy_daily_outputs (
    model_version_id,
    output_date,
    lower(scenario_key)
);

create index if not exists lunar_economy_daily_outputs_public_idx
on public.lunar_economy_daily_outputs (
    publication_status,
    is_public,
    output_date desc
);

drop trigger if exists set_lunar_economy_daily_outputs_updated_at
on public.lunar_economy_daily_outputs;
create trigger set_lunar_economy_daily_outputs_updated_at
before update on public.lunar_economy_daily_outputs
for each row execute function public.set_updated_at();

alter table public.lunar_economy_model_versions enable row level security;
alter table public.lunar_economy_model_assumptions enable row level security;
alter table public.lunar_economy_source_documents enable row level security;
alter table public.lunar_economy_assumption_sources enable row level security;
alter table public.lunar_economy_scenario_estimates enable row level security;
alter table public.lunar_economy_daily_outputs enable row level security;

grant select (
    id,
    version_key,
    version_name,
    status,
    summary,
    methodology_markdown,
    model_scope,
    currency_code,
    valid_from,
    valid_to,
    is_public,
    published_at,
    updated_at
) on public.lunar_economy_model_versions to anon, authenticated;

grant select (
    id,
    model_version_id,
    assumption_key,
    assumption_name,
    category,
    value_numeric,
    value_text,
    unit_name,
    unit_symbol,
    confidence_label,
    is_public,
    source_note,
    rationale,
    display_order,
    updated_at
) on public.lunar_economy_model_assumptions to anon, authenticated;

grant select (
    id,
    model_version_id,
    source_key,
    title,
    publisher,
    document_type,
    url,
    published_at,
    retrieved_at,
    citation_text,
    summary,
    license_notes,
    review_status,
    confidence_label,
    is_public,
    display_order,
    updated_at
) on public.lunar_economy_source_documents to anon, authenticated;

grant select (
    id,
    assumption_id,
    source_document_id,
    relationship_type,
    notes,
    display_order,
    created_at
) on public.lunar_economy_assumption_sources to anon, authenticated;

grant select (
    id,
    model_version_id,
    scenario_key,
    scenario_name,
    scenario_type,
    estimate_date,
    estimate_value,
    range_low_value,
    range_high_value,
    currency_code,
    confidence_score,
    confidence_label,
    methodology_notes,
    primary_source_document_id,
    publication_status,
    is_public,
    updated_at
) on public.lunar_economy_scenario_estimates to anon, authenticated;

grant select (
    id,
    model_version_id,
    scenario_estimate_id,
    output_date,
    scenario_key,
    headline_value,
    range_low_value,
    range_high_value,
    currency_code,
    confidence_score,
    confidence_label,
    methodology_note,
    source_count,
    freshness_at,
    publication_status,
    is_public,
    updated_at
) on public.lunar_economy_daily_outputs to anon, authenticated;

grant insert, update, delete on
    public.lunar_economy_model_versions,
    public.lunar_economy_model_assumptions,
    public.lunar_economy_source_documents,
    public.lunar_economy_assumption_sources,
    public.lunar_economy_scenario_estimates,
    public.lunar_economy_daily_outputs
to authenticated;

grant all on
    public.lunar_economy_model_versions,
    public.lunar_economy_model_assumptions,
    public.lunar_economy_source_documents,
    public.lunar_economy_assumption_sources,
    public.lunar_economy_scenario_estimates,
    public.lunar_economy_daily_outputs
to service_role;

drop policy if exists "lunar_economy_model_versions_select_public"
on public.lunar_economy_model_versions;
create policy "lunar_economy_model_versions_select_public"
on public.lunar_economy_model_versions
for select
to anon, authenticated
using (
    status = 'active'
    and is_public
    and valid_from <= current_date
    and (valid_to is null or valid_to >= current_date)
    and (published_at is null or published_at <= now())
);

drop policy if exists "lunar_economy_model_versions_select_staff"
on public.lunar_economy_model_versions;
create policy "lunar_economy_model_versions_select_staff"
on public.lunar_economy_model_versions
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_economy_model_versions_manage_staff"
on public.lunar_economy_model_versions;
create policy "lunar_economy_model_versions_manage_staff"
on public.lunar_economy_model_versions
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_economy_model_assumptions_select_public"
on public.lunar_economy_model_assumptions;
create policy "lunar_economy_model_assumptions_select_public"
on public.lunar_economy_model_assumptions
for select
to anon, authenticated
using (
    is_public
    and exists (
        select 1
        from public.lunar_economy_model_versions model_version
        where model_version.id =
            lunar_economy_model_assumptions.model_version_id
            and model_version.status = 'active'
            and model_version.is_public
            and model_version.valid_from <= current_date
            and (
                model_version.valid_to is null
                or model_version.valid_to >= current_date
            )
            and (
                model_version.published_at is null
                or model_version.published_at <= now()
            )
    )
);

drop policy if exists "lunar_economy_model_assumptions_select_staff"
on public.lunar_economy_model_assumptions;
create policy "lunar_economy_model_assumptions_select_staff"
on public.lunar_economy_model_assumptions
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_economy_model_assumptions_manage_staff"
on public.lunar_economy_model_assumptions;
create policy "lunar_economy_model_assumptions_manage_staff"
on public.lunar_economy_model_assumptions
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_economy_source_documents_select_public"
on public.lunar_economy_source_documents;
create policy "lunar_economy_source_documents_select_public"
on public.lunar_economy_source_documents
for select
to anon, authenticated
using (
    is_public
    and review_status = 'approved'
    and exists (
        select 1
        from public.lunar_economy_model_versions model_version
        where model_version.id =
            lunar_economy_source_documents.model_version_id
            and model_version.status = 'active'
            and model_version.is_public
            and model_version.valid_from <= current_date
            and (
                model_version.valid_to is null
                or model_version.valid_to >= current_date
            )
            and (
                model_version.published_at is null
                or model_version.published_at <= now()
            )
    )
);

drop policy if exists "lunar_economy_source_documents_select_staff"
on public.lunar_economy_source_documents;
create policy "lunar_economy_source_documents_select_staff"
on public.lunar_economy_source_documents
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_economy_source_documents_manage_staff"
on public.lunar_economy_source_documents;
create policy "lunar_economy_source_documents_manage_staff"
on public.lunar_economy_source_documents
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_economy_assumption_sources_select_public"
on public.lunar_economy_assumption_sources;
create policy "lunar_economy_assumption_sources_select_public"
on public.lunar_economy_assumption_sources
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.lunar_economy_model_assumptions assumption
        join public.lunar_economy_source_documents source_document
            on source_document.id =
                lunar_economy_assumption_sources.source_document_id
        join public.lunar_economy_model_versions model_version
            on model_version.id = assumption.model_version_id
        where assumption.id =
            lunar_economy_assumption_sources.assumption_id
            and source_document.model_version_id = model_version.id
            and assumption.is_public
            and source_document.is_public
            and source_document.review_status = 'approved'
            and model_version.status = 'active'
            and model_version.is_public
            and model_version.valid_from <= current_date
            and (
                model_version.valid_to is null
                or model_version.valid_to >= current_date
            )
            and (
                model_version.published_at is null
                or model_version.published_at <= now()
            )
    )
);

drop policy if exists "lunar_economy_assumption_sources_select_staff"
on public.lunar_economy_assumption_sources;
create policy "lunar_economy_assumption_sources_select_staff"
on public.lunar_economy_assumption_sources
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_economy_assumption_sources_manage_staff"
on public.lunar_economy_assumption_sources;
create policy "lunar_economy_assumption_sources_manage_staff"
on public.lunar_economy_assumption_sources
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_economy_scenario_estimates_select_public"
on public.lunar_economy_scenario_estimates;
create policy "lunar_economy_scenario_estimates_select_public"
on public.lunar_economy_scenario_estimates
for select
to anon, authenticated
using (
    is_public
    and publication_status = 'published'
    and estimate_date <= current_date
    and exists (
        select 1
        from public.lunar_economy_model_versions model_version
        where model_version.id =
            lunar_economy_scenario_estimates.model_version_id
            and model_version.status = 'active'
            and model_version.is_public
            and model_version.valid_from <= current_date
            and (
                model_version.valid_to is null
                or model_version.valid_to >= current_date
            )
            and (
                model_version.published_at is null
                or model_version.published_at <= now()
            )
    )
);

drop policy if exists "lunar_economy_scenario_estimates_select_staff"
on public.lunar_economy_scenario_estimates;
create policy "lunar_economy_scenario_estimates_select_staff"
on public.lunar_economy_scenario_estimates
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_economy_scenario_estimates_manage_staff"
on public.lunar_economy_scenario_estimates;
create policy "lunar_economy_scenario_estimates_manage_staff"
on public.lunar_economy_scenario_estimates
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_economy_daily_outputs_select_public"
on public.lunar_economy_daily_outputs;
create policy "lunar_economy_daily_outputs_select_public"
on public.lunar_economy_daily_outputs
for select
to anon, authenticated
using (
    is_public
    and publication_status = 'published'
    and output_date <= current_date
    and exists (
        select 1
        from public.lunar_economy_model_versions model_version
        where model_version.id =
            lunar_economy_daily_outputs.model_version_id
            and model_version.status = 'active'
            and model_version.is_public
            and model_version.valid_from <= current_date
            and (
                model_version.valid_to is null
                or model_version.valid_to >= current_date
            )
            and (
                model_version.published_at is null
                or model_version.published_at <= now()
            )
    )
);

drop policy if exists "lunar_economy_daily_outputs_select_staff"
on public.lunar_economy_daily_outputs;
create policy "lunar_economy_daily_outputs_select_staff"
on public.lunar_economy_daily_outputs
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_economy_daily_outputs_manage_staff"
on public.lunar_economy_daily_outputs;
create policy "lunar_economy_daily_outputs_manage_staff"
on public.lunar_economy_daily_outputs
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));
