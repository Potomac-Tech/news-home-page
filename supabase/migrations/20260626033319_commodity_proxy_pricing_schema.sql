do $$
begin
    create type public.commodity_record_status as enum (
        'draft',
        'active',
        'retired'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.commodity_pricing_method as enum (
        'direct_market',
        'proxy_formula',
        'analyst_estimate',
        'composite'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.commodity_confidence_label as enum (
        'experimental',
        'low',
        'medium',
        'high'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.lunar_commodities (
    id uuid primary key default gen_random_uuid(),
    slug text not null,
    name text not null,
    symbol text not null,
    category text not null,
    unit_name text not null,
    unit_symbol text not null,
    description text not null default '',
    lunar_relevance text not null default '',
    status public.commodity_record_status not null default 'draft',
    update_cadence text not null default 'weekly',
    confidence_label public.commodity_confidence_label not null
        default 'experimental',
    display_order integer not null default 100,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_commodities_slug_not_blank check (length(trim(slug)) > 0),
    constraint lunar_commodities_name_not_blank check (length(trim(name)) > 0),
    constraint lunar_commodities_symbol_not_blank check (
        length(trim(symbol)) > 0
    ),
    constraint lunar_commodities_category_not_blank check (
        length(trim(category)) > 0
    ),
    constraint lunar_commodities_unit_name_not_blank check (
        length(trim(unit_name)) > 0
    ),
    constraint lunar_commodities_unit_symbol_not_blank check (
        length(trim(unit_symbol)) > 0
    ),
    constraint lunar_commodities_update_cadence_not_blank check (
        length(trim(update_cadence)) > 0
    ),
    constraint lunar_commodities_display_order_nonnegative check (
        display_order >= 0
    )
);

create unique index if not exists lunar_commodities_slug_key
on public.lunar_commodities (lower(slug));

create unique index if not exists lunar_commodities_symbol_key
on public.lunar_commodities (upper(symbol));

create index if not exists lunar_commodities_status_display_idx
on public.lunar_commodities (status, display_order, name);

drop trigger if exists set_lunar_commodities_updated_at
on public.lunar_commodities;
create trigger set_lunar_commodities_updated_at
before update on public.lunar_commodities
for each row execute function public.set_updated_at();

create table if not exists public.lunar_commodity_proxy_models (
    id uuid primary key default gen_random_uuid(),
    commodity_id uuid not null
        references public.lunar_commodities(id)
        on delete cascade,
    model_name text not null,
    pricing_method public.commodity_pricing_method not null
        default 'proxy_formula',
    formula_markdown text not null,
    assumptions jsonb not null default '{}'::jsonb,
    output_unit_symbol text not null,
    update_cadence text not null default 'weekly',
    confidence_label public.commodity_confidence_label not null
        default 'experimental',
    status public.commodity_record_status not null default 'draft',
    effective_from date,
    effective_to date,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_commodity_proxy_models_name_not_blank check (
        length(trim(model_name)) > 0
    ),
    constraint lunar_commodity_proxy_models_formula_not_blank check (
        length(trim(formula_markdown)) > 0
    ),
    constraint lunar_commodity_proxy_models_assumptions_object check (
        jsonb_typeof(assumptions) = 'object'
    ),
    constraint lunar_commodity_proxy_models_unit_not_blank check (
        length(trim(output_unit_symbol)) > 0
    ),
    constraint lunar_commodity_proxy_models_cadence_not_blank check (
        length(trim(update_cadence)) > 0
    ),
    constraint lunar_commodity_proxy_models_effective_dates check (
        effective_to is null
        or effective_from is null
        or effective_to >= effective_from
    )
);

create index if not exists lunar_commodity_proxy_models_commodity_idx
on public.lunar_commodity_proxy_models (commodity_id, status, effective_from);

drop trigger if exists set_lunar_commodity_proxy_models_updated_at
on public.lunar_commodity_proxy_models;
create trigger set_lunar_commodity_proxy_models_updated_at
before update on public.lunar_commodity_proxy_models
for each row execute function public.set_updated_at();

create table if not exists public.lunar_commodity_price_observations (
    id uuid primary key default gen_random_uuid(),
    commodity_id uuid not null
        references public.lunar_commodities(id)
        on delete cascade,
    proxy_model_id uuid
        references public.lunar_commodity_proxy_models(id)
        on delete set null,
    observed_at timestamptz not null,
    price_value numeric(20, 6) not null,
    currency_code text not null default 'USD',
    unit_symbol text not null,
    source_name text not null,
    source_url text,
    source_retrieved_at timestamptz not null default now(),
    confidence_label public.commodity_confidence_label not null
        default 'experimental',
    notes text,
    is_displayable boolean not null default false,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_commodity_price_observations_price_nonnegative check (
        price_value >= 0
    ),
    constraint lunar_commodity_price_observations_currency_format check (
        currency_code = upper(currency_code)
        and currency_code ~ '^[A-Z]{3}$'
    ),
    constraint lunar_commodity_price_observations_unit_not_blank check (
        length(trim(unit_symbol)) > 0
    ),
    constraint lunar_commodity_price_observations_source_not_blank check (
        length(trim(source_name)) > 0
    )
);

create unique index if not exists lunar_commodity_price_observations_key
on public.lunar_commodity_price_observations (
    commodity_id,
    observed_at,
    lower(source_name)
);

create index if not exists lunar_commodity_price_observations_display_idx
on public.lunar_commodity_price_observations (
    is_displayable,
    observed_at desc,
    commodity_id
);

drop trigger if exists set_lunar_commodity_price_observations_updated_at
on public.lunar_commodity_price_observations;
create trigger set_lunar_commodity_price_observations_updated_at
before update on public.lunar_commodity_price_observations
for each row execute function public.set_updated_at();

create table if not exists public.lunar_commodity_source_citations (
    id uuid primary key default gen_random_uuid(),
    commodity_id uuid
        references public.lunar_commodities(id)
        on delete cascade,
    proxy_model_id uuid
        references public.lunar_commodity_proxy_models(id)
        on delete cascade,
    price_observation_id uuid
        references public.lunar_commodity_price_observations(id)
        on delete cascade,
    citation_type text not null default 'source',
    title text not null,
    publisher text,
    url text,
    published_at date,
    retrieved_at timestamptz,
    summary text,
    license_notes text,
    display_order integer not null default 100,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint lunar_commodity_source_citations_target check (
        commodity_id is not null
        or proxy_model_id is not null
        or price_observation_id is not null
    ),
    constraint lunar_commodity_source_citations_type_not_blank check (
        length(trim(citation_type)) > 0
    ),
    constraint lunar_commodity_source_citations_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint lunar_commodity_source_citations_order_nonnegative check (
        display_order >= 0
    )
);

create index if not exists lunar_commodity_source_citations_commodity_idx
on public.lunar_commodity_source_citations (commodity_id, display_order);

create index if not exists lunar_commodity_source_citations_model_idx
on public.lunar_commodity_source_citations (proxy_model_id, display_order);

create index if not exists lunar_commodity_source_citations_price_idx
on public.lunar_commodity_source_citations (
    price_observation_id,
    display_order
);

drop trigger if exists set_lunar_commodity_source_citations_updated_at
on public.lunar_commodity_source_citations;
create trigger set_lunar_commodity_source_citations_updated_at
before update on public.lunar_commodity_source_citations
for each row execute function public.set_updated_at();

alter table public.lunar_commodities enable row level security;
alter table public.lunar_commodity_proxy_models enable row level security;
alter table public.lunar_commodity_price_observations enable row level security;
alter table public.lunar_commodity_source_citations enable row level security;

grant select (
    id,
    slug,
    name,
    symbol,
    category,
    unit_name,
    unit_symbol,
    description,
    lunar_relevance,
    status,
    update_cadence,
    confidence_label,
    display_order,
    updated_at
) on public.lunar_commodities to anon, authenticated;

grant select (
    id,
    commodity_id,
    model_name,
    pricing_method,
    formula_markdown,
    assumptions,
    output_unit_symbol,
    update_cadence,
    confidence_label,
    status,
    effective_from,
    effective_to,
    updated_at
) on public.lunar_commodity_proxy_models to anon, authenticated;

grant select (
    id,
    commodity_id,
    proxy_model_id,
    observed_at,
    price_value,
    currency_code,
    unit_symbol,
    source_name,
    source_url,
    source_retrieved_at,
    confidence_label,
    notes,
    is_displayable,
    updated_at
) on public.lunar_commodity_price_observations to anon, authenticated;

grant select (
    id,
    commodity_id,
    proxy_model_id,
    price_observation_id,
    citation_type,
    title,
    publisher,
    url,
    published_at,
    retrieved_at,
    summary,
    license_notes,
    display_order,
    updated_at
) on public.lunar_commodity_source_citations to anon, authenticated;

grant insert, update, delete on
    public.lunar_commodities,
    public.lunar_commodity_proxy_models,
    public.lunar_commodity_price_observations,
    public.lunar_commodity_source_citations
to authenticated;

grant all on
    public.lunar_commodities,
    public.lunar_commodity_proxy_models,
    public.lunar_commodity_price_observations,
    public.lunar_commodity_source_citations
to service_role;

drop policy if exists "lunar_commodities_select_public_active"
on public.lunar_commodities;
create policy "lunar_commodities_select_public_active"
on public.lunar_commodities
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "lunar_commodities_select_staff"
on public.lunar_commodities;
create policy "lunar_commodities_select_staff"
on public.lunar_commodities
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_commodities_manage_staff"
on public.lunar_commodities;
create policy "lunar_commodities_manage_staff"
on public.lunar_commodities
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_commodity_proxy_models_select_public_active"
on public.lunar_commodity_proxy_models;
create policy "lunar_commodity_proxy_models_select_public_active"
on public.lunar_commodity_proxy_models
for select
to anon, authenticated
using (
    status = 'active'
    and exists (
        select 1
        from public.lunar_commodities commodity
        where commodity.id = lunar_commodity_proxy_models.commodity_id
            and commodity.status = 'active'
    )
);

drop policy if exists "lunar_commodity_proxy_models_select_staff"
on public.lunar_commodity_proxy_models;
create policy "lunar_commodity_proxy_models_select_staff"
on public.lunar_commodity_proxy_models
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_commodity_proxy_models_manage_staff"
on public.lunar_commodity_proxy_models;
create policy "lunar_commodity_proxy_models_manage_staff"
on public.lunar_commodity_proxy_models
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_commodity_price_observations_select_public"
on public.lunar_commodity_price_observations;
create policy "lunar_commodity_price_observations_select_public"
on public.lunar_commodity_price_observations
for select
to anon, authenticated
using (
    is_displayable
    and observed_at <= now()
    and exists (
        select 1
        from public.lunar_commodities commodity
        where commodity.id =
            lunar_commodity_price_observations.commodity_id
            and commodity.status = 'active'
    )
);

drop policy if exists "lunar_commodity_price_observations_select_staff"
on public.lunar_commodity_price_observations;
create policy "lunar_commodity_price_observations_select_staff"
on public.lunar_commodity_price_observations
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_commodity_price_observations_manage_staff"
on public.lunar_commodity_price_observations;
create policy "lunar_commodity_price_observations_manage_staff"
on public.lunar_commodity_price_observations
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_commodity_source_citations_select_public"
on public.lunar_commodity_source_citations;
create policy "lunar_commodity_source_citations_select_public"
on public.lunar_commodity_source_citations
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.lunar_commodities commodity
        where commodity.id = lunar_commodity_source_citations.commodity_id
            and commodity.status = 'active'
    )
    or exists (
        select 1
        from public.lunar_commodity_proxy_models proxy_model
        join public.lunar_commodities commodity
            on commodity.id = proxy_model.commodity_id
        where proxy_model.id =
            lunar_commodity_source_citations.proxy_model_id
            and proxy_model.status = 'active'
            and commodity.status = 'active'
    )
    or exists (
        select 1
        from public.lunar_commodity_price_observations price_observation
        join public.lunar_commodities commodity
            on commodity.id = price_observation.commodity_id
        where price_observation.id =
            lunar_commodity_source_citations.price_observation_id
            and price_observation.is_displayable
            and price_observation.observed_at <= now()
            and commodity.status = 'active'
    )
);

drop policy if exists "lunar_commodity_source_citations_select_staff"
on public.lunar_commodity_source_citations;
create policy "lunar_commodity_source_citations_select_staff"
on public.lunar_commodity_source_citations
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "lunar_commodity_source_citations_manage_staff"
on public.lunar_commodity_source_citations;
create policy "lunar_commodity_source_citations_manage_staff"
on public.lunar_commodity_source_citations
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));
