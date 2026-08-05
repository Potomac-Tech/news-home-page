create table if not exists public.production_content_import_batches (
    id uuid primary key default gen_random_uuid(),
    file_name text not null check (length(trim(file_name)) between 1 and 240),
    manifest_version text not null,
    status text not null check (status in ('accepted', 'blocked')),
    total_records integer not null check (total_records > 0),
    accepted_records integer not null check (accepted_records >= 0),
    blocked_records integer not null check (blocked_records >= 0),
    imported_by uuid not null references auth.users(id) on delete restrict,
    imported_at timestamptz not null default now(),
    constraint production_content_import_batch_totals check (
        accepted_records + blocked_records = total_records
        and ((status = 'accepted' and blocked_records = 0) or status = 'blocked')
    )
);

create table if not exists public.production_content_import_items (
    id uuid primary key default gen_random_uuid(),
    batch_id uuid not null references public.production_content_import_batches(id) on delete cascade,
    record_key text not null,
    content_type text not null,
    import_status text not null check (import_status in ('accepted', 'blocked')),
    blockers text[] not null default '{}',
    approved_by uuid references auth.users(id) on delete set null,
    approved_at timestamptz,
    citation_urls text[] not null default '{}',
    source_registry_ids uuid[] not null default '{}',
    expires_at timestamptz,
    asset_references jsonb not null default '[]'::jsonb check (jsonb_typeof(asset_references) = 'array'),
    payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
    created_at timestamptz not null default now(),
    unique (batch_id, record_key),
    constraint production_content_import_item_state check (
        (import_status = 'accepted' and cardinality(blockers) = 0)
        or (import_status = 'blocked' and cardinality(blockers) > 0)
    )
);

create index if not exists production_content_import_batches_status_idx
on public.production_content_import_batches (status, imported_at desc);
create index if not exists production_content_import_batches_imported_by_idx
on public.production_content_import_batches (imported_by);
create index if not exists production_content_import_items_batch_status_idx
on public.production_content_import_items (batch_id, import_status, created_at);
create index if not exists production_content_import_items_approved_by_idx
on public.production_content_import_items (approved_by) where approved_by is not null;

alter table public.production_content_import_batches enable row level security;
alter table public.production_content_import_items enable row level security;

create policy "Editorial staff manage production import batches"
on public.production_content_import_batches for all to authenticated
using (exists (
    select 1 from public.member_role_assignments assignment
    where assignment.user_id = (select auth.uid())
      and assignment.role_id in ('editor', 'admin')
      and (assignment.expires_at is null or assignment.expires_at > now())
))
with check (exists (
    select 1 from public.member_role_assignments assignment
    where assignment.user_id = (select auth.uid())
      and assignment.role_id in ('editor', 'admin')
      and (assignment.expires_at is null or assignment.expires_at > now())
));

create policy "Editorial staff manage production import items"
on public.production_content_import_items for all to authenticated
using (exists (
    select 1 from public.member_role_assignments assignment
    where assignment.user_id = (select auth.uid())
      and assignment.role_id in ('editor', 'admin')
      and (assignment.expires_at is null or assignment.expires_at > now())
))
with check (exists (
    select 1 from public.member_role_assignments assignment
    where assignment.user_id = (select auth.uid())
      and assignment.role_id in ('editor', 'admin')
      and (assignment.expires_at is null or assignment.expires_at > now())
));

grant select, insert, update, delete on public.production_content_import_batches to authenticated;
grant select, insert, update, delete on public.production_content_import_items to authenticated;
grant all on public.production_content_import_batches, public.production_content_import_items to service_role;
