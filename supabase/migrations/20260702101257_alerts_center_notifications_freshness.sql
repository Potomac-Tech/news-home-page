do $$
begin
    create type public.member_alert_trigger_kind as enum (
        'watched_object_changed',
        'saved_search_match',
        'freshness_stale',
        'platform_event',
        'command_intelligence'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.member_alert_feed_kind as enum (
        'watchlist_update',
        'saved_search_result',
        'freshness_warning',
        'platform_notice',
        'delivery_status',
        'command_brief'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.member_alert_severity as enum (
        'info',
        'watch',
        'urgent'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.member_alert_delivery_status as enum (
        'queued',
        'sent',
        'failed',
        'suppressed',
        'cancelled'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.member_alert_tier_limits (
    tier text primary key,
    max_active_rules integer not null,
    max_email_deliveries_per_day integer not null,
    supports_email boolean not null default false,
    supports_webhooks boolean not null default false,
    supports_command_intelligence boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint member_alert_tier_limits_tier_check check (
        tier in ('explorer', 'scout', 'command', 'staff')
    ),
    constraint member_alert_tier_limits_nonnegative check (
        max_active_rules >= 0
        and max_email_deliveries_per_day >= 0
    )
);

drop trigger if exists set_member_alert_tier_limits_updated_at
on public.member_alert_tier_limits;
create trigger set_member_alert_tier_limits_updated_at
before update on public.member_alert_tier_limits
for each row execute function public.set_updated_at();

insert into public.member_alert_tier_limits (
    tier,
    max_active_rules,
    max_email_deliveries_per_day,
    supports_email,
    supports_webhooks,
    supports_command_intelligence
)
values
    ('explorer', 0, 0, false, false, false),
    ('scout', 25, 100, true, false, false),
    ('command', 200, 1000, true, true, true),
    ('staff', 500, 2000, true, true, true)
on conflict (tier) do update set
    max_active_rules = excluded.max_active_rules,
    max_email_deliveries_per_day = excluded.max_email_deliveries_per_day,
    supports_email = excluded.supports_email,
    supports_webhooks = excluded.supports_webhooks,
    supports_command_intelligence = excluded.supports_command_intelligence,
    updated_at = now();

create table if not exists public.member_alert_rules (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    rule_name text not null,
    trigger_kind public.member_alert_trigger_kind not null,
    object_kind public.saved_work_object_kind,
    object_id uuid,
    object_slug text,
    watchlist_id uuid references public.member_watchlists(id) on delete set null,
    saved_search_id uuid references public.member_saved_searches(id) on delete set null,
    severity public.member_alert_severity not null default 'info',
    status public.saved_work_status not null default 'active',
    in_app_enabled boolean not null default true,
    email_enabled boolean not null default false,
    frequency public.saved_search_frequency not null default 'daily',
    stale_after_hours integer,
    per_day_limit integer not null default 5,
    last_evaluated_at timestamptz,
    last_triggered_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    constraint member_alert_rules_name_not_blank check (
        length(trim(rule_name)) > 0
    ),
    constraint member_alert_rules_slug_not_blank check (
        object_slug is null or length(trim(object_slug)) > 0
    ),
    constraint member_alert_rules_stale_after_positive check (
        stale_after_hours is null or stale_after_hours > 0
    ),
    constraint member_alert_rules_per_day_limit_nonnegative check (
        per_day_limit >= 0
    ),
    constraint member_alert_rules_target_check check (
        trigger_kind in ('platform_event', 'command_intelligence')
        or object_kind is not null
        or watchlist_id is not null
        or saved_search_id is not null
    ),
    constraint member_alert_rules_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create index if not exists member_alert_rules_owner_status_idx
on public.member_alert_rules (owner_user_id, status, updated_at desc);

create index if not exists member_alert_rules_eval_idx
on public.member_alert_rules (status, frequency, last_evaluated_at nulls first)
where status = 'active';

create index if not exists member_alert_rules_watchlist_idx
on public.member_alert_rules (watchlist_id)
where watchlist_id is not null;

create index if not exists member_alert_rules_saved_search_idx
on public.member_alert_rules (saved_search_id)
where saved_search_id is not null;

drop trigger if exists set_member_alert_rules_updated_at
on public.member_alert_rules;
create trigger set_member_alert_rules_updated_at
before update on public.member_alert_rules
for each row execute function public.set_updated_at();

create table if not exists public.member_alert_feed_items (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    alert_rule_id uuid references public.member_alert_rules(id) on delete set null,
    alert_kind public.member_alert_feed_kind not null,
    object_kind public.saved_work_object_kind,
    object_id uuid,
    object_slug text,
    object_title text not null,
    route_path text not null,
    headline text not null,
    summary text,
    source_label text,
    severity public.member_alert_severity not null default 'info',
    status public.saved_work_status not null default 'active',
    freshness_at timestamptz,
    stale_at timestamptz,
    is_read boolean not null default false,
    read_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint member_alert_feed_title_not_blank check (
        length(trim(object_title)) > 0
    ),
    constraint member_alert_feed_headline_not_blank check (
        length(trim(headline)) > 0
    ),
    constraint member_alert_feed_route_check check (
        route_path ~ '^/' or route_path ~* '^https?://'
    ),
    constraint member_alert_feed_read_at_check check (
        not is_read or read_at is not null
    ),
    constraint member_alert_feed_freshness_check check (
        stale_at is null
        or freshness_at is null
        or stale_at >= freshness_at
    ),
    constraint member_alert_feed_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create index if not exists member_alert_feed_owner_unread_idx
on public.member_alert_feed_items (
    owner_user_id,
    is_read,
    status,
    created_at desc
);

create index if not exists member_alert_feed_rule_idx
on public.member_alert_feed_items (alert_rule_id, created_at desc)
where alert_rule_id is not null;

create index if not exists member_alert_feed_freshness_idx
on public.member_alert_feed_items (stale_at nulls last, freshness_at desc nulls last)
where status = 'active';

create table if not exists public.member_alert_delivery_events (
    id uuid primary key default gen_random_uuid(),
    alert_feed_item_id uuid references public.member_alert_feed_items(id)
        on delete cascade,
    alert_rule_id uuid references public.member_alert_rules(id)
        on delete set null,
    owner_user_id uuid references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    channel public.notification_channel not null,
    delivery_status public.member_alert_delivery_status not null default 'queued',
    delivery_target text,
    provider_message_id text,
    webhook_event_key text,
    attempt_count integer not null default 0,
    scheduled_at timestamptz,
    sent_at timestamptz,
    last_error text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint member_alert_delivery_attempts_nonnegative check (
        attempt_count >= 0
    ),
    constraint member_alert_delivery_target_not_blank check (
        delivery_target is null or length(trim(delivery_target)) > 0
    ),
    constraint member_alert_delivery_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create index if not exists member_alert_delivery_owner_idx
on public.member_alert_delivery_events (
    owner_user_id,
    delivery_status,
    created_at desc
);

create index if not exists member_alert_delivery_feed_idx
on public.member_alert_delivery_events (alert_feed_item_id, created_at desc)
where alert_feed_item_id is not null;

create index if not exists member_alert_delivery_scheduled_idx
on public.member_alert_delivery_events (
    delivery_status,
    scheduled_at nulls first,
    created_at
)
where delivery_status = 'queued';

create or replace function app_private.can_use_alert_rules()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select app_private.has_any_role(array[
        'scout',
        'command_user',
        'editor',
        'analyst',
        'admin'
    ]);
$$;

create or replace function app_private.can_read_member_alerts(
    target_owner_user_id uuid,
    target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select
        auth.uid() = target_owner_user_id
        or app_private.has_any_role(array['editor', 'analyst', 'admin'])
        or (
            target_organization_id is not null
            and app_private.is_org_admin(target_organization_id)
        );
$$;

create or replace function app_private.can_manage_member_alerts(
    target_owner_user_id uuid,
    target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select
        app_private.can_use_alert_rules()
        and app_private.can_read_member_alerts(
            target_owner_user_id,
            target_organization_id
        );
$$;

grant execute on function app_private.can_use_alert_rules() to authenticated;
grant execute on function app_private.can_read_member_alerts(uuid, uuid)
to authenticated;
grant execute on function app_private.can_manage_member_alerts(uuid, uuid)
to authenticated;

alter table public.member_alert_tier_limits enable row level security;
alter table public.member_alert_rules enable row level security;
alter table public.member_alert_feed_items enable row level security;
alter table public.member_alert_delivery_events enable row level security;

grant select on public.member_alert_tier_limits to anon, authenticated;

grant select, insert, update, delete on
    public.member_alert_rules,
    public.member_alert_feed_items,
    public.member_alert_delivery_events
to authenticated;

drop policy if exists "member_alert_tier_limits_public_read"
on public.member_alert_tier_limits;
create policy "member_alert_tier_limits_public_read"
on public.member_alert_tier_limits
for select
using (true);

drop policy if exists "member_alert_rules_select_relevant"
on public.member_alert_rules;
create policy "member_alert_rules_select_relevant"
on public.member_alert_rules
for select
to authenticated
using (app_private.can_manage_member_alerts(owner_user_id, organization_id));

drop policy if exists "member_alert_rules_insert_paid_owner"
on public.member_alert_rules;
create policy "member_alert_rules_insert_paid_owner"
on public.member_alert_rules
for insert
to authenticated
with check (
    owner_user_id = auth.uid()
    and app_private.can_manage_member_alerts(owner_user_id, organization_id)
);

drop policy if exists "member_alert_rules_update_relevant"
on public.member_alert_rules;
create policy "member_alert_rules_update_relevant"
on public.member_alert_rules
for update
to authenticated
using (app_private.can_manage_member_alerts(owner_user_id, organization_id))
with check (app_private.can_manage_member_alerts(owner_user_id, organization_id));

drop policy if exists "member_alert_rules_delete_relevant"
on public.member_alert_rules;
create policy "member_alert_rules_delete_relevant"
on public.member_alert_rules
for delete
to authenticated
using (app_private.can_manage_member_alerts(owner_user_id, organization_id));

drop policy if exists "member_alert_feed_select_relevant"
on public.member_alert_feed_items;
create policy "member_alert_feed_select_relevant"
on public.member_alert_feed_items
for select
to authenticated
using (app_private.can_read_member_alerts(owner_user_id, organization_id));

drop policy if exists "member_alert_feed_insert_staff_or_owner_rule"
on public.member_alert_feed_items;
create policy "member_alert_feed_insert_staff_or_owner_rule"
on public.member_alert_feed_items
for insert
to authenticated
with check (
    app_private.has_any_role(array['editor', 'analyst', 'admin'])
    or app_private.can_manage_member_alerts(owner_user_id, organization_id)
);

drop policy if exists "member_alert_feed_update_read_state"
on public.member_alert_feed_items;
create policy "member_alert_feed_update_read_state"
on public.member_alert_feed_items
for update
to authenticated
using (app_private.can_read_member_alerts(owner_user_id, organization_id))
with check (app_private.can_read_member_alerts(owner_user_id, organization_id));

drop policy if exists "member_alert_feed_delete_staff"
on public.member_alert_feed_items;
create policy "member_alert_feed_delete_staff"
on public.member_alert_feed_items
for delete
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "member_alert_delivery_select_relevant"
on public.member_alert_delivery_events;
create policy "member_alert_delivery_select_relevant"
on public.member_alert_delivery_events
for select
to authenticated
using (app_private.can_read_member_alerts(owner_user_id, organization_id));

drop policy if exists "member_alert_delivery_insert_relevant"
on public.member_alert_delivery_events;
create policy "member_alert_delivery_insert_relevant"
on public.member_alert_delivery_events
for insert
to authenticated
with check (
    app_private.has_any_role(array['editor', 'analyst', 'admin'])
    or app_private.can_manage_member_alerts(owner_user_id, organization_id)
);

drop policy if exists "member_alert_delivery_update_staff"
on public.member_alert_delivery_events;
create policy "member_alert_delivery_update_staff"
on public.member_alert_delivery_events
for update
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']))
with check (app_private.has_any_role(array['editor', 'analyst', 'admin']));
