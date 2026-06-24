create table if not exists public.stripe_webhook_events (
    event_id text primary key,
    event_type text not null,
    status text not null default 'processing',
    processed_at timestamptz,
    error_message text,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint stripe_webhook_events_status_check check (
        status in ('processing', 'processed', 'failed', 'ignored')
    ),
    constraint stripe_webhook_events_type_not_blank check (
        length(trim(event_type)) > 0
    )
);

create trigger set_stripe_webhook_events_updated_at
before update on public.stripe_webhook_events
for each row execute function public.set_updated_at();

alter table public.stripe_webhook_events enable row level security;

grant all on public.stripe_webhook_events to service_role;
grant select on public.stripe_webhook_events to authenticated;

drop policy if exists "stripe_webhook_events_select_admin" on public.stripe_webhook_events;
create policy "stripe_webhook_events_select_admin"
on public.stripe_webhook_events
for select
to authenticated
using (app_private.has_role('admin'));
