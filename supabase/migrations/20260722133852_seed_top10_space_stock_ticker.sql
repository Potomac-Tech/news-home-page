drop policy if exists "public_space_companies_select_public_active"
on public.public_space_companies;
create policy "public_space_companies_select_public_active"
on public.public_space_companies
for select
to anon, authenticated
using (
    status = 'active'
    and ranking_eligible
);

drop policy if exists "public_space_company_ranking_runs_select_public"
on public.public_space_company_ranking_runs;
create policy "public_space_company_ranking_runs_select_public"
on public.public_space_company_ranking_runs
for select
to anon, authenticated
using (publication_status = 'published');

drop policy if exists "public_space_company_rankings_select_public"
on public.public_space_company_rankings;
create policy "public_space_company_rankings_select_public"
on public.public_space_company_rankings
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.public_space_company_ranking_runs ranking_run
        where ranking_run.id = public_space_company_rankings.ranking_run_id
            and ranking_run.publication_status = 'published'
    )
);

insert into public.public_space_companies (
    company_name,
    ticker_symbol,
    exchange_code,
    country_code,
    website_url,
    investor_relations_url,
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
    eligibility_notes
)
select *
from (values
    ('Redwire Corporation', 'RDW', 'NYSE', 'US', 'https://redwirespace.com/', 'https://ir.redwirespace.com/', 'Space infrastructure and defense technology', 'Spacecraft components, deployable systems, microgravity infrastructure, and mission systems.', 'active'::public.public_company_status, true, 'market_cap_usd'::public.public_company_ranking_metric, 1832139731::numeric, 'USD', '2026-07-22'::date, 'Public market snapshot', 'https://finance.yahoo.com/quote/RDW/', '2026-07-22T13:34:12Z'::timestamptz, 'NYSE-listed space-focused systems supplier.'),
    ('Rocket Lab USA', 'RKLB', 'NASDAQ', 'US', 'https://www.rocketlabusa.com/', 'https://investors.rocketlabusa.com/', 'Launch and space systems', 'Launch vehicles, spacecraft, and lunar mission systems.', 'active'::public.public_company_status, true, 'market_cap_usd'::public.public_company_ranking_metric, 41847642455::numeric, 'USD', '2026-07-22'::date, 'Public market snapshot', 'https://finance.yahoo.com/quote/RKLB/', '2026-07-22T13:21:18Z'::timestamptz, 'U.S.-listed space-focused operator.'),
    ('EchoStar', 'ECHO', 'NASDAQ', 'US', 'https://www.echostar.com/', 'https://ir.echostar.com/', 'Satellite communications', 'Satellite communications and space-network infrastructure.', 'active'::public.public_company_status, true, 'market_cap_usd'::public.public_company_ranking_metric, 27386966640::numeric, 'USD', '2026-07-22'::date, 'Public market snapshot', 'https://finance.yahoo.com/quote/ECHO/', '2026-07-22T12:23:59Z'::timestamptz, 'U.S.-listed satellite and space-network operator.'),
    ('AST SpaceMobile', 'ASTS', 'NASDAQ', 'US', 'https://ast-science.com/', 'https://investors.ast-science.com/', 'Satellite communications', 'Direct-to-device communications and cislunar communications comparables.', 'active'::public.public_company_status, true, 'market_cap_usd'::public.public_company_ranking_metric, 18412270206::numeric, 'USD', '2026-07-22'::date, 'Public market snapshot', 'https://finance.yahoo.com/quote/ASTS/', '2026-07-22T13:20:37Z'::timestamptz, 'U.S.-listed space-focused operator.'),
    ('Viasat', 'VSAT', 'NASDAQ', 'US', 'https://www.viasat.com/', 'https://investors.viasat.com/', 'Satellite communications', 'Space communications infrastructure and network services.', 'active'::public.public_company_status, true, 'market_cap_usd'::public.public_company_ranking_metric, 10384026350::numeric, 'USD', '2026-07-22'::date, 'Public market snapshot', 'https://finance.yahoo.com/quote/VSAT/', '2026-07-22T13:18:08Z'::timestamptz, 'U.S.-listed satellite and space-network operator.'),
    ('Globalstar', 'GSAT', 'NASDAQ', 'US', 'https://www.globalstar.com/', 'https://investors.globalstar.com/', 'Satellite communications', 'Satellite spectrum and communications infrastructure.', 'active'::public.public_company_status, true, 'market_cap_usd'::public.public_company_ranking_metric, 10256665790::numeric, 'USD', '2026-07-22'::date, 'Public market snapshot', 'https://finance.yahoo.com/quote/GSAT/', '2026-07-22T11:00:00Z'::timestamptz, 'U.S.-listed satellite and space-network operator.'),
    ('Planet Labs', 'PL', 'NYSE', 'US', 'https://www.planet.com/', 'https://investors.planet.com/', 'Earth observation and data', 'Space-derived data markets and lunar-data commercial comparables.', 'active'::public.public_company_status, true, 'market_cap_usd'::public.public_company_ranking_metric, 7981611977::numeric, 'USD', '2026-07-22'::date, 'Public market snapshot', 'https://finance.yahoo.com/quote/PL/', '2026-07-22T13:20:19Z'::timestamptz, 'U.S.-listed space-focused operator.'),
    ('Karman Holdings', 'KRMN', 'NYSE', 'US', 'https://www.karman-sd.com/', 'https://investors.karman-sd.com/', 'Space and defense systems', 'Mission-critical propulsion, payload, and launch-system components.', 'active'::public.public_company_status, true, 'market_cap_usd'::public.public_company_ranking_metric, 6184988420::numeric, 'USD', '2026-07-22'::date, 'Public market snapshot', 'https://finance.yahoo.com/quote/KRMN/', '2026-07-22T13:06:02Z'::timestamptz, 'U.S.-listed space-focused systems supplier.'),
    ('Iridium Communications', 'IRDM', 'NASDAQ', 'US', 'https://www.iridium.com/', 'https://investor.iridium.com/', 'Satellite communications', 'Resilient satellite communications and navigation-adjacent services.', 'active'::public.public_company_status, true, 'market_cap_usd'::public.public_company_ranking_metric, 5033752680::numeric, 'USD', '2026-07-22'::date, 'Public market snapshot', 'https://finance.yahoo.com/quote/IRDM/', '2026-07-22T13:21:00Z'::timestamptz, 'U.S.-listed satellite operator.'),
    ('Firefly Aerospace', 'FLY', 'NASDAQ', 'US', 'https://fireflyspace.com/', 'https://investors.fireflyspace.com/', 'Launch and lunar delivery', 'CLPS lunar delivery, launch vehicles, and spacecraft.', 'active'::public.public_company_status, true, 'market_cap_usd'::public.public_company_ranking_metric, 3369979290::numeric, 'USD', '2026-07-22'::date, 'Public market snapshot', 'https://finance.yahoo.com/quote/FLY/', '2026-07-22T13:17:09Z'::timestamptz, 'U.S.-listed space-focused operator.')
) as seed (
    company_name, ticker_symbol, exchange_code, country_code, website_url,
    investor_relations_url, sector, lunar_relevance, status, ranking_eligible,
    ranking_metric, ranking_metric_value, ranking_metric_currency,
    ranking_metric_as_of_date, ranking_source_name, ranking_source_url,
    ranking_source_retrieved_at, eligibility_notes
)
on conflict (upper(ticker_symbol), upper(exchange_code)) do update set
    company_name = excluded.company_name,
    country_code = excluded.country_code,
    website_url = excluded.website_url,
    investor_relations_url = excluded.investor_relations_url,
    sector = excluded.sector,
    lunar_relevance = excluded.lunar_relevance,
    status = excluded.status,
    ranking_eligible = excluded.ranking_eligible,
    ranking_metric = excluded.ranking_metric,
    ranking_metric_value = excluded.ranking_metric_value,
    ranking_metric_currency = excluded.ranking_metric_currency,
    ranking_metric_as_of_date = excluded.ranking_metric_as_of_date,
    ranking_source_name = excluded.ranking_source_name,
    ranking_source_url = excluded.ranking_source_url,
    ranking_source_retrieved_at = excluded.ranking_source_retrieved_at,
    eligibility_notes = excluded.eligibility_notes;

insert into public.public_space_company_quotes (
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
    is_displayable
)
select
    company.id,
    company.company_name,
    company.ticker_symbol,
    company.exchange_code,
    quote.quote_as_of_at,
    'Yahoo Finance delayed market snapshot',
    'https://finance.yahoo.com/quote/' || company.ticker_symbol || '/',
    quote.quote_as_of_at,
    15,
    'USD',
    quote.last_price,
    quote.price_change,
    quote.price_change_percent,
    'delayed',
    true
from (values
    ('RDW', '2026-07-22T13:34:12Z'::timestamptz, 9.485::numeric, 0.065::numeric, 0.690::numeric),
    ('RKLB', '2026-07-22T13:21:18Z'::timestamptz, 69.12::numeric, 3.38::numeric, 5.141::numeric),
    ('ECHO', '2026-07-22T12:23:59Z'::timestamptz, 94.76::numeric, 4.44::numeric, 4.915::numeric),
    ('ASTS', '2026-07-22T13:20:37Z'::timestamptz, 63.34::numeric, 5.91::numeric, 10.293::numeric),
    ('VSAT', '2026-07-22T13:18:08Z'::timestamptz, 73.69::numeric, 4.15::numeric, 5.970::numeric),
    ('GSAT', '2026-07-22T11:00:00Z'::timestamptz, 79.87::numeric, 0.55::numeric, 0.693::numeric),
    ('PL', '2026-07-22T13:20:19Z'::timestamptz, 23.10::numeric, 0.97::numeric, 4.379::numeric),
    ('KRMN', '2026-07-22T13:06:02Z'::timestamptz, 46.67::numeric, 1.76::numeric, 3.919::numeric),
    ('IRDM', '2026-07-22T13:21:00Z'::timestamptz, 47.24::numeric, 0.82::numeric, 1.767::numeric),
    ('FLY', '2026-07-22T13:17:09Z'::timestamptz, 21.11::numeric, 1.42::numeric, 7.219::numeric)
) as quote (ticker_symbol, quote_as_of_at, last_price, price_change, price_change_percent)
join public.public_space_companies company
    on upper(company.ticker_symbol) = quote.ticker_symbol
on conflict (company_id, quote_as_of_at, lower(source_name)) do update set
    last_price = excluded.last_price,
    price_change = excluded.price_change,
    price_change_percent = excluded.price_change_percent,
    is_displayable = true;

do $$
declare
    new_ranking_run_id uuid;
begin
    update public.public_space_company_ranking_runs
    set publication_status = 'archived', updated_at = now()
    where publication_status = 'published'
        and ranking_metric = 'market_cap_usd';

    insert into public.public_space_company_ranking_runs (
        ranking_metric,
        ranking_date,
        source_name,
        source_url,
        source_retrieved_at,
        publication_status,
        notes,
        generated_at,
        published_at
    )
    values (
        'market_cap_usd',
        '2026-07-22',
        'Cabeus public market-cap review',
        'https://finance.yahoo.com/markets/stocks/most-active/',
        '2026-07-22T13:22:19Z',
        'published',
        'U.S.-listed space-focused operators ranked by reviewed market capitalization.',
        now(),
        now()
    )
    returning id into new_ranking_run_id;

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
        new_ranking_run_id,
        company.id,
        row_number() over (
            order by company.ranking_metric_value desc, company.company_name
        )::integer,
        company.ranking_metric_value,
        company.ranking_metric_as_of_date,
        company.company_name,
        company.ticker_symbol,
        company.exchange_code,
        company.ranking_source_name,
        company.ranking_source_url
    from public.public_space_companies company
    where company.status = 'active'
        and company.ranking_eligible
        and company.ranking_metric = 'market_cap_usd'
        and company.ticker_symbol in (
            'RKLB', 'ECHO', 'ASTS', 'VSAT', 'GSAT',
            'PL', 'KRMN', 'IRDM', 'FLY', 'RDW'
        )
    order by company.ranking_metric_value desc, company.company_name;
end
$$;
