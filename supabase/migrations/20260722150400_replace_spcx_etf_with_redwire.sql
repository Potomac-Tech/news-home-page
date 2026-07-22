-- Remove the SPCX ETF from the company universe and replace it with publicly traded Redwire.

update public.public_space_companies
set
    status = 'inactive',
    ranking_eligible = false,
    eligibility_notes = 'SPCX is an exchange-traded fund, not publicly traded SpaceX stock.',
    updated_at = now()
where upper(ticker_symbol) = 'SPCX';

update public.public_space_company_quotes quote
set is_displayable = false
from public.public_space_companies company
where quote.company_id = company.id
    and upper(company.ticker_symbol) = 'SPCX';

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
values (
    'Redwire Corporation',
    'RDW',
    'NYSE',
    'US',
    'https://redwirespace.com/',
    'https://ir.redwirespace.com/',
    'Space infrastructure and defense technology',
    'Spacecraft components, deployable systems, microgravity infrastructure, and mission systems.',
    'active',
    true,
    'market_cap_usd',
    1832139731,
    'USD',
    '2026-07-22',
    'Public market snapshot',
    'https://finance.yahoo.com/quote/RDW/',
    '2026-07-22T13:34:12Z',
    'NYSE-listed space-focused systems supplier.'
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
    eligibility_notes = excluded.eligibility_notes,
    updated_at = now();

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
    '2026-07-22T13:34:12Z',
    'Yahoo Finance delayed market snapshot',
    'https://finance.yahoo.com/quote/RDW/',
    '2026-07-22T13:34:12Z',
    15,
    'USD',
    9.485,
    0.065,
    0.690,
    'delayed',
    true
from public.public_space_companies company
where upper(company.ticker_symbol) = 'RDW'
on conflict (company_id, quote_as_of_at, lower(source_name)) do update set
    last_price = excluded.last_price,
    price_change = excluded.price_change,
    price_change_percent = excluded.price_change_percent,
    is_displayable = true;

do $$
declare
    corrected_ranking_run_id uuid;
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
        '2026-07-22T13:34:12Z',
        'published',
        'U.S.-listed space-focused operators ranked by reviewed market capitalization; funds excluded.',
        now(),
        now()
    )
    returning id into corrected_ranking_run_id;

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
        corrected_ranking_run_id,
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
