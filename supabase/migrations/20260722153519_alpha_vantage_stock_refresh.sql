create table if not exists public.stock_quote_ingestion_runs (
    id uuid primary key default gen_random_uuid(),
    provider text not null,
    quota_date date not null,
    status text not null default 'running'
        check (status in ('running', 'completed', 'partial', 'failed')),
    calls_reserved integer not null check (calls_reserved between 1 and 20),
    calls_completed integer not null default 0 check (calls_completed >= 0),
    symbols_requested text[] not null,
    symbols_updated integer not null default 0 check (symbols_updated >= 0),
    error_summary text,
    metadata jsonb not null default '{}'::jsonb,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists stock_quote_ingestion_runs_provider_quota_idx
on public.stock_quote_ingestion_runs (provider, quota_date, started_at desc);

alter table public.stock_quote_ingestion_runs enable row level security;
revoke all on table public.stock_quote_ingestion_runs from anon, authenticated;
grant select, insert, update on table public.stock_quote_ingestion_runs to service_role;

create or replace function public.claim_alpha_vantage_stock_refresh(
    p_symbols text[],
    p_daily_cap integer default 20
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_quota_date date := (now() at time zone 'UTC')::date;
    v_requested integer := cardinality(p_symbols);
    v_reserved integer;
    v_run_id uuid;
begin
    if v_requested is null or v_requested < 1 or v_requested > 5 then
        raise exception 'stock refresh must reserve between 1 and 5 calls';
    end if;
    if p_daily_cap < 1 or p_daily_cap > 20 then
        raise exception 'daily call cap must be between 1 and 20';
    end if;

    perform pg_advisory_xact_lock(hashtext('alpha-vantage-stock:' || v_quota_date::text));

    select coalesce(sum(calls_reserved), 0)::integer
    into v_reserved
    from public.stock_quote_ingestion_runs
    where provider = 'alpha_vantage'
        and quota_date = v_quota_date;

    if v_reserved + v_requested > p_daily_cap then
        return null;
    end if;

    insert into public.stock_quote_ingestion_runs (
        provider,
        quota_date,
        calls_reserved,
        symbols_requested
    )
    values (
        'alpha_vantage',
        v_quota_date,
        v_requested,
        p_symbols
    )
    returning id into v_run_id;

    return v_run_id;
end;
$$;

revoke all on function public.claim_alpha_vantage_stock_refresh(text[], integer) from public, anon, authenticated;
grant execute on function public.claim_alpha_vantage_stock_refresh(text[], integer) to service_role;

create or replace function private.invoke_alpha_vantage_stock_refresh(p_batch integer)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_url text;
    v_secret text;
    v_request_id bigint;
begin
    if p_batch not in (0, 1) then
        raise exception 'unsupported Alpha Vantage batch';
    end if;

    select decrypted_secret into v_url
    from vault.decrypted_secrets
    where name = 'production_tracker_ingestion_url';

    select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'production_tracker_ingestion_secret';

    if v_url is null or v_secret is null then
        return null;
    end if;

    select net.http_post(
        url := v_url,
        headers := jsonb_build_object(
            'authorization', 'Bearer ' || v_secret,
            'content-type', 'application/json'
        ),
        body := jsonb_build_object(
            'job', 'stock-quotes',
            'payload', jsonb_build_object('batch', p_batch)
        ),
        timeout_milliseconds := 55000
    ) into v_request_id;

    return v_request_id;
end;
$$;

revoke all on function private.invoke_alpha_vantage_stock_refresh(integer) from public;
grant execute on function private.invoke_alpha_vantage_stock_refresh(integer) to service_role;

do $$
declare
    v_job_id bigint;
begin
    select jobid into v_job_id from cron.job
    where jobname = 'ingest-alpha-vantage-stock-quotes-a';
    if v_job_id is not null then perform cron.unschedule(v_job_id); end if;

    select jobid into v_job_id from cron.job
    where jobname = 'ingest-alpha-vantage-stock-quotes-b';
    if v_job_id is not null then perform cron.unschedule(v_job_id); end if;

    perform cron.schedule(
        'ingest-alpha-vantage-stock-quotes-a',
        '15 22 * * 1-5',
        $job$select private.invoke_alpha_vantage_stock_refresh(0);$job$
    );

    perform cron.schedule(
        'ingest-alpha-vantage-stock-quotes-b',
        '17 22 * * 1-5',
        $job$select private.invoke_alpha_vantage_stock_refresh(1);$job$
    );
end;
$$;
