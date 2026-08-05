create table if not exists public.tracker_source_snapshots (
    source_key text primary key,
    payload jsonb not null,
    fetched_at timestamptz not null,
    updated_at timestamptz not null default now()
);

alter table public.tracker_source_snapshots enable row level security;
grant all on public.tracker_source_snapshots to service_role;

comment on table public.tracker_source_snapshots is
    'Service-only recent upstream responses used during short provider throttling windows.';
