do $$
begin
    create type public.developer_api_key_status as enum (
        'active',
        'paused',
        'revoked'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.developer_usage_event_kind as enum (
        'api_request',
        'export_download',
        'webhook_delivery'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.developer_webhook_event_kind as enum (
        'alert.created',
        'saved_search.match',
        'watchlist.changed',
        'dataset.updated',
        'export.completed',
        'command_brief.published'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.developer_delivery_status as enum (
        'queued',
        'sent',
        'failed',
        'disabled',
        'cancelled'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.developer_export_job_status as enum (
        'queued',
        'processing',
        'ready',
        'failed',
        'expired',
        'cancelled'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.developer_tier_limits (
    tier text primary key,
    monthly_api_quota integer not null,
    daily_export_quota integer not null,
    max_active_api_keys integer not null,
    max_webhook_subscriptions integer not null,
    supports_webhooks boolean not null default false,
    supports_command_endpoints boolean not null default false,
    retention_days integer not null default 30,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint developer_tier_limits_tier_check check (
        tier in ('scout', 'command', 'staff')
    ),
    constraint developer_tier_limits_nonnegative check (
        monthly_api_quota >= 0
        and daily_export_quota >= 0
        and max_active_api_keys >= 0
        and max_webhook_subscriptions >= 0
        and retention_days >= 0
    )
);

drop trigger if exists set_developer_tier_limits_updated_at
on public.developer_tier_limits;
create trigger set_developer_tier_limits_updated_at
before update on public.developer_tier_limits
for each row execute function public.set_updated_at();

insert into public.developer_tier_limits (
    tier,
    monthly_api_quota,
    daily_export_quota,
    max_active_api_keys,
    max_webhook_subscriptions,
    supports_webhooks,
    supports_command_endpoints,
    retention_days
)
values
    ('scout', 10000, 25, 3, 0, false, false, 90),
    ('command', 250000, 250, 20, 25, true, true, 365),
    ('staff', 1000000, 1000, 50, 50, true, true, 730)
on conflict (tier) do update set
    monthly_api_quota = excluded.monthly_api_quota,
    daily_export_quota = excluded.daily_export_quota,
    max_active_api_keys = excluded.max_active_api_keys,
    max_webhook_subscriptions = excluded.max_webhook_subscriptions,
    supports_webhooks = excluded.supports_webhooks,
    supports_command_endpoints = excluded.supports_command_endpoints,
    retention_days = excluded.retention_days,
    updated_at = now();

create table if not exists public.developer_endpoint_catalog (
    id uuid primary key default gen_random_uuid(),
    endpoint_key text not null unique,
    title text not null,
    description text not null,
    method text not null default 'GET',
    route_template text not null,
    minimum_tier text not null default 'scout',
    quota_weight integer not null default 1,
    response_format text not null default 'json',
    includes_command_data boolean not null default false,
    status public.saved_work_status not null default 'active',
    documentation_anchor text,
    example_request jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint developer_endpoint_catalog_key_not_blank check (
        length(trim(endpoint_key)) > 0
    ),
    constraint developer_endpoint_catalog_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint developer_endpoint_catalog_description_not_blank check (
        length(trim(description)) > 0
    ),
    constraint developer_endpoint_catalog_method_check check (
        method in ('GET', 'POST')
    ),
    constraint developer_endpoint_catalog_route_check check (
        route_template ~ '^/'
    ),
    constraint developer_endpoint_catalog_minimum_tier_check check (
        minimum_tier in ('scout', 'command', 'staff')
    ),
    constraint developer_endpoint_catalog_quota_positive check (
        quota_weight > 0
    ),
    constraint developer_endpoint_catalog_example_object check (
        jsonb_typeof(example_request) = 'object'
    )
);

create index if not exists developer_endpoint_catalog_status_idx
on public.developer_endpoint_catalog (status, minimum_tier, endpoint_key);

drop trigger if exists set_developer_endpoint_catalog_updated_at
on public.developer_endpoint_catalog;
create trigger set_developer_endpoint_catalog_updated_at
before update on public.developer_endpoint_catalog
for each row execute function public.set_updated_at();

insert into public.developer_endpoint_catalog (
    endpoint_key,
    title,
    description,
    method,
    route_template,
    minimum_tier,
    quota_weight,
    response_format,
    includes_command_data,
    documentation_anchor,
    example_request
)
values
    (
        'lunar_articles',
        'Lunar Articles',
        'Published article teasers, member-readable bodies, tags, citations, and freshness metadata.',
        'GET',
        '/api/v1/articles',
        'scout',
        1,
        'json',
        false,
        'articles',
        '{"query": {"tag": "clps", "since": "2026-01-01"}}'::jsonb
    ),
    (
        'lunar_missions',
        'Lunar Missions',
        'Launches, spacecraft, landers, payloads, operators, source citations, and mission status.',
        'GET',
        '/api/v1/lunar-missions',
        'scout',
        2,
        'json',
        false,
        'missions',
        '{"query": {"status": "active", "operator": "Intuitive Machines"}}'::jsonb
    ),
    (
        'procurement_regulatory',
        'Procurement And Regulatory',
        'Lunar solicitations, awards, filings, policy milestones, comment periods, and risk notes.',
        'GET',
        '/api/v1/procurement-regulatory',
        'scout',
        2,
        'json',
        false,
        'procurement-regulatory',
        '{"query": {"kind": "solicitation", "due_before": "2026-09-30"}}'::jsonb
    ),
    (
        'company_profiles',
        'Company Profiles',
        'Company profiles, sectors, programs, relationships, contract signals, and comparison fields.',
        'GET',
        '/api/v1/companies',
        'scout',
        3,
        'json',
        false,
        'companies',
        '{"query": {"sector": "lunar-surface", "include": "contracts"}}'::jsonb
    ),
    (
        'command_briefs',
        'Command Briefs',
        'Organization-level briefings, allocation-aware Command intelligence, and delivery metadata.',
        'GET',
        '/api/v1/command/briefs',
        'command',
        5,
        'json',
        true,
        'command-briefs',
        '{"query": {"window": "latest", "organization_scope": true}}'::jsonb
    ),
    (
        'export_jobs',
        'Export Jobs',
        'Create and inspect CSV/PDF export jobs for entitled Scout and Command workflows.',
        'POST',
        '/api/v1/exports',
        'scout',
        5,
        'json',
        false,
        'exports',
        '{"body": {"export_type": "csv", "source_kind": "company_profiles"}}'::jsonb
    )
on conflict (endpoint_key) do update set
    title = excluded.title,
    description = excluded.description,
    method = excluded.method,
    route_template = excluded.route_template,
    minimum_tier = excluded.minimum_tier,
    quota_weight = excluded.quota_weight,
    response_format = excluded.response_format,
    includes_command_data = excluded.includes_command_data,
    documentation_anchor = excluded.documentation_anchor,
    example_request = excluded.example_request,
    status = 'active',
    updated_at = now();

create table if not exists public.developer_api_keys (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    key_name text not null,
    key_prefix text not null,
    key_hash text not null unique,
    tier text not null default 'scout',
    status public.developer_api_key_status not null default 'active',
    allowed_endpoint_keys text[] not null default '{}'::text[],
    monthly_quota_override integer,
    last_used_at timestamptz,
    expires_at timestamptz,
    revoked_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    constraint developer_api_keys_name_not_blank check (
        length(trim(key_name)) > 0
    ),
    constraint developer_api_keys_prefix_not_blank check (
        length(trim(key_prefix)) > 0
    ),
    constraint developer_api_keys_hash_not_blank check (
        length(trim(key_hash)) > 0
    ),
    constraint developer_api_keys_tier_check check (
        tier in ('scout', 'command', 'staff')
    ),
    constraint developer_api_keys_quota_nonnegative check (
        monthly_quota_override is null or monthly_quota_override >= 0
    ),
    constraint developer_api_keys_revoked_at_check check (
        status <> 'revoked' or revoked_at is not null
    )
);

create unique index if not exists developer_api_keys_owner_name_key
on public.developer_api_keys (
    owner_user_id,
    coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(key_name)
)
where status <> 'revoked';

create index if not exists developer_api_keys_owner_status_idx
on public.developer_api_keys (owner_user_id, status, updated_at desc);

create index if not exists developer_api_keys_org_status_idx
on public.developer_api_keys (organization_id, status, updated_at desc)
where organization_id is not null;

drop trigger if exists set_developer_api_keys_updated_at
on public.developer_api_keys;
create trigger set_developer_api_keys_updated_at
before update on public.developer_api_keys
for each row execute function public.set_updated_at();

create table if not exists public.developer_api_usage_logs (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid references auth.users(id) on delete set null,
    organization_id uuid references public.organizations(id) on delete set null,
    api_key_id uuid references public.developer_api_keys(id) on delete set null,
    endpoint_key text not null,
    event_kind public.developer_usage_event_kind not null default 'api_request',
    request_id text,
    status_code integer,
    quota_units integer not null default 1,
    response_ms integer,
    response_bytes integer,
    error_code text,
    occurred_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb,
    constraint developer_usage_endpoint_not_blank check (
        length(trim(endpoint_key)) > 0
    ),
    constraint developer_usage_status_code_check check (
        status_code is null or status_code between 100 and 599
    ),
    constraint developer_usage_nonnegative check (
        quota_units >= 0
        and (response_ms is null or response_ms >= 0)
        and (response_bytes is null or response_bytes >= 0)
    ),
    constraint developer_usage_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create index if not exists developer_api_usage_owner_month_idx
on public.developer_api_usage_logs (
    owner_user_id,
    occurred_at desc
);

create index if not exists developer_api_usage_org_month_idx
on public.developer_api_usage_logs (organization_id, occurred_at desc)
where organization_id is not null;

create index if not exists developer_api_usage_key_idx
on public.developer_api_usage_logs (api_key_id, occurred_at desc)
where api_key_id is not null;

create table if not exists public.developer_webhook_subscriptions (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    subscription_name text not null,
    endpoint_url text not null,
    signing_secret_hash text,
    event_kinds public.developer_webhook_event_kind[] not null,
    status public.developer_api_key_status not null default 'active',
    last_delivery_at timestamptz,
    failure_count integer not null default 0,
    disabled_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    constraint developer_webhooks_name_not_blank check (
        length(trim(subscription_name)) > 0
    ),
    constraint developer_webhooks_url_check check (
        endpoint_url ~* '^https://'
    ),
    constraint developer_webhooks_events_not_empty check (
        cardinality(event_kinds) > 0
    ),
    constraint developer_webhooks_failures_nonnegative check (
        failure_count >= 0
    )
);

create unique index if not exists developer_webhooks_owner_name_key
on public.developer_webhook_subscriptions (
    owner_user_id,
    coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(subscription_name)
)
where status <> 'revoked';

create index if not exists developer_webhooks_owner_status_idx
on public.developer_webhook_subscriptions (owner_user_id, status, updated_at desc);

drop trigger if exists set_developer_webhook_subscriptions_updated_at
on public.developer_webhook_subscriptions;
create trigger set_developer_webhook_subscriptions_updated_at
before update on public.developer_webhook_subscriptions
for each row execute function public.set_updated_at();

create table if not exists public.developer_webhook_delivery_events (
    id uuid primary key default gen_random_uuid(),
    subscription_id uuid references public.developer_webhook_subscriptions(id)
        on delete cascade,
    owner_user_id uuid references auth.users(id) on delete set null,
    organization_id uuid references public.organizations(id) on delete set null,
    event_kind public.developer_webhook_event_kind not null,
    delivery_status public.developer_delivery_status not null default 'queued',
    payload_record_id uuid,
    attempt_count integer not null default 0,
    next_attempt_at timestamptz,
    sent_at timestamptz,
    response_status_code integer,
    response_ms integer,
    last_error text,
    created_at timestamptz not null default now(),
    metadata jsonb not null default '{}'::jsonb,
    constraint developer_webhook_delivery_attempts_nonnegative check (
        attempt_count >= 0
        and (response_ms is null or response_ms >= 0)
    ),
    constraint developer_webhook_delivery_status_code check (
        response_status_code is null
        or response_status_code between 100 and 599
    ),
    constraint developer_webhook_delivery_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create index if not exists developer_webhook_delivery_subscription_idx
on public.developer_webhook_delivery_events (subscription_id, created_at desc)
where subscription_id is not null;

create index if not exists developer_webhook_delivery_queue_idx
on public.developer_webhook_delivery_events (
    delivery_status,
    next_attempt_at nulls first,
    created_at
)
where delivery_status = 'queued';

create table if not exists public.developer_export_jobs (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    export_name text not null,
    source_kind text not null,
    export_format text not null default 'csv',
    status public.developer_export_job_status not null default 'queued',
    requested_filters jsonb not null default '{}'::jsonb,
    storage_bucket text,
    storage_path text,
    row_count integer,
    file_size_bytes bigint,
    requested_at timestamptz not null default now(),
    completed_at timestamptz,
    expires_at timestamptz,
    failure_reason text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    constraint developer_export_name_not_blank check (
        length(trim(export_name)) > 0
    ),
    constraint developer_export_source_not_blank check (
        length(trim(source_kind)) > 0
    ),
    constraint developer_export_format_check check (
        export_format in ('csv', 'pdf', 'json')
    ),
    constraint developer_export_counts_nonnegative check (
        (row_count is null or row_count >= 0)
        and (file_size_bytes is null or file_size_bytes >= 0)
    ),
    constraint developer_export_filters_object check (
        jsonb_typeof(requested_filters) = 'object'
    )
);

create index if not exists developer_export_jobs_owner_status_idx
on public.developer_export_jobs (owner_user_id, status, requested_at desc);

create index if not exists developer_export_jobs_queue_idx
on public.developer_export_jobs (status, requested_at)
where status in ('queued', 'processing');

drop trigger if exists set_developer_export_jobs_updated_at
on public.developer_export_jobs;
create trigger set_developer_export_jobs_updated_at
before update on public.developer_export_jobs
for each row execute function public.set_updated_at();

create or replace function app_private.can_use_developer_platform()
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

create or replace function app_private.can_access_developer_platform(
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

grant execute on function app_private.can_use_developer_platform()
to authenticated;
grant execute on function app_private.can_access_developer_platform(uuid, uuid)
to authenticated;

alter table public.developer_tier_limits enable row level security;
alter table public.developer_endpoint_catalog enable row level security;
alter table public.developer_api_keys enable row level security;
alter table public.developer_api_usage_logs enable row level security;
alter table public.developer_webhook_subscriptions enable row level security;
alter table public.developer_webhook_delivery_events enable row level security;
alter table public.developer_export_jobs enable row level security;

grant select on
    public.developer_tier_limits,
    public.developer_endpoint_catalog
to anon, authenticated;

grant select, insert, update, delete on
    public.developer_api_keys,
    public.developer_webhook_subscriptions,
    public.developer_export_jobs
to authenticated;

grant select, insert on
    public.developer_api_usage_logs,
    public.developer_webhook_delivery_events
to authenticated;

grant all on
    public.developer_tier_limits,
    public.developer_endpoint_catalog,
    public.developer_api_keys,
    public.developer_api_usage_logs,
    public.developer_webhook_subscriptions,
    public.developer_webhook_delivery_events,
    public.developer_export_jobs
to service_role;

drop policy if exists "developer_tier_limits_public_read"
on public.developer_tier_limits;
create policy "developer_tier_limits_public_read"
on public.developer_tier_limits
for select
using (true);

drop policy if exists "developer_endpoint_catalog_public_read"
on public.developer_endpoint_catalog;
create policy "developer_endpoint_catalog_public_read"
on public.developer_endpoint_catalog
for select
using (status = 'active');

drop policy if exists "developer_endpoint_catalog_staff_manage"
on public.developer_endpoint_catalog;
create policy "developer_endpoint_catalog_staff_manage"
on public.developer_endpoint_catalog
for all
to authenticated
using (app_private.has_any_role(array['admin', 'analyst']))
with check (app_private.has_any_role(array['admin', 'analyst']));

drop policy if exists "developer_api_keys_select_relevant"
on public.developer_api_keys;
create policy "developer_api_keys_select_relevant"
on public.developer_api_keys
for select
to authenticated
using (app_private.can_access_developer_platform(owner_user_id, organization_id));

drop policy if exists "developer_api_keys_insert_paid_owner"
on public.developer_api_keys;
create policy "developer_api_keys_insert_paid_owner"
on public.developer_api_keys
for insert
to authenticated
with check (
    owner_user_id = auth.uid()
    and app_private.can_use_developer_platform()
    and app_private.can_access_developer_platform(owner_user_id, organization_id)
);

drop policy if exists "developer_api_keys_update_relevant"
on public.developer_api_keys;
create policy "developer_api_keys_update_relevant"
on public.developer_api_keys
for update
to authenticated
using (app_private.can_access_developer_platform(owner_user_id, organization_id))
with check (
    app_private.can_use_developer_platform()
    and app_private.can_access_developer_platform(owner_user_id, organization_id)
);

drop policy if exists "developer_api_keys_delete_staff"
on public.developer_api_keys;
create policy "developer_api_keys_delete_staff"
on public.developer_api_keys
for delete
to authenticated
using (app_private.has_any_role(array['admin']));

drop policy if exists "developer_usage_select_relevant"
on public.developer_api_usage_logs;
create policy "developer_usage_select_relevant"
on public.developer_api_usage_logs
for select
to authenticated
using (app_private.can_access_developer_platform(owner_user_id, organization_id));

drop policy if exists "developer_usage_insert_service_or_staff"
on public.developer_api_usage_logs;
create policy "developer_usage_insert_service_or_staff"
on public.developer_api_usage_logs
for insert
to authenticated
with check (app_private.has_any_role(array['admin', 'analyst']));

drop policy if exists "developer_webhooks_select_relevant"
on public.developer_webhook_subscriptions;
create policy "developer_webhooks_select_relevant"
on public.developer_webhook_subscriptions
for select
to authenticated
using (app_private.can_access_developer_platform(owner_user_id, organization_id));

drop policy if exists "developer_webhooks_insert_command_owner"
on public.developer_webhook_subscriptions;
create policy "developer_webhooks_insert_command_owner"
on public.developer_webhook_subscriptions
for insert
to authenticated
with check (
    owner_user_id = auth.uid()
    and app_private.has_any_role(array['command_user', 'admin', 'analyst'])
    and app_private.can_access_developer_platform(owner_user_id, organization_id)
);

drop policy if exists "developer_webhooks_update_relevant"
on public.developer_webhook_subscriptions;
create policy "developer_webhooks_update_relevant"
on public.developer_webhook_subscriptions
for update
to authenticated
using (app_private.can_access_developer_platform(owner_user_id, organization_id))
with check (
    app_private.has_any_role(array['command_user', 'admin', 'analyst'])
    and app_private.can_access_developer_platform(owner_user_id, organization_id)
);

drop policy if exists "developer_webhooks_delete_relevant"
on public.developer_webhook_subscriptions;
create policy "developer_webhooks_delete_relevant"
on public.developer_webhook_subscriptions
for delete
to authenticated
using (app_private.can_access_developer_platform(owner_user_id, organization_id));

drop policy if exists "developer_webhook_deliveries_select_relevant"
on public.developer_webhook_delivery_events;
create policy "developer_webhook_deliveries_select_relevant"
on public.developer_webhook_delivery_events
for select
to authenticated
using (app_private.can_access_developer_platform(owner_user_id, organization_id));

drop policy if exists "developer_webhook_deliveries_insert_staff"
on public.developer_webhook_delivery_events;
create policy "developer_webhook_deliveries_insert_staff"
on public.developer_webhook_delivery_events
for insert
to authenticated
with check (app_private.has_any_role(array['admin', 'analyst']));

drop policy if exists "developer_export_jobs_select_relevant"
on public.developer_export_jobs;
create policy "developer_export_jobs_select_relevant"
on public.developer_export_jobs
for select
to authenticated
using (app_private.can_access_developer_platform(owner_user_id, organization_id));

drop policy if exists "developer_export_jobs_insert_paid_owner"
on public.developer_export_jobs;
create policy "developer_export_jobs_insert_paid_owner"
on public.developer_export_jobs
for insert
to authenticated
with check (
    owner_user_id = auth.uid()
    and app_private.can_use_developer_platform()
    and app_private.can_access_developer_platform(owner_user_id, organization_id)
);

drop policy if exists "developer_export_jobs_update_relevant"
on public.developer_export_jobs;
create policy "developer_export_jobs_update_relevant"
on public.developer_export_jobs
for update
to authenticated
using (app_private.can_access_developer_platform(owner_user_id, organization_id))
with check (
    app_private.can_use_developer_platform()
    and app_private.can_access_developer_platform(owner_user_id, organization_id)
);

drop policy if exists "developer_export_jobs_delete_relevant"
on public.developer_export_jobs;
create policy "developer_export_jobs_delete_relevant"
on public.developer_export_jobs
for delete
to authenticated
using (app_private.can_access_developer_platform(owner_user_id, organization_id));
