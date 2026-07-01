do $$
begin
    create type public.member_chat_conversation_status as enum (
        'active',
        'archived',
        'moderation_locked'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.member_chat_participant_status as enum (
        'active',
        'left',
        'removed'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.member_chat_message_status as enum (
        'visible',
        'hidden_by_sender',
        'held_for_review',
        'removed_by_moderator'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.member_chat_report_status as enum (
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
    create type public.member_chat_moderation_action_type as enum (
        'message_hidden',
        'message_restored',
        'conversation_locked',
        'conversation_unlocked',
        'participant_removed',
        'report_resolved',
        'report_dismissed'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.member_chat_conversations (
    id uuid primary key default gen_random_uuid(),
    status public.member_chat_conversation_status not null default 'active',
    created_by uuid not null references auth.users(id) on delete cascade,
    organization_scope_id uuid references public.organizations(id) on delete set null,
    subject text,
    last_message_at timestamptz,
    locked_at timestamptz,
    locked_by uuid references auth.users(id) on delete set null,
    moderation_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint member_chat_conversations_locked_has_reviewer check (
        status <> 'moderation_locked'
        or (locked_at is not null and locked_by is not null)
    )
);

create index if not exists member_chat_conversations_status_idx
on public.member_chat_conversations (status, last_message_at desc);

drop trigger if exists set_member_chat_conversations_updated_at
on public.member_chat_conversations;
create trigger set_member_chat_conversations_updated_at
before update on public.member_chat_conversations
for each row execute function public.set_updated_at();

create table if not exists public.member_chat_participants (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null
        references public.member_chat_conversations(id)
        on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete set null,
    status public.member_chat_participant_status not null default 'active',
    role text not null default 'participant',
    joined_at timestamptz not null default now(),
    left_at timestamptz,
    muted_until timestamptz,
    last_read_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint member_chat_participants_role_not_blank check (
        length(trim(role)) > 0
    ),
    constraint member_chat_participants_left_when_inactive check (
        status = 'active' or left_at is not null
    )
);

create unique index if not exists member_chat_participants_conversation_user_key
on public.member_chat_participants (conversation_id, user_id);

create index if not exists member_chat_participants_user_status_idx
on public.member_chat_participants (user_id, status, muted_until);

drop trigger if exists set_member_chat_participants_updated_at
on public.member_chat_participants;
create trigger set_member_chat_participants_updated_at
before update on public.member_chat_participants
for each row execute function public.set_updated_at();

create table if not exists public.member_chat_messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null
        references public.member_chat_conversations(id)
        on delete cascade,
    sender_user_id uuid not null references auth.users(id) on delete cascade,
    body text not null,
    status public.member_chat_message_status not null default 'visible',
    edited_at timestamptz,
    hidden_at timestamptz,
    hidden_by uuid references auth.users(id) on delete set null,
    moderation_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint member_chat_messages_body_not_blank check (
        length(trim(body)) > 0
    ),
    constraint member_chat_messages_hidden_has_actor check (
        status in ('visible', 'held_for_review')
        or (hidden_at is not null and hidden_by is not null)
    )
);

create index if not exists member_chat_messages_conversation_created_idx
on public.member_chat_messages (conversation_id, created_at desc);

create index if not exists member_chat_messages_sender_created_idx
on public.member_chat_messages (sender_user_id, created_at desc);

drop trigger if exists set_member_chat_messages_updated_at
on public.member_chat_messages;
create trigger set_member_chat_messages_updated_at
before update on public.member_chat_messages
for each row execute function public.set_updated_at();

create table if not exists public.member_chat_read_receipts (
    conversation_id uuid not null
        references public.member_chat_conversations(id)
        on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    last_read_message_id uuid references public.member_chat_messages(id) on delete set null,
    last_read_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (conversation_id, user_id)
);

drop trigger if exists set_member_chat_read_receipts_updated_at
on public.member_chat_read_receipts;
create trigger set_member_chat_read_receipts_updated_at
before update on public.member_chat_read_receipts
for each row execute function public.set_updated_at();

create table if not exists public.member_chat_blocks (
    blocker_user_id uuid not null references auth.users(id) on delete cascade,
    blocked_user_id uuid not null references auth.users(id) on delete cascade,
    reason text,
    created_at timestamptz not null default now(),
    primary key (blocker_user_id, blocked_user_id),
    constraint member_chat_blocks_no_self_block check (
        blocker_user_id <> blocked_user_id
    )
);

create index if not exists member_chat_blocks_blocked_idx
on public.member_chat_blocks (blocked_user_id, created_at desc);

create table if not exists public.member_chat_reports (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null
        references public.member_chat_conversations(id)
        on delete cascade,
    message_id uuid references public.member_chat_messages(id) on delete set null,
    reporter_user_id uuid not null references auth.users(id) on delete cascade,
    reported_user_id uuid references auth.users(id) on delete set null,
    status public.member_chat_report_status not null default 'open',
    reason text not null,
    reporter_note text,
    reviewed_by uuid references auth.users(id) on delete set null,
    reviewed_at timestamptz,
    resolution_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint member_chat_reports_reason_not_blank check (
        length(trim(reason)) > 0
    ),
    constraint member_chat_reports_reviewed_has_reviewer check (
        status not in ('resolved', 'dismissed')
        or (reviewed_by is not null and reviewed_at is not null)
    )
);

create index if not exists member_chat_reports_status_created_idx
on public.member_chat_reports (status, created_at desc);

create index if not exists member_chat_reports_reporter_idx
on public.member_chat_reports (reporter_user_id, created_at desc);

drop trigger if exists set_member_chat_reports_updated_at
on public.member_chat_reports;
create trigger set_member_chat_reports_updated_at
before update on public.member_chat_reports
for each row execute function public.set_updated_at();

create table if not exists public.member_chat_moderation_actions (
    id uuid primary key default gen_random_uuid(),
    report_id uuid references public.member_chat_reports(id) on delete set null,
    conversation_id uuid references public.member_chat_conversations(id) on delete cascade,
    message_id uuid references public.member_chat_messages(id) on delete set null,
    target_user_id uuid references auth.users(id) on delete set null,
    actor_user_id uuid not null references auth.users(id) on delete cascade,
    action_type public.member_chat_moderation_action_type not null,
    action_note text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint member_chat_moderation_actions_target_check check (
        report_id is not null
        or conversation_id is not null
        or message_id is not null
        or target_user_id is not null
    )
);

create index if not exists member_chat_moderation_actions_report_idx
on public.member_chat_moderation_actions (report_id, created_at desc)
where report_id is not null;

create index if not exists member_chat_moderation_actions_conversation_idx
on public.member_chat_moderation_actions (conversation_id, created_at desc)
where conversation_id is not null;

create table if not exists public.member_chat_audit_events (
    id uuid primary key default gen_random_uuid(),
    actor_user_id uuid references auth.users(id) on delete set null,
    conversation_id uuid references public.member_chat_conversations(id) on delete cascade,
    message_id uuid references public.member_chat_messages(id) on delete set null,
    target_user_id uuid references auth.users(id) on delete set null,
    event_type text not null,
    event_summary text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint member_chat_audit_events_type_not_blank check (
        length(trim(event_type)) > 0
    ),
    constraint member_chat_audit_events_summary_not_blank check (
        length(trim(event_summary)) > 0
    )
);

create index if not exists member_chat_audit_events_conversation_idx
on public.member_chat_audit_events (conversation_id, created_at desc)
where conversation_id is not null;

create or replace function app_private.can_use_member_chat(target_user_id uuid default auth.uid())
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
                    'member',
                    'scout',
                    'command_user'
                )
                and (
                    role_assignment.expires_at is null
                    or role_assignment.expires_at > now()
                )
        );
$$;

create or replace function app_private.is_chat_moderator()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select app_private.has_any_role(array['analyst', 'admin']);
$$;

create or replace function app_private.is_chat_participant(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select auth.uid() is not null
        and exists (
            select 1
            from public.member_chat_participants participant
            where participant.conversation_id = target_conversation_id
                and participant.user_id = auth.uid()
                and participant.status = 'active'
        );
$$;

create or replace function app_private.has_chat_block_between(first_user_id uuid, second_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.member_chat_blocks block
        where (
            block.blocker_user_id = first_user_id
            and block.blocked_user_id = second_user_id
        )
        or (
            block.blocker_user_id = second_user_id
            and block.blocked_user_id = first_user_id
        )
    );
$$;

grant execute on function app_private.can_use_member_chat(uuid) to authenticated;
grant execute on function app_private.is_chat_moderator() to authenticated;
grant execute on function app_private.is_chat_participant(uuid) to authenticated;
grant execute on function app_private.has_chat_block_between(uuid, uuid) to authenticated;

alter table public.member_chat_conversations enable row level security;
alter table public.member_chat_participants enable row level security;
alter table public.member_chat_messages enable row level security;
alter table public.member_chat_read_receipts enable row level security;
alter table public.member_chat_blocks enable row level security;
alter table public.member_chat_reports enable row level security;
alter table public.member_chat_moderation_actions enable row level security;
alter table public.member_chat_audit_events enable row level security;

grant select, insert, update, delete on
    public.member_chat_conversations,
    public.member_chat_participants,
    public.member_chat_messages,
    public.member_chat_read_receipts,
    public.member_chat_blocks,
    public.member_chat_reports,
    public.member_chat_moderation_actions,
    public.member_chat_audit_events
to authenticated;

grant all on
    public.member_chat_conversations,
    public.member_chat_participants,
    public.member_chat_messages,
    public.member_chat_read_receipts,
    public.member_chat_blocks,
    public.member_chat_reports,
    public.member_chat_moderation_actions,
    public.member_chat_audit_events
to service_role;

create policy "member_chat_conversations_select_participants_staff"
on public.member_chat_conversations
for select
to authenticated
using (
    app_private.is_chat_participant(id)
    or app_private.is_chat_moderator()
);

create policy "member_chat_conversations_insert_approved_member"
on public.member_chat_conversations
for insert
to authenticated
with check (
    created_by = auth.uid()
    and app_private.can_use_member_chat(auth.uid())
);

create policy "member_chat_conversations_update_staff"
on public.member_chat_conversations
for update
to authenticated
using (app_private.is_chat_moderator())
with check (app_private.is_chat_moderator());

create policy "member_chat_conversations_delete_admin"
on public.member_chat_conversations
for delete
to authenticated
using (app_private.has_role('admin'));

create policy "member_chat_participants_select_relevant"
on public.member_chat_participants
for select
to authenticated
using (
    user_id = auth.uid()
    or app_private.is_chat_participant(conversation_id)
    or app_private.is_chat_moderator()
);

create policy "member_chat_participants_insert_approved_member"
on public.member_chat_participants
for insert
to authenticated
with check (
    app_private.can_use_member_chat(auth.uid())
    and app_private.can_use_member_chat(user_id)
    and (
        created_by = auth.uid()
        or app_private.is_chat_moderator()
    )
    and not app_private.has_chat_block_between(auth.uid(), user_id)
    and exists (
        select 1
        from public.member_chat_conversations conversation
        where conversation.id = conversation_id
            and (
                conversation.created_by = auth.uid()
                or app_private.is_chat_moderator()
            )
    )
);

create policy "member_chat_participants_update_self_or_staff"
on public.member_chat_participants
for update
to authenticated
using (
    user_id = auth.uid()
    or app_private.is_chat_moderator()
)
with check (
    (
        user_id = auth.uid()
        and role = 'participant'
        and status in ('active', 'left')
    )
    or app_private.is_chat_moderator()
);

create policy "member_chat_participants_delete_admin"
on public.member_chat_participants
for delete
to authenticated
using (app_private.has_role('admin'));

create policy "member_chat_messages_select_participants_staff"
on public.member_chat_messages
for select
to authenticated
using (
    (
        app_private.is_chat_participant(conversation_id)
        and status = 'visible'
    )
    or sender_user_id = auth.uid()
    or app_private.is_chat_moderator()
);

create policy "member_chat_messages_insert_active_participant"
on public.member_chat_messages
for insert
to authenticated
with check (
    sender_user_id = auth.uid()
    and status = 'visible'
    and app_private.is_chat_participant(conversation_id)
    and exists (
        select 1
        from public.member_chat_conversations conversation
        where conversation.id = conversation_id
            and conversation.status = 'active'
    )
);

create policy "member_chat_messages_update_sender_hide"
on public.member_chat_messages
for update
to authenticated
using (sender_user_id = auth.uid())
with check (
    sender_user_id = auth.uid()
    and status in ('visible', 'hidden_by_sender')
    and (
        status = 'visible'
        or hidden_by = auth.uid()
    )
);

create policy "member_chat_messages_update_staff"
on public.member_chat_messages
for update
to authenticated
using (app_private.is_chat_moderator())
with check (
    app_private.is_chat_moderator()
);

create policy "member_chat_messages_delete_admin"
on public.member_chat_messages
for delete
to authenticated
using (app_private.has_role('admin'));

create policy "member_chat_read_receipts_select_participants_staff"
on public.member_chat_read_receipts
for select
to authenticated
using (
    app_private.is_chat_participant(conversation_id)
    or app_private.is_chat_moderator()
);

create policy "member_chat_read_receipts_upsert_self"
on public.member_chat_read_receipts
for insert
to authenticated
with check (
    user_id = auth.uid()
    and app_private.is_chat_participant(conversation_id)
);

create policy "member_chat_read_receipts_update_self"
on public.member_chat_read_receipts
for update
to authenticated
using (user_id = auth.uid())
with check (
    user_id = auth.uid()
    and app_private.is_chat_participant(conversation_id)
);

create policy "member_chat_blocks_select_own_staff"
on public.member_chat_blocks
for select
to authenticated
using (
    blocker_user_id = auth.uid()
    or blocked_user_id = auth.uid()
    or app_private.is_chat_moderator()
);

create policy "member_chat_blocks_insert_self"
on public.member_chat_blocks
for insert
to authenticated
with check (
    blocker_user_id = auth.uid()
    and app_private.can_use_member_chat(auth.uid())
    and app_private.can_use_member_chat(blocked_user_id)
);

create policy "member_chat_blocks_delete_self_admin"
on public.member_chat_blocks
for delete
to authenticated
using (
    blocker_user_id = auth.uid()
    or app_private.has_role('admin')
);

create policy "member_chat_reports_select_reporter_staff"
on public.member_chat_reports
for select
to authenticated
using (
    reporter_user_id = auth.uid()
    or app_private.is_chat_moderator()
);

create policy "member_chat_reports_insert_participant"
on public.member_chat_reports
for insert
to authenticated
with check (
    reporter_user_id = auth.uid()
    and app_private.is_chat_participant(conversation_id)
);

create policy "member_chat_reports_update_staff"
on public.member_chat_reports
for update
to authenticated
using (app_private.is_chat_moderator())
with check (app_private.is_chat_moderator());

create policy "member_chat_reports_delete_admin"
on public.member_chat_reports
for delete
to authenticated
using (app_private.has_role('admin'));

create policy "member_chat_moderation_actions_select_staff"
on public.member_chat_moderation_actions
for select
to authenticated
using (app_private.is_chat_moderator());

create policy "member_chat_moderation_actions_insert_staff"
on public.member_chat_moderation_actions
for insert
to authenticated
with check (
    actor_user_id = auth.uid()
    and app_private.is_chat_moderator()
);

create policy "member_chat_moderation_actions_delete_admin"
on public.member_chat_moderation_actions
for delete
to authenticated
using (app_private.has_role('admin'));

create policy "member_chat_audit_events_select_relevant"
on public.member_chat_audit_events
for select
to authenticated
using (
    actor_user_id = auth.uid()
    or target_user_id = auth.uid()
    or (
        conversation_id is not null
        and app_private.is_chat_participant(conversation_id)
    )
    or app_private.is_chat_moderator()
);

create policy "member_chat_audit_events_insert_participant_or_staff"
on public.member_chat_audit_events
for insert
to authenticated
with check (
    actor_user_id = auth.uid()
    and (
        app_private.is_chat_moderator()
        or (
            conversation_id is not null
            and app_private.is_chat_participant(conversation_id)
        )
    )
);

create policy "member_chat_audit_events_delete_admin"
on public.member_chat_audit_events
for delete
to authenticated
using (app_private.has_role('admin'));
