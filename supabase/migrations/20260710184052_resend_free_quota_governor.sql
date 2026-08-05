alter table private.outbound_email_delivery_events
    add column if not exists idempotency_key text,
    add column if not exists priority text not null default 'operational',
    add column if not exists provider_headers jsonb not null default '{}'::jsonb,
    add column if not exists next_retry_at timestamptz;

alter table private.outbound_email_delivery_events
    drop constraint if exists outbound_email_delivery_priority_check;

alter table private.outbound_email_delivery_events
    add constraint outbound_email_delivery_priority_check check (
        priority in ('operational', 'alert', 'digest')
    );

create unique index if not exists outbound_email_delivery_idempotency_key_idx
on private.outbound_email_delivery_events (idempotency_key)
where idempotency_key is not null;

create index if not exists outbound_email_delivery_retry_idx
on private.outbound_email_delivery_events (delivery_status, next_retry_at)
where delivery_status in ('queued', 'held', 'failed');

create table if not exists private.resend_free_plan_config (
    id boolean primary key default true check (id),
    plan text not null default 'free' check (plan = 'free'),
    daily_soft_cap integer not null default 90 check (daily_soft_cap >= 0),
    monthly_soft_cap integer not null default 2700 check (monthly_soft_cap >= 0),
    daily_hard_cap integer not null default 100 check (daily_hard_cap > 0),
    monthly_hard_cap integer not null default 3000 check (monthly_hard_cap > 0),
    operational_daily_reserve integer not null default 10 check (operational_daily_reserve >= 0),
    operational_monthly_reserve integer not null default 300 check (operational_monthly_reserve >= 0),
    max_sends_per_second integer not null default 8 check (max_sends_per_second between 1 and 9),
    inbound_receiving_enabled boolean not null default false,
    sending_domain_count integer not null default 1 check (sending_domain_count = 1),
    provider_retention_days integer not null default 30 check (provider_retention_days = 30),
    updated_at timestamptz not null default now(),
    check (daily_soft_cap <= daily_hard_cap - operational_daily_reserve),
    check (monthly_soft_cap <= monthly_hard_cap - operational_monthly_reserve)
);

insert into private.resend_free_plan_config (id)
values (true)
on conflict (id) do nothing;

create table if not exists private.resend_quota_usage (
    period_kind text not null check (period_kind in ('daily', 'monthly')),
    period_start date not null,
    sent_count integer not null default 0 check (sent_count >= 0),
    reserved_count integer not null default 0 check (reserved_count >= 0),
    updated_at timestamptz not null default now(),
    primary key (period_kind, period_start)
);

alter table private.resend_free_plan_config enable row level security;
alter table private.resend_quota_usage enable row level security;

revoke all on table private.resend_free_plan_config, private.resend_quota_usage from public, anon, authenticated;
grant all on table private.resend_free_plan_config, private.resend_quota_usage to service_role;

create or replace function private.claim_resend_free_quota(
    p_event_id uuid,
    p_recipient_count integer,
    p_is_operational boolean
)
returns table (allowed boolean, hold_reason text, retry_at timestamptz)
language plpgsql
set search_path = private, public, pg_temp
as $$
declare
    v_config private.resend_free_plan_config%rowtype;
    v_daily private.resend_quota_usage%rowtype;
    v_monthly private.resend_quota_usage%rowtype;
    v_today date := (now() at time zone 'utc')::date;
    v_month date := date_trunc('month', now() at time zone 'utc')::date;
    v_daily_limit integer;
    v_monthly_limit integer;
begin
    if p_recipient_count < 1 or p_recipient_count > 50 then
        raise exception 'recipient count must be between 1 and 50';
    end if;

    perform pg_advisory_xact_lock(hashtextextended('resend-free-daily:' || v_today::text, 0));
    perform pg_advisory_xact_lock(hashtextextended('resend-free-monthly:' || v_month::text, 0));

    select * into v_config from private.resend_free_plan_config where id = true for update;
    if not found or v_config.plan <> 'free' or v_config.inbound_receiving_enabled or v_config.sending_domain_count <> 1 then
        return query select false, 'invalid_free_plan_configuration', null::timestamptz;
        return;
    end if;

    insert into private.resend_quota_usage (period_kind, period_start)
    values ('daily', v_today), ('monthly', v_month)
    on conflict do nothing;

    select * into v_daily from private.resend_quota_usage
    where period_kind = 'daily' and period_start = v_today for update;
    select * into v_monthly from private.resend_quota_usage
    where period_kind = 'monthly' and period_start = v_month for update;

    v_daily_limit := case when p_is_operational then v_config.daily_hard_cap else v_config.daily_soft_cap end;
    v_monthly_limit := case when p_is_operational then v_config.monthly_hard_cap else v_config.monthly_soft_cap end;

    if v_daily.sent_count + v_daily.reserved_count + p_recipient_count > v_daily_limit then
        return query select false,
            case when p_is_operational then 'daily_hard_cap' else 'daily_soft_cap' end,
            (v_today + 1)::timestamptz;
        return;
    end if;

    if v_monthly.sent_count + v_monthly.reserved_count + p_recipient_count > v_monthly_limit then
        return query select false,
            case when p_is_operational then 'monthly_hard_cap' else 'monthly_soft_cap' end,
            (v_month + interval '1 month')::timestamptz;
        return;
    end if;

    update private.resend_quota_usage
    set reserved_count = reserved_count + p_recipient_count, updated_at = now()
    where period_kind = 'daily' and period_start = v_today;

    update private.resend_quota_usage
    set reserved_count = reserved_count + p_recipient_count, updated_at = now()
    where period_kind = 'monthly' and period_start = v_month;

    return query select true, null::text, null::timestamptz;
end;
$$;

create or replace function private.complete_resend_free_quota(
    p_recipient_count integer,
    p_sent boolean
)
returns void
language plpgsql
set search_path = private, public, pg_temp
as $$
declare
    v_today date := (now() at time zone 'utc')::date;
    v_month date := date_trunc('month', now() at time zone 'utc')::date;
begin
    perform pg_advisory_xact_lock(hashtextextended('resend-free-daily:' || v_today::text, 0));
    perform pg_advisory_xact_lock(hashtextextended('resend-free-monthly:' || v_month::text, 0));

    update private.resend_quota_usage
    set reserved_count = greatest(reserved_count - p_recipient_count, 0),
        sent_count = sent_count + case when p_sent then p_recipient_count else 0 end,
        updated_at = now()
    where period_kind = 'daily' and period_start = v_today;

    update private.resend_quota_usage
    set reserved_count = greatest(reserved_count - p_recipient_count, 0),
        sent_count = sent_count + case when p_sent then p_recipient_count else 0 end,
        updated_at = now()
    where period_kind = 'monthly' and period_start = v_month;
end;
$$;

revoke all on function private.claim_resend_free_quota(uuid, integer, boolean) from public, anon, authenticated;
revoke all on function private.complete_resend_free_quota(integer, boolean) from public, anon, authenticated;
grant execute on function private.claim_resend_free_quota(uuid, integer, boolean) to service_role;
grant execute on function private.complete_resend_free_quota(integer, boolean) to service_role;
