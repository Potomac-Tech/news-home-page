create table if not exists public.public_space_company_quotes (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null
        references public.public_space_companies(id)
        on delete cascade,
    company_name_snapshot text not null,
    ticker_symbol_snapshot text not null,
    exchange_code_snapshot text not null,
    quote_as_of_at timestamptz not null,
    source_name text not null,
    source_url text,
    source_retrieved_at timestamptz not null default now(),
    delay_minutes integer not null default 15,
    currency_code text not null default 'USD',
    last_price numeric(20, 4) not null,
    price_change numeric(20, 4),
    price_change_percent numeric(10, 4),
    market_state text not null default 'delayed',
    is_displayable boolean not null default false,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint public_space_company_quotes_company_name_not_blank check (
        length(trim(company_name_snapshot)) > 0
    ),
    constraint public_space_company_quotes_ticker_not_blank check (
        length(trim(ticker_symbol_snapshot)) > 0
    ),
    constraint public_space_company_quotes_exchange_not_blank check (
        length(trim(exchange_code_snapshot)) > 0
    ),
    constraint public_space_company_quotes_source_not_blank check (
        length(trim(source_name)) > 0
    ),
    constraint public_space_company_quotes_delay_nonnegative check (
        delay_minutes >= 0
    ),
    constraint public_space_company_quotes_currency_format check (
        currency_code = upper(currency_code)
        and currency_code ~ '^[A-Z]{3}$'
    ),
    constraint public_space_company_quotes_price_nonnegative check (
        last_price >= 0
    )
);

create unique index if not exists public_space_company_quotes_company_time_key
on public.public_space_company_quotes (
    company_id,
    quote_as_of_at,
    lower(source_name)
);

create index if not exists public_space_company_quotes_display_idx
on public.public_space_company_quotes (
    is_displayable,
    quote_as_of_at desc,
    company_id
);

drop trigger if exists set_public_space_company_quotes_updated_at
on public.public_space_company_quotes;
create trigger set_public_space_company_quotes_updated_at
before update on public.public_space_company_quotes
for each row execute function public.set_updated_at();

alter table public.public_space_company_quotes enable row level security;

grant select (
    id,
    company_id,
    company_name_snapshot,
    ticker_symbol_snapshot,
    exchange_code_snapshot,
    quote_as_of_at,
    source_name,
    source_url,
    source_retrieved_at,
    delay_minutes,
    currency_code,
    last_price,
    price_change,
    price_change_percent,
    market_state,
    is_displayable,
    created_at,
    updated_at
) on public.public_space_company_quotes to anon, authenticated;

grant insert, update, delete on public.public_space_company_quotes
to authenticated;

grant all on public.public_space_company_quotes to service_role;

drop policy if exists "public_space_company_quotes_select_displayable"
on public.public_space_company_quotes;
create policy "public_space_company_quotes_select_displayable"
on public.public_space_company_quotes
for select
to anon, authenticated
using (
    is_displayable
    and quote_as_of_at <= now()
);

drop policy if exists "public_space_company_quotes_select_staff"
on public.public_space_company_quotes;
create policy "public_space_company_quotes_select_staff"
on public.public_space_company_quotes
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "public_space_company_quotes_manage_staff"
on public.public_space_company_quotes;
create policy "public_space_company_quotes_manage_staff"
on public.public_space_company_quotes
for all
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));
