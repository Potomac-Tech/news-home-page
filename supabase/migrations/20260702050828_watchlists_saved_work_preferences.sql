do $$
begin
    create type public.saved_work_object_kind as enum (
        'article',
        'company',
        'lunar_mission',
        'procurement',
        'regulatory_record',
        'event',
        'dataset',
        'marketplace_record',
        'methodology_source',
        'calculator',
        'rfq',
        'forum_thread'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.saved_work_status as enum (
        'active',
        'muted',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.saved_search_frequency as enum (
        'off',
        'immediate',
        'daily',
        'weekly'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.notification_channel as enum (
        'in_app',
        'email'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.member_watchlists (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    name text not null,
    description text,
    color_label text,
    is_default boolean not null default false,
    status public.saved_work_status not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    constraint member_watchlists_name_not_blank check (
        length(trim(name)) > 0
    ),
    constraint member_watchlists_color_not_blank check (
        color_label is null or length(trim(color_label)) > 0
    )
);

create unique index if not exists member_watchlists_owner_default_key
on public.member_watchlists (owner_user_id)
where is_default and status = 'active' and organization_id is null;

create unique index if not exists member_watchlists_org_default_key
on public.member_watchlists (owner_user_id, organization_id)
where is_default and status = 'active' and organization_id is not null;

create index if not exists member_watchlists_owner_status_idx
on public.member_watchlists (owner_user_id, status, updated_at desc);

create index if not exists member_watchlists_organization_idx
on public.member_watchlists (organization_id, status, updated_at desc)
where organization_id is not null;

drop trigger if exists set_member_watchlists_updated_at
on public.member_watchlists;
create trigger set_member_watchlists_updated_at
before update on public.member_watchlists
for each row execute function public.set_updated_at();

create table if not exists public.member_watchlist_items (
    id uuid primary key default gen_random_uuid(),
    watchlist_id uuid not null
        references public.member_watchlists(id) on delete cascade,
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    object_kind public.saved_work_object_kind not null,
    object_id uuid,
    object_slug text,
    object_title text not null,
    object_route_path text not null,
    object_source_table text,
    watch_reason text,
    status public.saved_work_status not null default 'active',
    notify_in_app boolean not null default true,
    notify_email boolean not null default false,
    last_seen_at timestamptz,
    last_notified_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    constraint member_watchlist_items_title_not_blank check (
        length(trim(object_title)) > 0
    ),
    constraint member_watchlist_items_route_not_blank check (
        length(trim(object_route_path)) > 0
    ),
    constraint member_watchlist_items_route_format check (
        object_route_path ~ '^/'
        or object_route_path ~* '^https?://'
    ),
    constraint member_watchlist_items_has_identifier check (
        object_id is not null or object_slug is not null
    ),
    constraint member_watchlist_items_slug_not_blank check (
        object_slug is null or length(trim(object_slug)) > 0
    ),
    constraint member_watchlist_items_source_not_blank check (
        object_source_table is null or length(trim(object_source_table)) > 0
    ),
    constraint member_watchlist_items_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create unique index if not exists member_watchlist_items_object_key
on public.member_watchlist_items (
    watchlist_id,
    object_kind,
    coalesce(object_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(lower(object_slug), '')
)
where status = 'active';

create index if not exists member_watchlist_items_watchlist_idx
on public.member_watchlist_items (watchlist_id, status, updated_at desc);

create index if not exists member_watchlist_items_owner_kind_idx
on public.member_watchlist_items (
    owner_user_id,
    object_kind,
    status,
    updated_at desc
);

create index if not exists member_watchlist_items_organization_idx
on public.member_watchlist_items (organization_id, object_kind, status)
where organization_id is not null;

drop trigger if exists set_member_watchlist_items_updated_at
on public.member_watchlist_items;
create trigger set_member_watchlist_items_updated_at
before update on public.member_watchlist_items
for each row execute function public.set_updated_at();

create table if not exists public.member_saved_searches (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    name text not null,
    query text not null default '',
    scope public.saved_work_object_kind,
    filters jsonb not null default '{}'::jsonb,
    route_path text not null default '/search',
    status public.saved_work_status not null default 'active',
    alert_frequency public.saved_search_frequency not null default 'off',
    last_run_at timestamptz,
    last_result_count integer,
    last_new_result_count integer,
    last_notified_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    constraint member_saved_searches_name_not_blank check (
        length(trim(name)) > 0
    ),
    constraint member_saved_searches_route_format check (
        route_path ~ '^/' or route_path ~* '^https?://'
    ),
    constraint member_saved_searches_counts_nonnegative check (
        (last_result_count is null or last_result_count >= 0)
        and (last_new_result_count is null or last_new_result_count >= 0)
    ),
    constraint member_saved_searches_filters_object check (
        jsonb_typeof(filters) = 'object'
    )
);

create index if not exists member_saved_searches_owner_status_idx
on public.member_saved_searches (owner_user_id, status, updated_at desc);

create index if not exists member_saved_searches_alert_idx
on public.member_saved_searches (
    alert_frequency,
    status,
    last_run_at nulls first
)
where alert_frequency <> 'off' and status = 'active';

create index if not exists member_saved_searches_organization_idx
on public.member_saved_searches (organization_id, status, updated_at desc)
where organization_id is not null;

drop trigger if exists set_member_saved_searches_updated_at
on public.member_saved_searches;
create trigger set_member_saved_searches_updated_at
before update on public.member_saved_searches
for each row execute function public.set_updated_at();

create table if not exists public.member_reading_list_items (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    object_kind public.saved_work_object_kind not null default 'article',
    object_id uuid,
    object_slug text,
    title text not null,
    route_path text not null,
    summary text,
    status public.saved_work_status not null default 'active',
    is_read boolean not null default false,
    saved_at timestamptz not null default now(),
    read_at timestamptz,
    archived_at timestamptz,
    notes text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    constraint member_reading_list_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint member_reading_list_route_not_blank check (
        length(trim(route_path)) > 0
    ),
    constraint member_reading_list_route_format check (
        route_path ~ '^/' or route_path ~* '^https?://'
    ),
    constraint member_reading_list_has_identifier check (
        object_id is not null or object_slug is not null
    ),
    constraint member_reading_list_read_at_check check (
        not is_read or read_at is not null
    ),
    constraint member_reading_list_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create unique index if not exists member_reading_list_items_object_key
on public.member_reading_list_items (
    owner_user_id,
    object_kind,
    coalesce(object_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(lower(object_slug), '')
)
where status = 'active';

create index if not exists member_reading_list_items_owner_idx
on public.member_reading_list_items (
    owner_user_id,
    status,
    is_read,
    saved_at desc
);

create index if not exists member_reading_list_items_organization_idx
on public.member_reading_list_items (organization_id, status, saved_at desc)
where organization_id is not null;

drop trigger if exists set_member_reading_list_items_updated_at
on public.member_reading_list_items;
create trigger set_member_reading_list_items_updated_at
before update on public.member_reading_list_items
for each row execute function public.set_updated_at();

create table if not exists public.member_notification_preferences (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    channel public.notification_channel not null,
    object_kind public.saved_work_object_kind,
    enabled boolean not null default true,
    frequency public.saved_search_frequency not null default 'daily',
    quiet_hours_start time,
    quiet_hours_end time,
    timezone text not null default 'America/New_York',
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    constraint member_notification_preferences_timezone_not_blank check (
        length(trim(timezone)) > 0
    ),
    constraint member_notification_preferences_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create unique index if not exists member_notification_preferences_key
on public.member_notification_preferences (
    owner_user_id,
    coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid),
    channel,
    coalesce(object_kind::text, '')
);

create index if not exists member_notification_preferences_owner_idx
on public.member_notification_preferences (owner_user_id, enabled, channel);

drop trigger if exists set_member_notification_preferences_updated_at
on public.member_notification_preferences;
create trigger set_member_notification_preferences_updated_at
before update on public.member_notification_preferences
for each row execute function public.set_updated_at();

create table if not exists public.member_dashboard_preferences (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    dashboard_key text not null default 'terminal',
    layout_config jsonb not null default '{}'::jsonb,
    default_filters jsonb not null default '{}'::jsonb,
    pinned_module_keys text[] not null default '{}'::text[],
    hidden_module_keys text[] not null default '{}'::text[],
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    constraint member_dashboard_preferences_key_not_blank check (
        length(trim(dashboard_key)) > 0
    ),
    constraint member_dashboard_preferences_layout_object check (
        jsonb_typeof(layout_config) = 'object'
    ),
    constraint member_dashboard_preferences_filters_object check (
        jsonb_typeof(default_filters) = 'object'
    )
);

create unique index if not exists member_dashboard_preferences_owner_key
on public.member_dashboard_preferences (
    owner_user_id,
    coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(dashboard_key)
);

create index if not exists member_dashboard_preferences_organization_idx
on public.member_dashboard_preferences (organization_id, dashboard_key)
where organization_id is not null;

drop trigger if exists set_member_dashboard_preferences_updated_at
on public.member_dashboard_preferences;
create trigger set_member_dashboard_preferences_updated_at
before update on public.member_dashboard_preferences
for each row execute function public.set_updated_at();

create table if not exists public.member_saved_work_audit_events (
    id uuid primary key default gen_random_uuid(),
    actor_user_id uuid references auth.users(id) on delete set null,
    owner_user_id uuid references auth.users(id) on delete set null,
    organization_id uuid references public.organizations(id) on delete set null,
    event_type text not null,
    target_table text not null,
    target_record_id uuid,
    event_summary text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint member_saved_work_audit_type_not_blank check (
        length(trim(event_type)) > 0
    ),
    constraint member_saved_work_audit_table_not_blank check (
        length(trim(target_table)) > 0
    ),
    constraint member_saved_work_audit_summary_not_blank check (
        length(trim(event_summary)) > 0
    ),
    constraint member_saved_work_audit_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create index if not exists member_saved_work_audit_owner_created_idx
on public.member_saved_work_audit_events (owner_user_id, created_at desc);

create index if not exists member_saved_work_audit_org_created_idx
on public.member_saved_work_audit_events (organization_id, created_at desc)
where organization_id is not null;

create or replace function app_private.can_use_saved_work()
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

create or replace function app_private.can_access_saved_work(
    target_owner_user_id uuid,
    target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select auth.uid() = target_owner_user_id
        or (
            target_organization_id is not null
            and app_private.is_org_admin(target_organization_id)
        )
        or app_private.has_any_role(array['analyst', 'admin']);
$$;

grant execute on function app_private.can_use_saved_work() to authenticated;
grant execute on function app_private.can_access_saved_work(uuid, uuid)
to authenticated;

alter table public.member_watchlists enable row level security;
alter table public.member_watchlist_items enable row level security;
alter table public.member_saved_searches enable row level security;
alter table public.member_reading_list_items enable row level security;
alter table public.member_notification_preferences enable row level security;
alter table public.member_dashboard_preferences enable row level security;
alter table public.member_saved_work_audit_events enable row level security;

grant select, insert, update, delete on
    public.member_watchlists,
    public.member_watchlist_items,
    public.member_saved_searches,
    public.member_reading_list_items,
    public.member_notification_preferences,
    public.member_dashboard_preferences
to authenticated;

grant select, insert on public.member_saved_work_audit_events
to authenticated;

grant all on
    public.member_watchlists,
    public.member_watchlist_items,
    public.member_saved_searches,
    public.member_reading_list_items,
    public.member_notification_preferences,
    public.member_dashboard_preferences,
    public.member_saved_work_audit_events
to service_role;

drop policy if exists "member_watchlists_select_relevant"
on public.member_watchlists;
create policy "member_watchlists_select_relevant"
on public.member_watchlists
for select
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id));

drop policy if exists "member_watchlists_insert_paid_owner"
on public.member_watchlists;
create policy "member_watchlists_insert_paid_owner"
on public.member_watchlists
for insert
to authenticated
with check (
    app_private.can_use_saved_work()
    and owner_user_id = auth.uid()
    and (
        organization_id is null
        or app_private.is_org_admin(organization_id)
    )
);

drop policy if exists "member_watchlists_update_relevant"
on public.member_watchlists;
create policy "member_watchlists_update_relevant"
on public.member_watchlists
for update
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id))
with check (
    app_private.can_use_saved_work()
    and app_private.can_access_saved_work(owner_user_id, organization_id)
);

drop policy if exists "member_watchlists_delete_relevant"
on public.member_watchlists;
create policy "member_watchlists_delete_relevant"
on public.member_watchlists
for delete
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id));

drop policy if exists "member_watchlist_items_select_relevant"
on public.member_watchlist_items;
create policy "member_watchlist_items_select_relevant"
on public.member_watchlist_items
for select
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id));

drop policy if exists "member_watchlist_items_insert_paid_owner"
on public.member_watchlist_items;
create policy "member_watchlist_items_insert_paid_owner"
on public.member_watchlist_items
for insert
to authenticated
with check (
    app_private.can_use_saved_work()
    and owner_user_id = auth.uid()
    and exists (
        select 1
        from public.member_watchlists watchlist
        where watchlist.id = member_watchlist_items.watchlist_id
            and watchlist.owner_user_id = member_watchlist_items.owner_user_id
            and (
                watchlist.organization_id is not distinct from
                    member_watchlist_items.organization_id
            )
            and app_private.can_access_saved_work(
                watchlist.owner_user_id,
                watchlist.organization_id
            )
    )
);

drop policy if exists "member_watchlist_items_update_relevant"
on public.member_watchlist_items;
create policy "member_watchlist_items_update_relevant"
on public.member_watchlist_items
for update
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id))
with check (
    app_private.can_use_saved_work()
    and app_private.can_access_saved_work(owner_user_id, organization_id)
);

drop policy if exists "member_watchlist_items_delete_relevant"
on public.member_watchlist_items;
create policy "member_watchlist_items_delete_relevant"
on public.member_watchlist_items
for delete
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id));

drop policy if exists "member_saved_searches_select_relevant"
on public.member_saved_searches;
create policy "member_saved_searches_select_relevant"
on public.member_saved_searches
for select
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id));

drop policy if exists "member_saved_searches_insert_paid_owner"
on public.member_saved_searches;
create policy "member_saved_searches_insert_paid_owner"
on public.member_saved_searches
for insert
to authenticated
with check (
    app_private.can_use_saved_work()
    and owner_user_id = auth.uid()
    and (
        organization_id is null
        or app_private.is_org_admin(organization_id)
    )
);

drop policy if exists "member_saved_searches_update_relevant"
on public.member_saved_searches;
create policy "member_saved_searches_update_relevant"
on public.member_saved_searches
for update
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id))
with check (
    app_private.can_use_saved_work()
    and app_private.can_access_saved_work(owner_user_id, organization_id)
);

drop policy if exists "member_saved_searches_delete_relevant"
on public.member_saved_searches;
create policy "member_saved_searches_delete_relevant"
on public.member_saved_searches
for delete
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id));

drop policy if exists "member_reading_list_items_select_relevant"
on public.member_reading_list_items;
create policy "member_reading_list_items_select_relevant"
on public.member_reading_list_items
for select
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id));

drop policy if exists "member_reading_list_items_insert_paid_owner"
on public.member_reading_list_items;
create policy "member_reading_list_items_insert_paid_owner"
on public.member_reading_list_items
for insert
to authenticated
with check (
    app_private.can_use_saved_work()
    and owner_user_id = auth.uid()
    and (
        organization_id is null
        or app_private.is_org_admin(organization_id)
    )
);

drop policy if exists "member_reading_list_items_update_relevant"
on public.member_reading_list_items;
create policy "member_reading_list_items_update_relevant"
on public.member_reading_list_items
for update
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id))
with check (
    app_private.can_use_saved_work()
    and app_private.can_access_saved_work(owner_user_id, organization_id)
);

drop policy if exists "member_reading_list_items_delete_relevant"
on public.member_reading_list_items;
create policy "member_reading_list_items_delete_relevant"
on public.member_reading_list_items
for delete
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id));

drop policy if exists "member_notification_preferences_select_relevant"
on public.member_notification_preferences;
create policy "member_notification_preferences_select_relevant"
on public.member_notification_preferences
for select
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id));

drop policy if exists "member_notification_preferences_insert_paid_owner"
on public.member_notification_preferences;
create policy "member_notification_preferences_insert_paid_owner"
on public.member_notification_preferences
for insert
to authenticated
with check (
    app_private.can_use_saved_work()
    and owner_user_id = auth.uid()
    and (
        organization_id is null
        or app_private.is_org_admin(organization_id)
    )
);

drop policy if exists "member_notification_preferences_update_relevant"
on public.member_notification_preferences;
create policy "member_notification_preferences_update_relevant"
on public.member_notification_preferences
for update
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id))
with check (
    app_private.can_use_saved_work()
    and app_private.can_access_saved_work(owner_user_id, organization_id)
);

drop policy if exists "member_notification_preferences_delete_relevant"
on public.member_notification_preferences;
create policy "member_notification_preferences_delete_relevant"
on public.member_notification_preferences
for delete
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id));

drop policy if exists "member_dashboard_preferences_select_relevant"
on public.member_dashboard_preferences;
create policy "member_dashboard_preferences_select_relevant"
on public.member_dashboard_preferences
for select
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id));

drop policy if exists "member_dashboard_preferences_insert_paid_owner"
on public.member_dashboard_preferences;
create policy "member_dashboard_preferences_insert_paid_owner"
on public.member_dashboard_preferences
for insert
to authenticated
with check (
    app_private.can_use_saved_work()
    and owner_user_id = auth.uid()
    and (
        organization_id is null
        or app_private.is_org_admin(organization_id)
    )
);

drop policy if exists "member_dashboard_preferences_update_relevant"
on public.member_dashboard_preferences;
create policy "member_dashboard_preferences_update_relevant"
on public.member_dashboard_preferences
for update
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id))
with check (
    app_private.can_use_saved_work()
    and app_private.can_access_saved_work(owner_user_id, organization_id)
);

drop policy if exists "member_dashboard_preferences_delete_relevant"
on public.member_dashboard_preferences;
create policy "member_dashboard_preferences_delete_relevant"
on public.member_dashboard_preferences
for delete
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id));

drop policy if exists "member_saved_work_audit_events_select_relevant"
on public.member_saved_work_audit_events;
create policy "member_saved_work_audit_events_select_relevant"
on public.member_saved_work_audit_events
for select
to authenticated
using (app_private.can_access_saved_work(owner_user_id, organization_id));

drop policy if exists "member_saved_work_audit_events_insert_relevant"
on public.member_saved_work_audit_events;
create policy "member_saved_work_audit_events_insert_relevant"
on public.member_saved_work_audit_events
for insert
to authenticated
with check (
    actor_user_id = auth.uid()
    and app_private.can_access_saved_work(owner_user_id, organization_id)
);
