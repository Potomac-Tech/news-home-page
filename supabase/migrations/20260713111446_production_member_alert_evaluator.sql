create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create table if not exists public.member_alert_evaluation_runs (
    id uuid primary key default gen_random_uuid(),
    run_key text not null unique,
    status text not null default 'running',
    rules_evaluated integer not null default 0,
    signals_found integer not null default 0,
    feed_items_created integer not null default 0,
    emails_sent integer not null default 0,
    emails_deferred integer not null default 0,
    emails_failed integer not null default 0,
    error_summary text,
    metadata jsonb not null default '{}'::jsonb,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    constraint member_alert_evaluation_runs_status_check check (
        status in ('running', 'completed', 'completed_with_errors', 'failed')
    ),
    constraint member_alert_evaluation_runs_counts_check check (
        rules_evaluated >= 0 and signals_found >= 0
        and feed_items_created >= 0 and emails_sent >= 0
        and emails_deferred >= 0 and emails_failed >= 0
    ),
    constraint member_alert_evaluation_runs_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create index if not exists member_alert_evaluation_runs_started_idx
on public.member_alert_evaluation_runs (started_at desc);

alter table public.member_alert_evaluation_runs enable row level security;
revoke all on table public.member_alert_evaluation_runs from public, anon, authenticated;
grant all on table public.member_alert_evaluation_runs to service_role;
grant select on table public.member_alert_evaluation_runs to authenticated;

drop policy if exists "member_alert_evaluation_runs_staff_read"
on public.member_alert_evaluation_runs;
create policy "member_alert_evaluation_runs_staff_read"
on public.member_alert_evaluation_runs
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

alter table public.member_alert_feed_items
    add column if not exists dedupe_key text;

create unique index if not exists member_alert_feed_dedupe_key
on public.member_alert_feed_items (owner_user_id, dedupe_key);

alter table public.member_alert_delivery_events
    add column if not exists next_retry_at timestamptz,
    add column if not exists outbound_email_event_id uuid,
    add column if not exists provider_headers jsonb not null default '{}'::jsonb;

create unique index if not exists member_alert_delivery_feed_channel_key
on public.member_alert_delivery_events (alert_feed_item_id, channel);

create index if not exists member_alert_delivery_retry_idx
on public.member_alert_delivery_events (
    delivery_status,
    next_retry_at nulls first,
    scheduled_at nulls first
)
where delivery_status in ('queued', 'failed');

create or replace function public.claim_member_alert_email_delivery(
    p_delivery_id uuid
)
returns table (
    allowed boolean,
    hold_reason text,
    retry_at timestamptz,
    outbound_event_id uuid
)
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
    v_delivery public.member_alert_delivery_events%rowtype;
    v_event_id uuid;
    v_rate record;
    v_quota record;
begin
    select * into v_delivery
    from public.member_alert_delivery_events
    where id = p_delivery_id
    for update;

    if not found or v_delivery.channel <> 'email' then
        return query select false, 'delivery_not_found', null::timestamptz, null::uuid;
        return;
    end if;
    if v_delivery.delivery_status not in ('queued', 'failed') then
        return query select false, 'delivery_not_pending', null::timestamptz, v_delivery.outbound_email_event_id;
        return;
    end if;
    if coalesce(v_delivery.next_retry_at, v_delivery.scheduled_at, now()) > now() then
        return query select false, 'delivery_not_due', coalesce(v_delivery.next_retry_at, v_delivery.scheduled_at), v_delivery.outbound_email_event_id;
        return;
    end if;
    if v_delivery.attempt_count >= 5 then
        update public.member_alert_delivery_events
        set delivery_status = 'failed', last_error = 'Retry limit reached.'
        where id = p_delivery_id;
        return query select false, 'retry_exhausted', null::timestamptz, v_delivery.outbound_email_event_id;
        return;
    end if;

    insert into private.outbound_email_delivery_events (
        form_type, sender, recipient, delivery_status, quota_bucket,
        idempotency_key, priority
    ) values (
        'member_alert', 'info@potomacdb.com', v_delivery.delivery_target,
        'queued', 'alerts', 'member-alert:' || p_delivery_id::text, 'alert'
    )
    on conflict (idempotency_key) where idempotency_key is not null
    do update set updated_at = now()
    returning id into v_event_id;

    select * into v_rate from private.claim_resend_send_rate();
    if not v_rate.allowed then
        update public.member_alert_delivery_events
        set next_retry_at = v_rate.retry_at, last_error = 'rate_limit_exceeded'
        where id = p_delivery_id;
        return query select false, 'rate_limit_exceeded', v_rate.retry_at, v_event_id;
        return;
    end if;

    select * into v_quota
    from private.claim_resend_free_quota(v_event_id, 1, false);
    if not v_quota.allowed then
        update public.member_alert_delivery_events
        set next_retry_at = v_quota.retry_at, last_error = v_quota.hold_reason,
            outbound_email_event_id = v_event_id
        where id = p_delivery_id;
        update private.outbound_email_delivery_events
        set delivery_status = 'held', retry_status = 'retry_pending',
            failure_reason = v_quota.hold_reason, next_retry_at = v_quota.retry_at,
            updated_at = now()
        where id = v_event_id;
        return query select false, v_quota.hold_reason, v_quota.retry_at, v_event_id;
        return;
    end if;

    update public.member_alert_delivery_events
    set attempt_count = attempt_count + 1,
        outbound_email_event_id = v_event_id,
        next_retry_at = null,
        last_error = null
    where id = p_delivery_id;
    return query select true, null::text, null::timestamptz, v_event_id;
end;
$$;

create or replace function public.complete_member_alert_email_delivery(
    p_delivery_id uuid,
    p_delivery_status text,
    p_provider_message_id text,
    p_failure_reason text,
    p_provider_headers jsonb,
    p_next_retry_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
    v_delivery public.member_alert_delivery_events%rowtype;
    v_sent boolean := p_delivery_status = 'sent';
    v_retry_at timestamptz;
begin
    if p_delivery_status not in ('sent', 'failed', 'held', 'configuration_missing') then
        raise exception 'invalid member alert delivery status';
    end if;

    select * into v_delivery
    from public.member_alert_delivery_events
    where id = p_delivery_id and channel = 'email'
    for update;
    if not found then raise exception 'member alert delivery not found'; end if;

    v_retry_at := case
        when p_delivery_status in ('held', 'configuration_missing')
            then coalesce(p_next_retry_at, now() + interval '1 hour')
        when p_delivery_status = 'failed' and v_delivery.attempt_count < 5
            then coalesce(p_next_retry_at, now() + make_interval(mins => least(60, power(2, v_delivery.attempt_count)::integer)))
        else null
    end;

    update private.outbound_email_delivery_events
    set provider_message_id = p_provider_message_id,
        delivery_status = p_delivery_status,
        retry_status = case
            when v_retry_at is not null then 'retry_pending'
            when p_delivery_status = 'failed' then 'retry_exhausted'
            else 'not_requested'
        end,
        failure_reason = p_failure_reason,
        provider_headers = coalesce(p_provider_headers, '{}'::jsonb),
        next_retry_at = v_retry_at,
        updated_at = now()
    where id = v_delivery.outbound_email_event_id;

    update public.member_alert_delivery_events
    set delivery_status = case
            when p_delivery_status = 'sent' then 'sent'::public.member_alert_delivery_status
            when v_retry_at is not null then 'queued'::public.member_alert_delivery_status
            else 'failed'::public.member_alert_delivery_status
        end,
        provider_message_id = p_provider_message_id,
        provider_headers = coalesce(p_provider_headers, '{}'::jsonb),
        sent_at = case when v_sent then now() else sent_at end,
        last_error = p_failure_reason,
        next_retry_at = v_retry_at
    where id = p_delivery_id;

    perform private.complete_resend_free_quota(1, v_sent);
end;
$$;

revoke all on function public.claim_member_alert_email_delivery(uuid)
from public, anon, authenticated;
revoke all on function public.complete_member_alert_email_delivery(
    uuid, text, text, text, jsonb, timestamptz
) from public, anon, authenticated;
grant execute on function public.claim_member_alert_email_delivery(uuid)
to service_role;
grant execute on function public.complete_member_alert_email_delivery(
    uuid, text, text, text, jsonb, timestamptz
) to service_role;

create or replace function private.invoke_member_alert_evaluator()
returns bigint
language plpgsql
security definer
set search_path = private, vault, net, public, pg_temp
as $$
declare
    v_url text;
    v_secret text;
    v_request_id bigint;
begin
    select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'member_alert_evaluator_url';
    select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'member_alert_evaluator_secret';
    if v_url is null or v_secret is null then return null; end if;

    select net.http_post(
        url := v_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_secret
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 55000
    ) into v_request_id;
    return v_request_id;
end;
$$;

revoke all on function private.invoke_member_alert_evaluator() from public, anon, authenticated;

do $$
declare v_job_id bigint;
begin
    select jobid into v_job_id from cron.job where jobname = 'evaluate-member-alerts';
    if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
    perform cron.schedule(
        'evaluate-member-alerts',
        '*/15 * * * *',
        'select private.invoke_member_alert_evaluator();'
    );
end $$;
