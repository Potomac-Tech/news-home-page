create table if not exists public.member_alert_email_config (
    id boolean primary key default true check (id),
    digest_cadence_hours integer not null default 24,
    digest_send_hour_utc integer not null default 13,
    max_daily_alert_emails integer not null default 80,
    per_user_daily_email_cap integer not null default 2,
    instant_daily_reserve integer not null default 5,
    instant_priority_threshold public.member_alert_severity not null default 'urgent',
    low_budget_buffer integer not null default 10,
    max_digest_items integer not null default 20,
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null,
    constraint member_alert_email_config_cadence_check check (
        digest_cadence_hours between 1 and 168
    ),
    constraint member_alert_email_config_hour_check check (
        digest_send_hour_utc between 0 and 23
    ),
    constraint member_alert_email_config_limits_check check (
        max_daily_alert_emails between 1 and 90
        and per_user_daily_email_cap between 1 and 10
        and instant_daily_reserve between 0 and 20
        and low_budget_buffer between 0 and 50
        and max_digest_items between 1 and 50
    )
);

insert into public.member_alert_email_config (id)
values (true)
on conflict (id) do nothing;

drop trigger if exists set_member_alert_email_config_updated_at
on public.member_alert_email_config;
create trigger set_member_alert_email_config_updated_at
before update on public.member_alert_email_config
for each row execute function public.set_updated_at();

alter table public.member_alert_email_config enable row level security;
revoke all on table public.member_alert_email_config from public, anon, authenticated;
grant select, update on table public.member_alert_email_config to authenticated;
grant all on table public.member_alert_email_config to service_role;

drop policy if exists "Admins read member alert email config"
on public.member_alert_email_config;
create policy "Admins read member alert email config"
on public.member_alert_email_config
for select
to authenticated
using ((select app_private.has_role('admin')));

drop policy if exists "Admins update member alert email config"
on public.member_alert_email_config;
create policy "Admins update member alert email config"
on public.member_alert_email_config
for update
to authenticated
using ((select app_private.has_role('admin')))
with check ((select app_private.has_role('admin')));

alter table public.member_alert_delivery_events
    add column if not exists digest_key text;

create index if not exists member_alert_delivery_digest_queue_idx
on public.member_alert_delivery_events (
    digest_key,
    owner_user_id,
    scheduled_at,
    created_at
)
where channel = 'email' and delivery_status in ('queued', 'failed');

create or replace function public.get_member_alert_runtime_config()
returns jsonb
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
    v_today timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
    v_month timestamptz := date_trunc('month', now() at time zone 'utc') at time zone 'utc';
begin
    return jsonb_build_object(
        'config', (
            select to_jsonb(config)
            from public.member_alert_email_config config
            where id = true
        ),
        'daily_alert_emails_sent', (
            select count(*)
            from private.outbound_email_delivery_events event
            where event.form_type = 'member_alert'
              and event.delivery_status = 'sent'
              and event.created_at >= v_today
        ),
        'monthly_alert_emails_sent', (
            select count(*)
            from private.outbound_email_delivery_events event
            where event.form_type = 'member_alert'
              and event.delivery_status = 'sent'
              and event.created_at >= v_month
        ),
        'daily_instant_emails_sent', (
            select count(distinct event.provider_message_id)
            from public.member_alert_delivery_events event
            where event.channel = 'email'
              and event.delivery_status = 'sent'
              and event.metadata ->> 'delivery_mode' = 'immediate'
              and event.sent_at >= v_today
        ),
        'daily_quota', (
            select to_jsonb(usage)
            from private.resend_quota_usage usage
            where usage.period_kind = 'daily'
              and usage.period_start = (now() at time zone 'utc')::date
        )
    );
end;
$$;

revoke all on function public.get_member_alert_runtime_config()
from public, anon, authenticated;
grant execute on function public.get_member_alert_runtime_config()
to service_role;

create or replace function public.get_resend_email_operations()
returns jsonb
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
    if not app_private.has_role('admin') then
        raise exception 'admin access is required';
    end if;

    return jsonb_build_object(
        'config', (
            select to_jsonb(config)
            from private.resend_free_plan_config config
            where id = true
        ),
        'alert_config', (
            select to_jsonb(config)
            from public.member_alert_email_config config
            where id = true
        ),
        'alert_queue', jsonb_build_object(
            'digest_items', (
                select count(*) from public.member_alert_delivery_events
                where channel = 'email' and delivery_status in ('queued', 'failed')
                  and coalesce(metadata ->> 'delivery_mode', 'digest') = 'digest'
            ),
            'immediate_items', (
                select count(*) from public.member_alert_delivery_events
                where channel = 'email' and delivery_status in ('queued', 'failed')
                  and metadata ->> 'delivery_mode' = 'immediate'
            ),
            'suppressed_items', (
                select count(*) from public.member_alert_delivery_events
                where channel = 'email' and delivery_status = 'suppressed'
                  and created_at >= date_trunc('day', now())
            )
        ),
        'usage', coalesce((
            select jsonb_agg(to_jsonb(usage) order by usage.period_kind)
            from private.resend_quota_usage usage
            where usage.period_start in (
                (now() at time zone 'utc')::date,
                date_trunc('month', now() at time zone 'utc')::date
            )
        ), '[]'::jsonb),
        'events', coalesce((
            select jsonb_agg(to_jsonb(event) order by event.created_at desc)
            from (
                select id, form_type, recipient, recipient_count, delivery_status,
                    retry_status, next_retry_at, provider_message_id, failure_reason, created_at
                from private.outbound_email_delivery_events
                order by created_at desc
                limit 40
            ) event
        ), '[]'::jsonb)
    );
end;
$$;

revoke all on function public.get_resend_email_operations() from public, anon;
grant execute on function public.get_resend_email_operations() to authenticated;
