-- Restore SpaceX after its June 2026 Nasdaq listing and remove Redwire from the displayed top ten.

update public.public_space_companies
set
    company_name = 'Space Exploration Technologies Corp.',
    exchange_code = 'NASDAQ',
    country_code = 'US',
    website_url = 'https://www.spacex.com/',
    investor_relations_url = 'https://www.sec.gov/Archives/edgar/data/1181412/000162828026040874/spacexukfwp.htm',
    sector = 'Launch and satellite communications',
    lunar_relevance = 'Launch, lunar cargo, Starship, and cislunar infrastructure.',
    status = 'active',
    ranking_eligible = true,
    ranking_metric = 'market_cap_usd',
    ranking_metric_value = 1599800000000,
    ranking_metric_currency = 'USD',
    ranking_metric_as_of_date = '2026-07-22',
    ranking_source_name = 'SEC IPO share basis and delayed market price',
    ranking_source_url = 'https://www.sec.gov/Archives/edgar/data/1181412/000162828026040874/spacexukfwp.htm',
    ranking_source_retrieved_at = '2026-07-22T13:41:02Z',
    eligibility_notes = 'Nasdaq-listed space-focused operator.',
    updated_at = now()
where upper(ticker_symbol) = 'SPCX';

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
    '2026-07-22T13:41:02Z',
    'Yahoo Finance delayed market snapshot',
    'https://finance.yahoo.com/quote/SPCX/',
    '2026-07-22T13:41:02Z',
    15,
    'USD',
    122.01,
    -1.53,
    -1.238,
    'delayed',
    true
from public.public_space_companies company
where upper(company.ticker_symbol) = 'SPCX'
on conflict (company_id, quote_as_of_at, lower(source_name)) do update set
    company_name_snapshot = excluded.company_name_snapshot,
    exchange_code_snapshot = excluded.exchange_code_snapshot,
    last_price = excluded.last_price,
    price_change = excluded.price_change,
    price_change_percent = excluded.price_change_percent,
    is_displayable = true;

do $$
declare
    spacex_ranking_run_id uuid;
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
        'https://www.sec.gov/Archives/edgar/data/1181412/000162828026040874/spacexukfwp.htm',
        '2026-07-22T13:41:02Z',
        'published',
        'U.S.-listed space-focused operators ranked by reviewed market capitalization.',
        now(),
        now()
    )
    returning id into spacex_ranking_run_id;

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
        spacex_ranking_run_id,
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
            'SPCX', 'RKLB', 'ECHO', 'ASTS', 'VSAT',
            'GSAT', 'PL', 'KRMN', 'IRDM', 'FLY'
        )
    order by company.ranking_metric_value desc, company.company_name;
end
$$;
