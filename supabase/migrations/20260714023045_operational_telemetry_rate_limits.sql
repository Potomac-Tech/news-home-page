create table if not exists public.operational_telemetry_events (
    id uuid primary key default gen_random_uuid(),
    event_kind text not null,
    route_path text not null,
    metric_name text,
    metric_value numeric,
    metric_rating text,
    request_id text,
    session_hash text,
    metadata jsonb not null default '{}'::jsonb,
    occurred_at timestamptz not null default now(),
    constraint operational_telemetry_kind_check check (
        event_kind in ('navigation', 'web_vital', 'client_error')
    ),
    constraint operational_telemetry_route_check check (
        route_path ~ '^/' and route_path !~ '[?#]'
    ),
    constraint operational_telemetry_rating_check check (
        metric_rating is null or metric_rating in ('good', 'needs-improvement', 'poor')
    ),
    constraint operational_telemetry_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create index if not exists operational_telemetry_kind_time_idx
on public.operational_telemetry_events (event_kind, occurred_at desc);

create index if not exists operational_telemetry_metric_time_idx
on public.operational_telemetry_events (metric_name, occurred_at desc)
where metric_name is not null;

alter table public.operational_telemetry_events enable row level security;
revoke all on public.operational_telemetry_events from public, anon, authenticated;
grant all on public.operational_telemetry_events to service_role;
grant select on public.operational_telemetry_events to authenticated;

drop policy if exists "operational_telemetry_staff_read"
on public.operational_telemetry_events;
create policy "operational_telemetry_staff_read"
on public.operational_telemetry_events
for select
to authenticated
using (app_private.has_any_role(array['admin', 'analyst']));

create table if not exists private.operational_telemetry_rate_windows (
    fingerprint_hash text not null,
    window_started_at timestamptz not null,
    event_count integer not null default 0,
    updated_at timestamptz not null default now(),
    primary key (fingerprint_hash, window_started_at),
    constraint operational_telemetry_rate_count_nonnegative check (event_count >= 0)
);

revoke all on private.operational_telemetry_rate_windows
from public, anon, authenticated;

create or replace function public.claim_operational_telemetry_event(
    p_fingerprint_hash text,
    p_limit integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
    current_window timestamptz := date_trunc('minute', now());
    claimed_count integer;
begin
    if coalesce(length(p_fingerprint_hash), 0) < 32 then return false; end if;
    delete from private.operational_telemetry_rate_windows
    where window_started_at < now() - interval '10 minutes';

    insert into private.operational_telemetry_rate_windows (
        fingerprint_hash, window_started_at, event_count
    ) values (p_fingerprint_hash, current_window, 1)
    on conflict (fingerprint_hash, window_started_at)
    do update set event_count = private.operational_telemetry_rate_windows.event_count + 1,
        updated_at = now()
    returning event_count into claimed_count;

    return claimed_count <= greatest(least(p_limit, 300), 1);
end;
$$;

create or replace function public.claim_developer_api_minute(
    p_key_hash text,
    p_request_id text,
    p_limit integer default 120
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    selected_key public.developer_api_keys%rowtype;
    request_count integer;
begin
    select * into selected_key
    from public.developer_api_keys
    where key_hash = p_key_hash
      and status = 'active'
      and (expires_at is null or expires_at > now())
    for update;

    if not found then return true; end if;

    select count(*)::integer into request_count
    from public.developer_api_usage_logs
    where api_key_id = selected_key.id
      and event_kind = 'api_request'
      and occurred_at >= now() - interval '1 minute';

    if request_count >= greatest(least(p_limit, 10000), 1) then
        if not exists (
            select 1 from public.developer_api_usage_logs
            where api_key_id = selected_key.id
              and request_id = p_request_id
              and error_code = 'per_minute_rate_exceeded'
        ) then
            insert into public.developer_api_usage_logs (
                owner_user_id, organization_id, api_key_id, endpoint_key,
                request_id, status_code, quota_units, error_code
            ) values (
                selected_key.owner_user_id, selected_key.organization_id,
                selected_key.id, 'rate_limit', p_request_id, 429, 0,
                'per_minute_rate_exceeded'
            );
        end if;
        return false;
    end if;

    return true;
end;
$$;

revoke all on function public.claim_operational_telemetry_event(text, integer)
from public, anon, authenticated;
revoke all on function public.claim_developer_api_minute(text, text, integer)
from public, anon, authenticated;
grant execute on function public.claim_operational_telemetry_event(text, integer)
to service_role;
grant execute on function public.claim_developer_api_minute(text, text, integer)
to service_role;

create or replace function private.cleanup_operational_telemetry()
returns integer
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare deleted_count integer;
begin
    delete from public.operational_telemetry_events
    where occurred_at < now() - interval '30 days';
    get diagnostics deleted_count = row_count;
    delete from private.operational_telemetry_rate_windows
    where window_started_at < now() - interval '10 minutes';
    return deleted_count;
end;
$$;

revoke all on function private.cleanup_operational_telemetry()
from public, anon, authenticated;

do $$
declare job_id bigint;
begin
    select jobid into job_id from cron.job where jobname = 'cleanup-operational-telemetry';
    if job_id is not null then perform cron.unschedule(job_id); end if;
    perform cron.schedule(
        'cleanup-operational-telemetry',
        '17 4 * * *',
        'select private.cleanup_operational_telemetry();'
    );
end $$;

-- Cover every existing foreign key so parent updates/deletes do not require
-- sequential scans. Names include a constraint hash to remain collision-safe
-- after PostgreSQL's identifier-length limit is applied.
do $$
declare
    target record;
    index_name text;
begin
    for target in
        select
            namespace.nspname as schema_name,
            relation.relname as table_name,
            constraint_row.conname as constraint_name,
            string_agg(quote_ident(attribute.attname), ', ' order by key_column.ordinality) as columns_sql
        from pg_constraint constraint_row
        join pg_class relation on relation.oid = constraint_row.conrelid
        join pg_namespace namespace on namespace.oid = relation.relnamespace
        cross join lateral unnest(constraint_row.conkey) with ordinality as key_column(attnum, ordinality)
        join pg_attribute attribute
          on attribute.attrelid = constraint_row.conrelid
         and attribute.attnum = key_column.attnum
        where constraint_row.contype = 'f'
          and namespace.nspname in ('public', 'private')
          and not exists (
              select 1
              from pg_index index_row
              where index_row.indrelid = constraint_row.conrelid
                and index_row.indisvalid
                and index_row.indisready
                and index_row.indkey::smallint[] @> constraint_row.conkey
          )
        group by namespace.nspname, relation.relname,
            constraint_row.conname, constraint_row.conrelid
    loop
        index_name := left(target.table_name || '_fk_', 45)
            || substr(md5(target.constraint_name), 1, 12);
        execute format(
            'create index if not exists %I on %I.%I (%s)',
            index_name,
            target.schema_name,
            target.table_name,
            target.columns_sql
        );
    end loop;
end $$;
