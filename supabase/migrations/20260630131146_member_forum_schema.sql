insert into public.app_roles (id, description)
values
    ('moderator', 'Community moderator who can review forum reports and moderate member discussions.')
on conflict (id) do update set
    description = excluded.description;

do $$
begin
    create type public.member_forum_access_tier as enum (
        'member',
        'scout',
        'command'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.member_forum_status as enum (
        'draft',
        'active',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.member_forum_topic_status as enum (
        'open',
        'locked',
        'hidden',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.member_forum_post_status as enum (
        'visible',
        'hidden_by_author',
        'held_for_review',
        'removed_by_moderator'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.member_forum_reaction_type as enum (
        'useful',
        'follow_up',
        'source_request'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.member_forum_report_status as enum (
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
    create type public.member_forum_moderation_action_type as enum (
        'topic_locked',
        'topic_unlocked',
        'topic_hidden',
        'topic_restored',
        'post_hidden',
        'post_restored',
        'participant_warned',
        'report_resolved',
        'report_dismissed'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.member_forums (
    id uuid primary key default gen_random_uuid(),
    slug text not null,
    title text not null,
    description text not null,
    category text not null,
    access_tier_required public.member_forum_access_tier not null default 'member',
    status public.member_forum_status not null default 'draft',
    sort_order integer not null default 100,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint member_forums_slug_not_blank check (length(trim(slug)) > 0),
    constraint member_forums_title_not_blank check (length(trim(title)) > 0),
    constraint member_forums_description_not_blank check (length(trim(description)) > 0),
    constraint member_forums_category_not_blank check (length(trim(category)) > 0)
);

create unique index if not exists member_forums_slug_key
on public.member_forums (lower(slug));

create index if not exists member_forums_status_sort_idx
on public.member_forums (status, sort_order, title);

drop trigger if exists set_member_forums_updated_at
on public.member_forums;
create trigger set_member_forums_updated_at
before update on public.member_forums
for each row execute function public.set_updated_at();

create table if not exists public.member_forum_topics (
    id uuid primary key default gen_random_uuid(),
    forum_id uuid not null references public.member_forums(id) on delete cascade,
    author_user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    summary text,
    status public.member_forum_topic_status not null default 'open',
    pinned boolean not null default false,
    last_post_at timestamptz,
    locked_at timestamptz,
    locked_by uuid references auth.users(id) on delete set null,
    hidden_at timestamptz,
    hidden_by uuid references auth.users(id) on delete set null,
    moderation_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint member_forum_topics_title_not_blank check (length(trim(title)) > 0),
    constraint member_forum_topics_locked_has_actor check (
        status <> 'locked'
        or (locked_at is not null and locked_by is not null)
    ),
    constraint member_forum_topics_hidden_has_actor check (
        status <> 'hidden'
        or (hidden_at is not null and hidden_by is not null)
    )
);

create index if not exists member_forum_topics_forum_status_idx
on public.member_forum_topics (forum_id, status, pinned desc, last_post_at desc nulls last);

create index if not exists member_forum_topics_author_idx
on public.member_forum_topics (author_user_id, created_at desc);

drop trigger if exists set_member_forum_topics_updated_at
on public.member_forum_topics;
create trigger set_member_forum_topics_updated_at
before update on public.member_forum_topics
for each row execute function public.set_updated_at();

create table if not exists public.member_forum_posts (
    id uuid primary key default gen_random_uuid(),
    topic_id uuid not null references public.member_forum_topics(id) on delete cascade,
    parent_post_id uuid references public.member_forum_posts(id) on delete cascade,
    author_user_id uuid not null references auth.users(id) on delete cascade,
    body text not null,
    status public.member_forum_post_status not null default 'visible',
    edited_at timestamptz,
    hidden_at timestamptz,
    hidden_by uuid references auth.users(id) on delete set null,
    moderation_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint member_forum_posts_body_not_blank check (length(trim(body)) > 0),
    constraint member_forum_posts_hidden_has_actor check (
        status in ('visible', 'held_for_review')
        or (hidden_at is not null and hidden_by is not null)
    )
);

create index if not exists member_forum_posts_topic_created_idx
on public.member_forum_posts (topic_id, created_at);

create index if not exists member_forum_posts_author_idx
on public.member_forum_posts (author_user_id, created_at desc);

drop trigger if exists set_member_forum_posts_updated_at
on public.member_forum_posts;
create trigger set_member_forum_posts_updated_at
before update on public.member_forum_posts
for each row execute function public.set_updated_at();

create or replace function public.set_member_forum_topic_last_post_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    update public.member_forum_topics
    set last_post_at = new.created_at
    where id = new.topic_id;

    return new;
end;
$$;

drop trigger if exists update_member_forum_topic_last_post_at
on public.member_forum_posts;
create trigger update_member_forum_topic_last_post_at
after insert on public.member_forum_posts
for each row execute function public.set_member_forum_topic_last_post_at();

create table if not exists public.member_forum_reactions (
    post_id uuid not null references public.member_forum_posts(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    reaction_type public.member_forum_reaction_type not null,
    created_at timestamptz not null default now(),
    primary key (post_id, user_id, reaction_type)
);

create index if not exists member_forum_reactions_user_idx
on public.member_forum_reactions (user_id, created_at desc);

create table if not exists public.member_forum_bookmarks (
    topic_id uuid not null references public.member_forum_topics(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (topic_id, user_id)
);

create index if not exists member_forum_bookmarks_user_idx
on public.member_forum_bookmarks (user_id, created_at desc);

create table if not exists public.member_forum_reports (
    id uuid primary key default gen_random_uuid(),
    forum_id uuid references public.member_forums(id) on delete cascade,
    topic_id uuid references public.member_forum_topics(id) on delete cascade,
    post_id uuid references public.member_forum_posts(id) on delete set null,
    reporter_user_id uuid not null references auth.users(id) on delete cascade,
    reported_user_id uuid references auth.users(id) on delete set null,
    status public.member_forum_report_status not null default 'open',
    reason text not null,
    reporter_note text,
    reviewed_by uuid references auth.users(id) on delete set null,
    reviewed_at timestamptz,
    resolution_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint member_forum_reports_target_check check (
        forum_id is not null
        or topic_id is not null
        or post_id is not null
    ),
    constraint member_forum_reports_reason_not_blank check (length(trim(reason)) > 0),
    constraint member_forum_reports_reviewed_has_actor check (
        status not in ('resolved', 'dismissed')
        or (reviewed_by is not null and reviewed_at is not null)
    )
);

create index if not exists member_forum_reports_status_created_idx
on public.member_forum_reports (status, created_at desc);

create index if not exists member_forum_reports_reporter_idx
on public.member_forum_reports (reporter_user_id, created_at desc);

drop trigger if exists set_member_forum_reports_updated_at
on public.member_forum_reports;
create trigger set_member_forum_reports_updated_at
before update on public.member_forum_reports
for each row execute function public.set_updated_at();

create table if not exists public.member_forum_moderation_actions (
    id uuid primary key default gen_random_uuid(),
    report_id uuid references public.member_forum_reports(id) on delete set null,
    forum_id uuid references public.member_forums(id) on delete cascade,
    topic_id uuid references public.member_forum_topics(id) on delete cascade,
    post_id uuid references public.member_forum_posts(id) on delete set null,
    target_user_id uuid references auth.users(id) on delete set null,
    actor_user_id uuid not null references auth.users(id) on delete cascade,
    action_type public.member_forum_moderation_action_type not null,
    action_note text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint member_forum_moderation_actions_target_check check (
        report_id is not null
        or forum_id is not null
        or topic_id is not null
        or post_id is not null
        or target_user_id is not null
    )
);

create index if not exists member_forum_moderation_actions_report_idx
on public.member_forum_moderation_actions (report_id, created_at desc)
where report_id is not null;

create index if not exists member_forum_moderation_actions_topic_idx
on public.member_forum_moderation_actions (topic_id, created_at desc)
where topic_id is not null;

create table if not exists public.member_forum_audit_events (
    id uuid primary key default gen_random_uuid(),
    actor_user_id uuid references auth.users(id) on delete set null,
    forum_id uuid references public.member_forums(id) on delete cascade,
    topic_id uuid references public.member_forum_topics(id) on delete cascade,
    post_id uuid references public.member_forum_posts(id) on delete set null,
    target_user_id uuid references auth.users(id) on delete set null,
    event_type text not null,
    event_summary text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint member_forum_audit_events_type_not_blank check (length(trim(event_type)) > 0),
    constraint member_forum_audit_events_summary_not_blank check (length(trim(event_summary)) > 0)
);

create index if not exists member_forum_audit_events_topic_idx
on public.member_forum_audit_events (topic_id, created_at desc)
where topic_id is not null;

create or replace function app_private.can_access_member_forum_tier(
    required_tier public.member_forum_access_tier,
    target_user_id uuid default auth.uid()
)
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
                and role_assignment.role_id = any(
                    case required_tier
                        when 'member' then array[
                            'member',
                            'scout',
                            'command_user',
                            'moderator',
                            'editor',
                            'analyst',
                            'admin'
                        ]
                        when 'scout' then array[
                            'scout',
                            'command_user',
                            'moderator',
                            'editor',
                            'analyst',
                            'admin'
                        ]
                        when 'command' then array[
                            'command_user',
                            'moderator',
                            'editor',
                            'analyst',
                            'admin'
                        ]
                    end
                )
                and (
                    role_assignment.expires_at is null
                    or role_assignment.expires_at > now()
                )
        );
$$;

create or replace function app_private.can_moderate_member_forums(
    target_user_id uuid default auth.uid()
)
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
                    'moderator',
                    'editor',
                    'analyst',
                    'admin'
                )
                and (
                    role_assignment.expires_at is null
                    or role_assignment.expires_at > now()
                )
        );
$$;

create or replace function app_private.can_access_member_forum(
    target_forum_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.member_forums forum
        where forum.id = target_forum_id
            and forum.status = 'active'
            and app_private.can_access_member_forum_tier(forum.access_tier_required)
    )
    or app_private.can_moderate_member_forums();
$$;

create or replace function app_private.can_access_member_forum_topic(
    target_topic_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.member_forum_topics topic
        join public.member_forums forum on forum.id = topic.forum_id
        where topic.id = target_topic_id
            and forum.status = 'active'
            and topic.status in ('open', 'locked', 'archived')
            and app_private.can_access_member_forum_tier(forum.access_tier_required)
    )
    or app_private.can_moderate_member_forums();
$$;

grant execute on function app_private.can_access_member_forum_tier(public.member_forum_access_tier, uuid) to authenticated;
grant execute on function app_private.can_moderate_member_forums(uuid) to authenticated;
grant execute on function app_private.can_access_member_forum(uuid) to authenticated;
grant execute on function app_private.can_access_member_forum_topic(uuid) to authenticated;

alter table public.member_forums enable row level security;
alter table public.member_forum_topics enable row level security;
alter table public.member_forum_posts enable row level security;
alter table public.member_forum_reactions enable row level security;
alter table public.member_forum_bookmarks enable row level security;
alter table public.member_forum_reports enable row level security;
alter table public.member_forum_moderation_actions enable row level security;
alter table public.member_forum_audit_events enable row level security;

grant select, insert, update, delete on
    public.member_forums,
    public.member_forum_topics,
    public.member_forum_posts,
    public.member_forum_reactions,
    public.member_forum_bookmarks,
    public.member_forum_reports,
    public.member_forum_moderation_actions,
    public.member_forum_audit_events
to authenticated;

grant all on
    public.member_forums,
    public.member_forum_topics,
    public.member_forum_posts,
    public.member_forum_reactions,
    public.member_forum_bookmarks,
    public.member_forum_reports,
    public.member_forum_moderation_actions,
    public.member_forum_audit_events
to service_role;

create policy "member_forums_select_accessible"
on public.member_forums
for select
to authenticated
using (
    (
        status = 'active'
        and app_private.can_access_member_forum_tier(access_tier_required)
    )
    or app_private.can_moderate_member_forums()
);

create policy "member_forums_insert_moderators"
on public.member_forums
for insert
to authenticated
with check (app_private.can_moderate_member_forums());

create policy "member_forums_update_moderators"
on public.member_forums
for update
to authenticated
using (app_private.can_moderate_member_forums())
with check (app_private.can_moderate_member_forums());

create policy "member_forums_delete_admin"
on public.member_forums
for delete
to authenticated
using (app_private.has_role('admin'));

create policy "member_forum_topics_select_accessible"
on public.member_forum_topics
for select
to authenticated
using (
    (
        status in ('open', 'locked', 'archived')
        and app_private.can_access_member_forum(forum_id)
    )
    or author_user_id = auth.uid()
    or app_private.can_moderate_member_forums()
);

create policy "member_forum_topics_insert_members"
on public.member_forum_topics
for insert
to authenticated
with check (
    author_user_id = auth.uid()
    and status = 'open'
    and app_private.can_access_member_forum(forum_id)
);

create policy "member_forum_topics_update_author_or_moderator"
on public.member_forum_topics
for update
to authenticated
using (
    author_user_id = auth.uid()
    or app_private.can_moderate_member_forums()
)
with check (
    (
        author_user_id = auth.uid()
        and status in ('open', 'archived')
        and locked_at is null
        and locked_by is null
        and hidden_at is null
        and hidden_by is null
    )
    or app_private.can_moderate_member_forums()
);

create policy "member_forum_topics_delete_admin"
on public.member_forum_topics
for delete
to authenticated
using (app_private.has_role('admin'));

create policy "member_forum_posts_select_accessible"
on public.member_forum_posts
for select
to authenticated
using (
    (
        status = 'visible'
        and app_private.can_access_member_forum_topic(topic_id)
    )
    or author_user_id = auth.uid()
    or app_private.can_moderate_member_forums()
);

create policy "member_forum_posts_insert_members"
on public.member_forum_posts
for insert
to authenticated
with check (
    author_user_id = auth.uid()
    and status = 'visible'
    and app_private.can_access_member_forum_topic(topic_id)
    and exists (
        select 1
        from public.member_forum_topics topic
        where topic.id = topic_id
            and topic.status = 'open'
    )
);

create policy "member_forum_posts_update_author_or_moderator"
on public.member_forum_posts
for update
to authenticated
using (
    author_user_id = auth.uid()
    or app_private.can_moderate_member_forums()
)
with check (
    (
        author_user_id = auth.uid()
        and status in ('visible', 'hidden_by_author')
        and (
            status = 'visible'
            or hidden_by = auth.uid()
        )
    )
    or app_private.can_moderate_member_forums()
);

create policy "member_forum_posts_delete_admin"
on public.member_forum_posts
for delete
to authenticated
using (app_private.has_role('admin'));

create policy "member_forum_reactions_select_accessible"
on public.member_forum_reactions
for select
to authenticated
using (
    user_id = auth.uid()
    or app_private.can_moderate_member_forums()
    or exists (
        select 1
        from public.member_forum_posts post
        where post.id = post_id
            and post.status = 'visible'
            and app_private.can_access_member_forum_topic(post.topic_id)
    )
);

create policy "member_forum_reactions_insert_self"
on public.member_forum_reactions
for insert
to authenticated
with check (
    user_id = auth.uid()
    and exists (
        select 1
        from public.member_forum_posts post
        where post.id = post_id
            and post.status = 'visible'
            and app_private.can_access_member_forum_topic(post.topic_id)
    )
);

create policy "member_forum_reactions_delete_self_admin"
on public.member_forum_reactions
for delete
to authenticated
using (
    user_id = auth.uid()
    or app_private.has_role('admin')
);

create policy "member_forum_bookmarks_select_self_staff"
on public.member_forum_bookmarks
for select
to authenticated
using (
    user_id = auth.uid()
    or app_private.can_moderate_member_forums()
);

create policy "member_forum_bookmarks_insert_self"
on public.member_forum_bookmarks
for insert
to authenticated
with check (
    user_id = auth.uid()
    and app_private.can_access_member_forum_topic(topic_id)
);

create policy "member_forum_bookmarks_delete_self_admin"
on public.member_forum_bookmarks
for delete
to authenticated
using (
    user_id = auth.uid()
    or app_private.has_role('admin')
);

create policy "member_forum_reports_select_reporter_staff"
on public.member_forum_reports
for select
to authenticated
using (
    reporter_user_id = auth.uid()
    or app_private.can_moderate_member_forums()
);

create policy "member_forum_reports_insert_member"
on public.member_forum_reports
for insert
to authenticated
with check (
    reporter_user_id = auth.uid()
    and (
        (forum_id is not null and app_private.can_access_member_forum(forum_id))
        or (topic_id is not null and app_private.can_access_member_forum_topic(topic_id))
        or exists (
            select 1
            from public.member_forum_posts post
            where post.id = post_id
                and app_private.can_access_member_forum_topic(post.topic_id)
        )
    )
);

create policy "member_forum_reports_update_moderators"
on public.member_forum_reports
for update
to authenticated
using (app_private.can_moderate_member_forums())
with check (app_private.can_moderate_member_forums());

create policy "member_forum_reports_delete_admin"
on public.member_forum_reports
for delete
to authenticated
using (app_private.has_role('admin'));

create policy "member_forum_moderation_actions_select_moderators"
on public.member_forum_moderation_actions
for select
to authenticated
using (app_private.can_moderate_member_forums());

create policy "member_forum_moderation_actions_insert_moderators"
on public.member_forum_moderation_actions
for insert
to authenticated
with check (
    actor_user_id = auth.uid()
    and app_private.can_moderate_member_forums()
);

create policy "member_forum_moderation_actions_delete_admin"
on public.member_forum_moderation_actions
for delete
to authenticated
using (app_private.has_role('admin'));

create policy "member_forum_audit_events_select_relevant"
on public.member_forum_audit_events
for select
to authenticated
using (
    actor_user_id = auth.uid()
    or target_user_id = auth.uid()
    or app_private.can_moderate_member_forums()
    or (forum_id is not null and app_private.can_access_member_forum(forum_id))
    or (topic_id is not null and app_private.can_access_member_forum_topic(topic_id))
);

create policy "member_forum_audit_events_insert_member_or_staff"
on public.member_forum_audit_events
for insert
to authenticated
with check (
    actor_user_id = auth.uid()
    and (
        app_private.can_moderate_member_forums()
        or (forum_id is not null and app_private.can_access_member_forum(forum_id))
        or (topic_id is not null and app_private.can_access_member_forum_topic(topic_id))
    )
);

create policy "member_forum_audit_events_delete_admin"
on public.member_forum_audit_events
for delete
to authenticated
using (app_private.has_role('admin'));
