do $$
begin
    create type public.public_company_status as enum (
        'watchlist',
        'active',
        'inactive',
        'delisted',
        'excluded'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.public_company_ranking_metric as enum (
        'market_cap_usd',
        'enterprise_value_usd',
        'revenue_ttm_usd',
        'space_revenue_estimate_usd'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.public_company_ranking_status as enum (
        'draft',
        'published',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.public_space_companies (
    id uuid primary key default gen_random_uuid(),
    company_name text not null,
    ticker_symbol text not null,
    exchange_code text not null,
    country_code text,
    website_url text,
    investor_relations_url text,
    sector text not null default 'Space infrastructure',
    lunar_relevance text not null default '',
    status public.public_company_status not null default 'watchlist',
    ranking_eligible boolean not null default false,
    ranking_metric public.public_company_ranking_metric not null
        default 'market_cap_usd',
    ranking_metric_value numeric(20, 2),
    ranking_metric_currency text not null default 'USD',
    ranking_metric_as_of_date date,
    ranking_source_name text,
    ranking_source_url text,
    ranking_source_retrieved_at timestamptz,
    eligibility_notes text,
    exclusion_reason text,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint public_space_companies_name_not_blank check (
        length(trim(company_name)) > 0
    ),
    constraint public_space_companies_ticker_not_blank check (
        length(trim(ticker_symbol)) > 0
    ),
    constraint public_space_companies_exchange_not_blank check (
        length(trim(exchange_code)) > 0
    ),
    constraint public_space_companies_sector_not_blank check (
        length(trim(sector)) > 0
    ),
    constraint public_space_companies_metric_nonnegative check (
        ranking_metric_value is null
        or ranking_metric_value >= 0
    ),
    constraint public_space_companies_metric_currency_format check (
        ranking_metric_currency = upper(ranking_metric_currency)
        and ranking_metric_currency ~ '^[A-Z]{3}$'
    ),
    constraint public_space_companies_country_code_format check (
        country_code is null
        or (
            country_code = upper(country_code)
            and country_code ~ '^[A-Z]{2}$'
        )
    )
);

create unique index if not exists public_space_companies_ticker_exchange_key
on public.public_space_companies (
    upper(ticker_symbol),
    upper(exchange_code)
);

create index if not exists public_space_companies_ranking_idx
on public.public_space_companies (
    status,
    ranking_eligible,
    ranking_metric,
    ranking_metric_value desc
);

drop trigger if exists set_public_space_companies_updated_at
on public.public_space_companies;
create trigger set_public_space_companies_updated_at
before update on public.public_space_companies
for each row execute function public.set_updated_at();

create table if not exists public.public_space_company_ranking_runs (
    id uuid primary key default gen_random_uuid(),
    ranking_metric public.public_company_ranking_metric not null,
    ranking_date date not null default current_date,
    source_name text not null,
    source_url text,
    source_retrieved_at timestamptz not null default now(),
    publication_status public.public_company_ranking_status not null
        default 'draft',
    notes text,
    generated_by uuid references auth.users(id) on delete set null,
    generated_at timestamptz not null default now(),
    published_at timestamptz,
    updated_at timestamptz not null default now(),
    constraint public_space_company_ranking_runs_source_not_blank check (
        length(trim(source_name)) > 0
    )
);

create index if not exists public_space_company_ranking_runs_status_idx
on public.public_space_company_ranking_runs (
    publication_status,
    ranking_metric,
    ranking_date desc
);

drop trigger if exists set_public_space_company_ranking_runs_updated_at
on public.public_space_company_ranking_runs;
create trigger set_public_space_company_ranking_runs_updated_at
before update on public.public_space_company_ranking_runs
for each row execute function public.set_updated_at();

create table if not exists public.public_space_company_rankings (
    id uuid primary key default gen_random_uuid(),
    ranking_run_id uuid not null
        references public.public_space_company_ranking_runs(id)
        on delete cascade,
    company_id uuid not null
        references public.public_space_companies(id)
        on delete restrict,
    rank_number integer not null,
    ranking_metric_value numeric(20, 2) not null,
    metric_as_of_date date not null,
    company_name_snapshot text not null,
    ticker_symbol_snapshot text not null,
    exchange_code_snapshot text not null,
    company_metric_source_name text,
    company_metric_source_url text,
    created_at timestamptz not null default now(),
    constraint public_space_company_rankings_rank_range check (
        rank_number between 1 and 20
    ),
    constraint public_space_company_rankings_metric_nonnegative check (
        ranking_metric_value >= 0
    )
);

create unique index if not exists public_space_company_rankings_run_rank_key
on public.public_space_company_rankings (ranking_run_id, rank_number);

create unique index if not exists public_space_company_rankings_run_company_key
on public.public_space_company_rankings (ranking_run_id, company_id);

create index if not exists public_space_company_rankings_company_idx
on public.public_space_company_rankings (company_id, rank_number);

create or replace function app_private.create_public_company_top20_ranking(
    target_metric public.public_company_ranking_metric,
    target_ranking_date date,
    source_name text,
    source_url text default null,
    notes text default null,
    publish_snapshot boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
declare
    ranking_run_id uuid;
    ranked_count integer;
begin
    if auth.role() <> 'service_role'
        and not app_private.has_any_role(
            array['editor', 'analyst', 'admin']
        )
    then
        raise exception 'Insufficient permission to create company ranking.';
    end if;

    if target_metric is null then
        raise exception 'Ranking metric is required.';
    end if;

    if target_ranking_date is null then
        raise exception 'Ranking date is required.';
    end if;

    if source_name is null or length(trim(source_name)) = 0 then
        raise exception 'Ranking source name is required.';
    end if;

    insert into public.public_space_company_ranking_runs (
        ranking_metric,
        ranking_date,
        source_name,
        source_url,
        publication_status,
        notes,
        generated_by,
        published_at
    )
    values (
        target_metric,
        target_ranking_date,
        trim(source_name),
        nullif(trim(coalesce(source_url, '')), ''),
        case when publish_snapshot then 'published' else 'draft' end,
        nullif(trim(coalesce(notes, '')), ''),
        auth.uid(),
        case when publish_snapshot then now() else null end
    )
    returning id into ranking_run_id;

    insert into public.public_space_company_rankings (
        ranking_run_id,
        company_id,
        rank_number,
        ranking_metric_value,
        metric_as_of_date,
        company_name_snapshot,
        ticker_symbol_snapshot,
        exchange_code_snapshot,
        company_metric_source_name,
        company_metric_source_url
    )
    select
        ranking_run_id,
        ranked.company_id,
        ranked.rank_number,
        ranked.ranking_metric_value,
        ranked.metric_as_of_date,
        ranked.company_name_snapshot,
        ranked.ticker_symbol_snapshot,
        ranked.exchange_code_snapshot,
        ranked.company_metric_source_name,
        ranked.company_metric_source_url
    from (
        select
            company.id as company_id,
            (row_number() over (
                order by
                    company.ranking_metric_value desc,
                    company.company_name asc
            ))::integer as rank_number,
            company.ranking_metric_value,
            company.ranking_metric_as_of_date as metric_as_of_date,
            company.company_name as company_name_snapshot,
            company.ticker_symbol as ticker_symbol_snapshot,
            company.exchange_code as exchange_code_snapshot,
            company.ranking_source_name as company_metric_source_name,
            company.ranking_source_url as company_metric_source_url
        from public.public_space_companies company
        where company.status = 'active'
            and company.ranking_eligible
            and company.ranking_metric = target_metric
            and company.ranking_metric_value is not null
            and company.ranking_metric_as_of_date is not null
        order by
            company.ranking_metric_value desc,
            company.company_name asc
        limit 20
    ) ranked;

    get diagnostics ranked_count = row_count;

    if ranked_count = 0 then
        raise exception
            'No eligible companies with complete metric data were found.';
    end if;

    return ranking_run_id;
end;
$$;

alter table public.public_space_companies enable row level security;
alter table public.public_space_company_ranking_runs enable row level security;
alter table public.public_space_company_rankings enable row level security;

grant select (
    id,
    company_name,
    ticker_symbol,
    exchange_code,
    country_code,
    website_url,
    sector,
    lunar_relevance,
    status,
    ranking_eligible,
    ranking_metric,
    ranking_metric_value,
    ranking_metric_currency,
    ranking_metric_as_of_date,
    ranking_source_name,
    ranking_source_url,
    ranking_source_retrieved_at,
    updated_at
) on public.public_space_companies to anon;

grant select (
    id,
    ranking_metric,
    ranking_date,
    source_name,
    source_url,
    source_retrieved_at,
    publication_status,
    generated_at,
    published_at
) on public.public_space_company_ranking_runs to anon;

grant select (
    id,
    ranking_run_id,
    company_id,
    rank_number,
    ranking_metric_value,
    metric_as_of_date,
    company_name_snapshot,
    ticker_symbol_snapshot,
    exchange_code_snapshot,
    company_metric_source_name,
    company_metric_source_url,
    created_at
) on public.public_space_company_rankings to anon;

grant select, insert, update, delete on
    public.public_space_companies,
    public.public_space_company_ranking_runs,
    public.public_space_company_rankings
to authenticated;

grant all on
    public.public_space_companies,
    public.public_space_company_ranking_runs,
    public.public_space_company_rankings
to service_role;

grant execute on function
    app_private.create_public_company_top20_ranking(
        public.public_company_ranking_metric,
        date,
        text,
        text,
        text,
        boolean
    )
to authenticated, service_role;

drop policy if exists "public_space_companies_select_public_active"
on public.public_space_companies;
create policy "public_space_companies_select_public_active"
on public.public_space_companies
for select
to anon
using (
    status = 'active'
    and ranking_eligible
);

drop policy if exists "public_space_companies_select_staff"
on public.public_space_companies;
create policy "public_space_companies_select_staff"
on public.public_space_companies
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "public_space_companies_manage_staff"
on public.public_space_companies;
create policy "public_space_companies_manage_staff"
on public.public_space_companies
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "public_space_company_ranking_runs_select_public"
on public.public_space_company_ranking_runs;
create policy "public_space_company_ranking_runs_select_public"
on public.public_space_company_ranking_runs
for select
to anon
using (publication_status = 'published');

drop policy if exists "public_space_company_ranking_runs_select_staff"
on public.public_space_company_ranking_runs;
create policy "public_space_company_ranking_runs_select_staff"
on public.public_space_company_ranking_runs
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "public_space_company_ranking_runs_manage_staff"
on public.public_space_company_ranking_runs;
create policy "public_space_company_ranking_runs_manage_staff"
on public.public_space_company_ranking_runs
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "public_space_company_rankings_select_public"
on public.public_space_company_rankings;
create policy "public_space_company_rankings_select_public"
on public.public_space_company_rankings
for select
to anon
using (
    exists (
        select 1
        from public.public_space_company_ranking_runs ranking_run
        where ranking_run.id =
            public_space_company_rankings.ranking_run_id
            and ranking_run.publication_status = 'published'
    )
);

drop policy if exists "public_space_company_rankings_select_staff"
on public.public_space_company_rankings;
create policy "public_space_company_rankings_select_staff"
on public.public_space_company_rankings
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "public_space_company_rankings_manage_staff"
on public.public_space_company_rankings;
create policy "public_space_company_rankings_manage_staff"
on public.public_space_company_rankings
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));
