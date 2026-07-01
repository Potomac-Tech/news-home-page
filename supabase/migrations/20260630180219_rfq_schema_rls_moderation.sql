do $$
begin
    create type public.rfq_visibility as enum (
        'scout_command',
        'command_only',
        'invited_organizations'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.rfq_status as enum (
        'draft',
        'open',
        'paused',
        'awarded',
        'closed',
        'cancelled',
        'removed_by_moderator'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.rfq_response_status as enum (
        'draft',
        'submitted',
        'withdrawn',
        'shortlisted',
        'declined',
        'accepted',
        'removed_by_moderator'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.rfq_report_status as enum (
        'open',
        'reviewing',
        'resolved',
        'dismissed'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.rfq_moderation_action_type as enum (
        'rfq_hidden',
        'rfq_restored',
        'response_hidden',
        'response_restored',
        'participant_warned',
        'report_resolved',
        'report_dismissed'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.rfq_posts (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    summary text not null,
    description text not null,
    category text not null,
    procurement_stage text,
    location text,
    budget_range text,
    due_at timestamptz,
    question_deadline_at timestamptz,
    visibility public.rfq_visibility not null default 'scout_command',
    status public.rfq_status not null default 'draft',
    created_by uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete set null,
    contact_name text,
    contact_email text,
    awarded_response_id uuid,
    published_at timestamptz,
    closed_at timestamptz,
    removed_at timestamptz,
    removed_by uuid references auth.users(id) on delete set null,
    moderation_note text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint rfq_posts_title_not_blank check (length(trim(title)) > 0),
    constraint rfq_posts_summary_not_blank check (length(trim(summary)) > 0),
    constraint rfq_posts_description_not_blank check (length(trim(description)) > 0),
    constraint rfq_posts_category_not_blank check (length(trim(category)) > 0),
    constraint rfq_posts_due_after_question_deadline check (
        due_at is null
        or question_deadline_at is null
        or due_at >= question_deadline_at
    ),
    constraint rfq_posts_published_when_open check (
        status <> 'open'
        or published_at is not null
    ),
    constraint rfq_posts_removed_has_actor check (
        status <> 'removed_by_moderator'
        or (removed_at is not null and removed_by is not null)
    )
);

create index if not exists rfq_posts_status_due_idx
on public.rfq_posts (status, due_at asc nulls last, published_at desc);

create index if not exists rfq_posts_org_status_idx
on public.rfq_posts (organization_id, status, created_at desc)
where organization_id is not null;

create index if not exists rfq_posts_creator_idx
on public.rfq_posts (created_by, created_at desc);

drop trigger if exists set_rfq_posts_updated_at
on public.rfq_posts;
create trigger set_rfq_posts_updated_at
before update on public.rfq_posts
for each row execute function public.set_updated_at();

create table if not exists public.rfq_invited_organizations (
    rfq_id uuid not null references public.rfq_posts(id) on delete cascade,
    organization_id uuid not null references public.organizations(id) on delete cascade,
    invited_by uuid references auth.users(id) on delete set null,
    invited_at timestamptz not null default now(),
    note text,
    primary key (rfq_id, organization_id)
);

create index if not exists rfq_invited_organizations_org_idx
on public.rfq_invited_organizations (organization_id, invited_at desc);

create table if not exists public.rfq_resource_links (
    id uuid primary key default gen_random_uuid(),
    rfq_id uuid not null references public.rfq_posts(id) on delete cascade,
    label text not null,
    external_url text,
    storage_path text,
    source_note text,
    sort_order integer not null default 100,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    constraint rfq_resource_links_label_not_blank check (length(trim(label)) > 0),
    constraint rfq_resource_links_target_check check (
        external_url is not null
        or storage_path is not null
    )
);

create index if not exists rfq_resource_links_rfq_idx
on public.rfq_resource_links (rfq_id, sort_order, created_at);

create table if not exists public.rfq_responses (
    id uuid primary key default gen_random_uuid(),
    rfq_id uuid not null references public.rfq_posts(id) on delete cascade,
    responder_user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete set null,
    status public.rfq_response_status not null default 'draft',
    response_summary text not null,
    response_body text not null,
    estimated_price text,
    delivery_timeline text,
    contact_name text,
    contact_email text,
    submitted_at timestamptz,
    withdrawn_at timestamptz,
    reviewed_by uuid references auth.users(id) on delete set null,
    reviewed_at timestamptz,
    removed_at timestamptz,
    removed_by uuid references auth.users(id) on delete set null,
    moderation_note text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint rfq_responses_summary_not_blank check (length(trim(response_summary)) > 0),
    constraint rfq_responses_body_not_blank check (length(trim(response_body)) > 0),
    constraint rfq_responses_submitted_when_submitted check (
        status <> 'submitted'
        or submitted_at is not null
    ),
    constraint rfq_responses_withdrawn_when_withdrawn check (
        status <> 'withdrawn'
        or withdrawn_at is not null
    ),
    constraint rfq_responses_removed_has_actor check (
        status <> 'removed_by_moderator'
        or (removed_at is not null and removed_by is not null)
    )
);

create unique index if not exists rfq_responses_rfq_responder_org_key
on public.rfq_responses (
    rfq_id,
    responder_user_id,
    coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create index if not exists rfq_responses_rfq_status_idx
on public.rfq_responses (rfq_id, status, submitted_at desc nulls last);

create index if not exists rfq_responses_responder_idx
on public.rfq_responses (responder_user_id, created_at desc);

drop trigger if exists set_rfq_responses_updated_at
on public.rfq_responses;
create trigger set_rfq_responses_updated_at
before update on public.rfq_responses
for each row execute function public.set_updated_at();

alter table public.rfq_posts
    drop constraint if exists rfq_posts_awarded_response_fk;

alter table public.rfq_posts
    add constraint rfq_posts_awarded_response_fk
    foreign key (awarded_response_id)
    references public.rfq_responses(id)
    on delete set null;

create table if not exists public.rfq_response_resource_links (
    id uuid primary key default gen_random_uuid(),
    response_id uuid not null references public.rfq_responses(id) on delete cascade,
    label text not null,
    external_url text,
    storage_path text,
    source_note text,
    sort_order integer not null default 100,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    constraint rfq_response_resource_links_label_not_blank check (length(trim(label)) > 0),
    constraint rfq_response_resource_links_target_check check (
        external_url is not null
        or storage_path is not null
    )
);

create index if not exists rfq_response_resource_links_response_idx
on public.rfq_response_resource_links (response_id, sort_order, created_at);

create table if not exists public.rfq_status_events (
    id uuid primary key default gen_random_uuid(),
    rfq_id uuid not null references public.rfq_posts(id) on delete cascade,
    actor_user_id uuid references auth.users(id) on delete set null,
    from_status public.rfq_status,
    to_status public.rfq_status not null,
    note text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists rfq_status_events_rfq_idx
on public.rfq_status_events (rfq_id, created_at desc);

create table if not exists public.rfq_reports (
    id uuid primary key default gen_random_uuid(),
    rfq_id uuid not null references public.rfq_posts(id) on delete cascade,
    response_id uuid references public.rfq_responses(id) on delete set null,
    reporter_user_id uuid not null references auth.users(id) on delete cascade,
    reported_user_id uuid references auth.users(id) on delete set null,
    status public.rfq_report_status not null default 'open',
    reason text not null,
    reporter_note text,
    reviewed_by uuid references auth.users(id) on delete set null,
    reviewed_at timestamptz,
    resolution_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint rfq_reports_reason_not_blank check (length(trim(reason)) > 0),
    constraint rfq_reports_reviewed_has_actor check (
        status not in ('resolved', 'dismissed')
        or (reviewed_by is not null and reviewed_at is not null)
    )
);

create index if not exists rfq_reports_status_created_idx
on public.rfq_reports (status, created_at desc);

create index if not exists rfq_reports_reporter_idx
on public.rfq_reports (reporter_user_id, created_at desc);

drop trigger if exists set_rfq_reports_updated_at
on public.rfq_reports;
create trigger set_rfq_reports_updated_at
before update on public.rfq_reports
for each row execute function public.set_updated_at();

create table if not exists public.rfq_moderation_actions (
    id uuid primary key default gen_random_uuid(),
    report_id uuid references public.rfq_reports(id) on delete set null,
    rfq_id uuid references public.rfq_posts(id) on delete cascade,
    response_id uuid references public.rfq_responses(id) on delete set null,
    target_user_id uuid references auth.users(id) on delete set null,
    actor_user_id uuid not null references auth.users(id) on delete cascade,
    action_type public.rfq_moderation_action_type not null,
    action_note text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint rfq_moderation_actions_target_check check (
        report_id is not null
        or rfq_id is not null
        or response_id is not null
        or target_user_id is not null
    )
);

create index if not exists rfq_moderation_actions_report_idx
on public.rfq_moderation_actions (report_id, created_at desc)
where report_id is not null;

create index if not exists rfq_moderation_actions_rfq_idx
on public.rfq_moderation_actions (rfq_id, created_at desc)
where rfq_id is not null;

create table if not exists public.rfq_audit_events (
    id uuid primary key default gen_random_uuid(),
    actor_user_id uuid references auth.users(id) on delete set null,
    rfq_id uuid references public.rfq_posts(id) on delete cascade,
    response_id uuid references public.rfq_responses(id) on delete set null,
    organization_id uuid references public.organizations(id) on delete set null,
    target_user_id uuid references auth.users(id) on delete set null,
    event_type text not null,
    event_summary text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint rfq_audit_events_type_not_blank check (length(trim(event_type)) > 0),
    constraint rfq_audit_events_summary_not_blank check (length(trim(event_summary)) > 0)
);

create index if not exists rfq_audit_events_rfq_idx
on public.rfq_audit_events (rfq_id, created_at desc)
where rfq_id is not null;

create or replace function app_private.can_use_rfqs(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select target_user_id is not null
        and exists (
            select 1
            from public.member_role_assignments role_assignment
            where role_assignment.user_id = target_user_id
                and role_assignment.role_id in (
                    'scout',
                    'command_user',
                    'moderator',
                    'analyst',
                    'admin'
                )
                and (
                    role_assignment.expires_at is null
                    or role_assignment.expires_at > now()
                )
        );
$$;

create or replace function app_private.can_use_command_rfqs(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select target_user_id is not null
        and exists (
            select 1
            from public.member_role_assignments role_assignment
            where role_assignment.user_id = target_user_id
                and role_assignment.role_id in (
                    'command_user',
                    'moderator',
                    'analyst',
                    'admin'
                )
                and (
                    role_assignment.expires_at is null
                    or role_assignment.expires_at > now()
                )
        );
$$;

create or replace function app_private.can_moderate_rfqs(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select target_user_id is not null
        and app_private.has_any_role(array['moderator', 'analyst', 'admin']);
$$;

create or replace function app_private.can_manage_rfq_post(target_rfq_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select auth.uid() is not null
        and exists (
            select 1
            from public.rfq_posts rfq
            where rfq.id = target_rfq_id
                and (
                    rfq.created_by = auth.uid()
                    or (
                        rfq.organization_id is not null
                        and app_private.is_org_admin(rfq.organization_id)
                    )
                    or app_private.can_moderate_rfqs()
                )
        );
$$;

create or replace function app_private.can_access_rfq_post(target_rfq_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.rfq_posts rfq
        where rfq.id = target_rfq_id
            and (
                app_private.can_manage_rfq_post(rfq.id)
                or (
                    rfq.status in ('open', 'paused', 'awarded', 'closed')
                    and (
                        (
                            rfq.visibility = 'scout_command'
                            and app_private.can_use_rfqs()
                        )
                        or (
                            rfq.visibility = 'command_only'
                            and app_private.can_use_command_rfqs()
                        )
                        or (
                            rfq.visibility = 'invited_organizations'
                            and exists (
                                select 1
                                from public.rfq_invited_organizations invited
                                where invited.rfq_id = rfq.id
                                    and app_private.is_org_member(invited.organization_id)
                            )
                        )
                    )
                )
                or app_private.can_moderate_rfqs()
            )
    );
$$;

create or replace function app_private.can_respond_to_rfq(target_rfq_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select auth.uid() is not null
        and app_private.can_use_rfqs()
        and exists (
            select 1
            from public.rfq_posts rfq
            where rfq.id = target_rfq_id
                and rfq.status = 'open'
                and (rfq.due_at is null or rfq.due_at > now())
                and rfq.created_by <> auth.uid()
                and app_private.can_access_rfq_post(rfq.id)
        );
$$;

create or replace function app_private.can_access_rfq_response(target_response_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.rfq_responses response
        join public.rfq_posts rfq on rfq.id = response.rfq_id
        where response.id = target_response_id
            and (
                response.responder_user_id = auth.uid()
                or app_private.can_manage_rfq_post(rfq.id)
                or (
                    response.organization_id is not null
                    and app_private.is_org_admin(response.organization_id)
                )
                or app_private.can_moderate_rfqs()
            )
    );
$$;

grant execute on function app_private.can_use_rfqs(uuid) to authenticated;
grant execute on function app_private.can_use_command_rfqs(uuid) to authenticated;
grant execute on function app_private.can_moderate_rfqs(uuid) to authenticated;
grant execute on function app_private.can_manage_rfq_post(uuid) to authenticated;
grant execute on function app_private.can_access_rfq_post(uuid) to authenticated;
grant execute on function app_private.can_respond_to_rfq(uuid) to authenticated;
grant execute on function app_private.can_access_rfq_response(uuid) to authenticated;

alter table public.rfq_posts enable row level security;
alter table public.rfq_invited_organizations enable row level security;
alter table public.rfq_resource_links enable row level security;
alter table public.rfq_responses enable row level security;
alter table public.rfq_response_resource_links enable row level security;
alter table public.rfq_status_events enable row level security;
alter table public.rfq_reports enable row level security;
alter table public.rfq_moderation_actions enable row level security;
alter table public.rfq_audit_events enable row level security;

grant select, insert, update, delete on
    public.rfq_posts,
    public.rfq_invited_organizations,
    public.rfq_resource_links,
    public.rfq_responses,
    public.rfq_response_resource_links,
    public.rfq_status_events,
    public.rfq_reports,
    public.rfq_moderation_actions,
    public.rfq_audit_events
to authenticated;

grant all on
    public.rfq_posts,
    public.rfq_invited_organizations,
    public.rfq_resource_links,
    public.rfq_responses,
    public.rfq_response_resource_links,
    public.rfq_status_events,
    public.rfq_reports,
    public.rfq_moderation_actions,
    public.rfq_audit_events
to service_role;

create policy "rfq_posts_select_accessible"
on public.rfq_posts
for select
to authenticated
using (app_private.can_access_rfq_post(id));

create policy "rfq_posts_insert_scout_command"
on public.rfq_posts
for insert
to authenticated
with check (
    created_by = auth.uid()
    and app_private.can_use_rfqs()
    and (
        organization_id is null
        or app_private.is_org_admin(organization_id)
        or app_private.can_moderate_rfqs()
    )
);

create policy "rfq_posts_update_owner_org_admin_staff"
on public.rfq_posts
for update
to authenticated
using (app_private.can_manage_rfq_post(id))
with check (
    app_private.can_manage_rfq_post(id)
    and (
        organization_id is null
        or app_private.is_org_admin(organization_id)
        or app_private.can_moderate_rfqs()
    )
);

create policy "rfq_posts_delete_admin"
on public.rfq_posts
for delete
to authenticated
using (app_private.has_role('admin'));

create policy "rfq_invited_organizations_select_accessible"
on public.rfq_invited_organizations
for select
to authenticated
using (
    app_private.can_access_rfq_post(rfq_id)
    or app_private.is_org_member(organization_id)
);

create policy "rfq_invited_organizations_manage_owner_staff"
on public.rfq_invited_organizations
for all
to authenticated
using (
    app_private.can_manage_rfq_post(rfq_id)
    or app_private.has_role('admin')
)
with check (app_private.can_manage_rfq_post(rfq_id));

create policy "rfq_resource_links_select_accessible"
on public.rfq_resource_links
for select
to authenticated
using (app_private.can_access_rfq_post(rfq_id));

create policy "rfq_resource_links_manage_owner_staff"
on public.rfq_resource_links
for all
to authenticated
using (
    app_private.can_manage_rfq_post(rfq_id)
    or app_private.has_role('admin')
)
with check (app_private.can_manage_rfq_post(rfq_id));

create policy "rfq_responses_select_relevant"
on public.rfq_responses
for select
to authenticated
using (app_private.can_access_rfq_response(id));

create policy "rfq_responses_insert_scout_command"
on public.rfq_responses
for insert
to authenticated
with check (
    responder_user_id = auth.uid()
    and status in ('draft', 'submitted')
    and app_private.can_respond_to_rfq(rfq_id)
    and (
        organization_id is null
        or app_private.is_org_admin(organization_id)
        or app_private.is_org_member(organization_id)
    )
);

create policy "rfq_responses_update_responder_org_admin_staff"
on public.rfq_responses
for update
to authenticated
using (
    responder_user_id = auth.uid()
    or (
        organization_id is not null
        and app_private.is_org_admin(organization_id)
    )
    or app_private.can_manage_rfq_post(rfq_id)
    or app_private.can_moderate_rfqs()
)
with check (
    (
        responder_user_id = auth.uid()
        and status in ('draft', 'submitted', 'withdrawn')
    )
    or (
        organization_id is not null
        and app_private.is_org_admin(organization_id)
        and status in ('draft', 'submitted', 'withdrawn')
    )
    or app_private.can_manage_rfq_post(rfq_id)
    or app_private.can_moderate_rfqs()
);

create policy "rfq_responses_delete_admin"
on public.rfq_responses
for delete
to authenticated
using (app_private.has_role('admin'));

create policy "rfq_response_resource_links_select_relevant"
on public.rfq_response_resource_links
for select
to authenticated
using (app_private.can_access_rfq_response(response_id));

create policy "rfq_response_resource_links_manage_response_owner"
on public.rfq_response_resource_links
for all
to authenticated
using (
    app_private.can_access_rfq_response(response_id)
    and (
        app_private.can_moderate_rfqs()
        or app_private.has_role('admin')
        or exists (
            select 1
            from public.rfq_responses response
            where response.id = response_id
                and (
                    response.responder_user_id = auth.uid()
                    or (
                        response.organization_id is not null
                        and app_private.is_org_admin(response.organization_id)
                    )
                )
        )
    )
)
with check (
    exists (
        select 1
        from public.rfq_responses response
        where response.id = response_id
            and (
                response.responder_user_id = auth.uid()
                or (
                    response.organization_id is not null
                    and app_private.is_org_admin(response.organization_id)
                )
                or app_private.can_moderate_rfqs()
            )
    )
);

create policy "rfq_status_events_select_relevant"
on public.rfq_status_events
for select
to authenticated
using (app_private.can_access_rfq_post(rfq_id));

create policy "rfq_status_events_insert_manager_staff"
on public.rfq_status_events
for insert
to authenticated
with check (
    actor_user_id = auth.uid()
    and app_private.can_manage_rfq_post(rfq_id)
);

create policy "rfq_status_events_delete_admin"
on public.rfq_status_events
for delete
to authenticated
using (app_private.has_role('admin'));

create policy "rfq_reports_select_reporter_staff"
on public.rfq_reports
for select
to authenticated
using (
    reporter_user_id = auth.uid()
    or app_private.can_moderate_rfqs()
);

create policy "rfq_reports_insert_scout_command"
on public.rfq_reports
for insert
to authenticated
with check (
    reporter_user_id = auth.uid()
    and app_private.can_access_rfq_post(rfq_id)
    and (
        response_id is null
        or app_private.can_access_rfq_response(response_id)
    )
);

create policy "rfq_reports_update_moderators"
on public.rfq_reports
for update
to authenticated
using (app_private.can_moderate_rfqs())
with check (app_private.can_moderate_rfqs());

create policy "rfq_reports_delete_admin"
on public.rfq_reports
for delete
to authenticated
using (app_private.has_role('admin'));

create policy "rfq_moderation_actions_select_moderators"
on public.rfq_moderation_actions
for select
to authenticated
using (app_private.can_moderate_rfqs());

create policy "rfq_moderation_actions_insert_moderators"
on public.rfq_moderation_actions
for insert
to authenticated
with check (
    actor_user_id = auth.uid()
    and app_private.can_moderate_rfqs()
);

create policy "rfq_moderation_actions_delete_admin"
on public.rfq_moderation_actions
for delete
to authenticated
using (app_private.has_role('admin'));

create policy "rfq_audit_events_select_relevant"
on public.rfq_audit_events
for select
to authenticated
using (
    actor_user_id = auth.uid()
    or target_user_id = auth.uid()
    or (
        rfq_id is not null
        and app_private.can_access_rfq_post(rfq_id)
    )
    or (
        organization_id is not null
        and app_private.is_org_admin(organization_id)
    )
    or app_private.can_moderate_rfqs()
);

create policy "rfq_audit_events_insert_rfq_user_or_staff"
on public.rfq_audit_events
for insert
to authenticated
with check (
    actor_user_id = auth.uid()
    and (
        app_private.can_moderate_rfqs()
        or (
            rfq_id is not null
            and app_private.can_access_rfq_post(rfq_id)
        )
        or (
            response_id is not null
            and app_private.can_access_rfq_response(response_id)
        )
    )
);

create policy "rfq_audit_events_delete_admin"
on public.rfq_audit_events
for delete
to authenticated
using (app_private.has_role('admin'));
