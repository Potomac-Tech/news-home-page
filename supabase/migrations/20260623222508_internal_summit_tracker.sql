do $$
begin
    create type public.internal_summit_publish_status as enum (
        'draft',
        'published',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.internal_summit_status as enum (
        'planned',
        'in_progress',
        'completed',
        'canceled'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.internal_summits (
    id uuid primary key default gen_random_uuid(),
    slug text not null,
    publish_status public.internal_summit_publish_status not null default 'draft',
    summit_status public.internal_summit_status not null default 'planned',
    title text not null,
    location text not null default 'TBD',
    timezone text not null default 'America/New_York',
    starts_at timestamptz not null,
    ends_at timestamptz,
    status_note text,
    tracker_summary text not null default '',
    agenda_markdown text,
    past_event_summary_markdown text,
    major_news jsonb not null default '[]'::jsonb,
    source_links jsonb not null default '[]'::jsonb,
    next_steps jsonb not null default '[]'::jsonb,
    published_at timestamptz,
    archived_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint internal_summits_slug_not_blank check (
        length(trim(slug)) > 0
    ),
    constraint internal_summits_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint internal_summits_location_not_blank check (
        length(trim(location)) > 0
    ),
    constraint internal_summits_timezone_not_blank check (
        length(trim(timezone)) > 0
    ),
    constraint internal_summits_end_after_start check (
        ends_at is null or ends_at > starts_at
    ),
    constraint internal_summits_major_news_array check (
        jsonb_typeof(major_news) = 'array'
    ),
    constraint internal_summits_source_links_array check (
        jsonb_typeof(source_links) = 'array'
    ),
    constraint internal_summits_next_steps_array check (
        jsonb_typeof(next_steps) = 'array'
    ),
    constraint internal_summits_published_has_summary check (
        publish_status <> 'published'
        or (
            published_at is not null
            and length(trim(tracker_summary)) > 0
        )
    ),
    constraint internal_summits_completed_has_summary check (
        summit_status <> 'completed'
        or length(trim(coalesce(past_event_summary_markdown, ''))) > 0
    )
);

create unique index if not exists internal_summits_slug_key
on public.internal_summits (lower(slug));

create index if not exists internal_summits_publish_starts_idx
on public.internal_summits (publish_status, starts_at);

create index if not exists internal_summits_status_starts_idx
on public.internal_summits (summit_status, starts_at);

drop trigger if exists set_internal_summits_updated_at
on public.internal_summits;
create trigger set_internal_summits_updated_at
before update on public.internal_summits
for each row execute function public.set_updated_at();

alter table public.internal_summits enable row level security;

grant select, insert, update, delete on public.internal_summits to authenticated;
grant all on public.internal_summits to service_role;

drop policy if exists "internal_summits_select_members"
on public.internal_summits;
create policy "internal_summits_select_members"
on public.internal_summits
for select
to authenticated
using (
    publish_status = 'published'
    and published_at is not null
    and published_at <= now()
    and app_private.has_any_role(
        array['member', 'scout', 'command_user', 'editor', 'analyst', 'admin']
    )
);

drop policy if exists "internal_summits_select_staff"
on public.internal_summits;
create policy "internal_summits_select_staff"
on public.internal_summits
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "internal_summits_manage_staff"
on public.internal_summits;
create policy "internal_summits_manage_staff"
on public.internal_summits
for all
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));
