do $$
begin
    create type public.command_intelligence_access_mode as enum (
        'real_time',
        'near_real_time'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.command_intelligence_allocation_status as enum (
        'planned',
        'active',
        'expired',
        'revoked'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.command_intelligence_allocations (
    id uuid primary key default gen_random_uuid(),
    dataset_id uuid not null
        references public.dataset_catalog_entries(id)
        on delete cascade,
    allocated_user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete set null,
    access_mode public.command_intelligence_access_mode not null,
    status public.command_intelligence_allocation_status not null
        default 'planned',
    collection_started_at timestamptz not null,
    collection_completed_at timestamptz,
    exclusive_access_starts_at timestamptz not null,
    exclusive_access_ends_at timestamptz not null,
    delivery_latency_seconds integer,
    allocation_note text,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint command_intelligence_allocations_collection_range check (
        collection_completed_at is null
        or collection_completed_at >= collection_started_at
    ),
    constraint command_intelligence_allocations_exclusive_range check (
        exclusive_access_ends_at >= exclusive_access_starts_at + interval '1 year'
    ),
    constraint command_intelligence_allocations_starts_after_collection check (
        exclusive_access_starts_at >= collection_started_at
    ),
    constraint command_intelligence_allocations_latency_nonnegative check (
        delivery_latency_seconds is null
        or delivery_latency_seconds >= 0
    )
);

create unique index if not exists command_intelligence_allocations_one_active_dataset
on public.command_intelligence_allocations (dataset_id)
where status in ('planned', 'active');

create index if not exists command_intelligence_allocations_user_status_idx
on public.command_intelligence_allocations (
    allocated_user_id,
    status,
    exclusive_access_ends_at
);

create index if not exists command_intelligence_allocations_org_status_idx
on public.command_intelligence_allocations (
    organization_id,
    status,
    exclusive_access_ends_at
)
where organization_id is not null;

drop trigger if exists set_command_intelligence_allocations_updated_at
on public.command_intelligence_allocations;
create trigger set_command_intelligence_allocations_updated_at
before update on public.command_intelligence_allocations
for each row execute function public.set_updated_at();

alter table public.command_intelligence_allocations enable row level security;

grant select on public.command_intelligence_allocations to authenticated;
grant insert, update, delete on public.command_intelligence_allocations
to authenticated;
grant all on public.command_intelligence_allocations to service_role;

drop policy if exists "command_intelligence_allocations_select_relevant"
on public.command_intelligence_allocations;
create policy "command_intelligence_allocations_select_relevant"
on public.command_intelligence_allocations
for select
to authenticated
using (
    allocated_user_id = auth.uid()
    or (
        organization_id is not null
        and app_private.is_org_admin(organization_id)
    )
    or app_private.has_any_role(array['analyst', 'admin'])
);

drop policy if exists "command_intelligence_allocations_manage_staff"
on public.command_intelligence_allocations;
drop policy if exists "command_intelligence_allocations_insert_staff"
on public.command_intelligence_allocations;
create policy "command_intelligence_allocations_insert_staff"
on public.command_intelligence_allocations
for insert
to authenticated
with check (
    app_private.has_any_role(array['analyst', 'admin'])
    and exists (
        select 1
        from public.dataset_catalog_entries dataset
        where dataset.id = dataset_id
            and dataset.access_tier_required = 'command'
            and dataset.release_state = 'command_exclusive'
            and dataset.exclusive_access_starts_at is not null
            and dataset.exclusive_access_ends_at is not null
            and dataset.exclusive_access_ends_at >=
                dataset.exclusive_access_starts_at + interval '1 year'
    )
    and exists (
        select 1
        from public.member_role_assignments role_assignment
        where role_assignment.user_id = allocated_user_id
            and role_assignment.role_id = 'command_user'
            and (
                role_assignment.expires_at is null
                or role_assignment.expires_at > now()
            )
    )
);

drop policy if exists "command_intelligence_allocations_update_staff"
on public.command_intelligence_allocations;
create policy "command_intelligence_allocations_update_staff"
on public.command_intelligence_allocations
for update
to authenticated
using (app_private.has_any_role(array['analyst', 'admin']))
with check (
    app_private.has_any_role(array['analyst', 'admin'])
    and exists (
        select 1
        from public.dataset_catalog_entries dataset
        where dataset.id = dataset_id
            and dataset.access_tier_required = 'command'
            and dataset.release_state = 'command_exclusive'
            and dataset.exclusive_access_starts_at is not null
            and dataset.exclusive_access_ends_at is not null
            and dataset.exclusive_access_ends_at >=
                dataset.exclusive_access_starts_at + interval '1 year'
    )
    and exists (
        select 1
        from public.member_role_assignments role_assignment
        where role_assignment.user_id = allocated_user_id
            and role_assignment.role_id = 'command_user'
            and (
                role_assignment.expires_at is null
                or role_assignment.expires_at > now()
            )
    )
);

drop policy if exists "command_intelligence_allocations_delete_admin"
on public.command_intelligence_allocations;
create policy "command_intelligence_allocations_delete_admin"
on public.command_intelligence_allocations
for delete
to authenticated
using (app_private.has_role('admin'));
