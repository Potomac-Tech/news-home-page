do $$
begin
    create type public.event_calendar_status as enum (
        'draft',
        'published',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.event_calendar_event_type as enum (
        'conference',
        'summit',
        'workshop',
        'webinar',
        'briefing',
        'roundtable',
        'other'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.event_calendar_events (
    id uuid primary key default gen_random_uuid(),
    slug text not null,
    status public.event_calendar_status not null default 'draft',
    event_type public.event_calendar_event_type not null default 'conference',
    access_tier_required public.membership_tier not null default 'member',
    title text not null,
    organizer text,
    location text not null default 'TBD',
    timezone text not null default 'America/New_York',
    starts_at timestamptz not null,
    ends_at timestamptz,
    public_summary text not null default '',
    public_teaser text not null default '',
    public_agenda jsonb not null default '[]'::jsonb,
    hero_image_url text,
    published_at timestamptz,
    archived_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint event_calendar_events_slug_not_blank check (
        length(trim(slug)) > 0
    ),
    constraint event_calendar_events_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint event_calendar_events_location_not_blank check (
        length(trim(location)) > 0
    ),
    constraint event_calendar_events_timezone_not_blank check (
        length(trim(timezone)) > 0
    ),
    constraint event_calendar_events_public_agenda_array check (
        jsonb_typeof(public_agenda) = 'array'
    ),
    constraint event_calendar_events_end_after_start check (
        ends_at is null or ends_at > starts_at
    ),
    constraint event_calendar_events_published_has_public_fields check (
        status <> 'published'
        or (
            published_at is not null
            and length(trim(public_summary)) > 0
            and length(trim(public_teaser)) > 0
        )
    )
);

create unique index if not exists event_calendar_events_slug_key
on public.event_calendar_events (lower(slug));

create index if not exists event_calendar_events_status_starts_at_idx
on public.event_calendar_events (status, starts_at);

create index if not exists event_calendar_events_type_starts_at_idx
on public.event_calendar_events (event_type, starts_at);

drop trigger if exists set_event_calendar_events_updated_at
on public.event_calendar_events;
create trigger set_event_calendar_events_updated_at
before update on public.event_calendar_events
for each row execute function public.set_updated_at();

create table if not exists public.event_calendar_event_details (
    event_id uuid primary key references public.event_calendar_events(id) on delete cascade,
    member_details_markdown text not null,
    member_packet_url text,
    registration_url text,
    virtual_url text,
    contact_email text,
    source_links jsonb not null default '[]'::jsonb,
    preparation_notes text,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint event_calendar_event_details_body_not_blank check (
        length(trim(member_details_markdown)) > 0
    ),
    constraint event_calendar_event_details_source_links_array check (
        jsonb_typeof(source_links) = 'array'
    )
);

drop trigger if exists set_event_calendar_event_details_updated_at
on public.event_calendar_event_details;
create trigger set_event_calendar_event_details_updated_at
before update on public.event_calendar_event_details
for each row execute function public.set_updated_at();

alter table public.event_calendar_events enable row level security;
alter table public.event_calendar_event_details enable row level security;

grant select on public.event_calendar_events to anon, authenticated;

grant select, insert, update, delete on
    public.event_calendar_events,
    public.event_calendar_event_details
to authenticated;

grant all on
    public.event_calendar_events,
    public.event_calendar_event_details
to service_role;

drop policy if exists "event_calendar_events_select_published"
on public.event_calendar_events;
create policy "event_calendar_events_select_published"
on public.event_calendar_events
for select
to anon, authenticated
using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
);

drop policy if exists "event_calendar_events_select_staff"
on public.event_calendar_events;
create policy "event_calendar_events_select_staff"
on public.event_calendar_events
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "event_calendar_events_manage_staff"
on public.event_calendar_events;
create policy "event_calendar_events_manage_staff"
on public.event_calendar_events
for all
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));

drop policy if exists "event_calendar_event_details_select_entitled"
on public.event_calendar_event_details;
create policy "event_calendar_event_details_select_entitled"
on public.event_calendar_event_details
for select
to authenticated
using (
    app_private.has_any_role(array['editor', 'analyst', 'admin'])
    or exists (
        select 1
        from public.event_calendar_events event
        where event.id = event_calendar_event_details.event_id
            and event.status = 'published'
            and event.published_at is not null
            and event.published_at <= now()
            and (
                (
                    event.access_tier_required = 'member'
                    and app_private.has_any_role(
                        array['member', 'scout', 'command_user']
                    )
                )
                or (
                    event.access_tier_required = 'scout'
                    and app_private.has_any_role(
                        array['scout', 'command_user']
                    )
                )
                or (
                    event.access_tier_required = 'command'
                    and app_private.has_any_role(array['command_user'])
                )
            )
    )
);

drop policy if exists "event_calendar_event_details_manage_staff"
on public.event_calendar_event_details;
create policy "event_calendar_event_details_manage_staff"
on public.event_calendar_event_details
for all
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));
