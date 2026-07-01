do $$
begin
    create type public.command_perk_type as enum (
        'analyst_support',
        'proposal_support',
        'mission_brief',
        'custom_alert',
        'executive_perk',
        'free_sponsorship'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.command_perk_status as enum (
        'promised',
        'requested',
        'in_progress',
        'fulfilled',
        'blocked',
        'canceled'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.command_perk_priority as enum (
        'low',
        'normal',
        'high',
        'urgent'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.command_perk_commitments (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,
    entitlement_id uuid references public.entitlements(id) on delete set null,
    perk_type public.command_perk_type not null,
    status public.command_perk_status not null default 'promised',
    priority public.command_perk_priority not null default 'normal',
    title text not null,
    request_summary text,
    fulfillment_summary text,
    next_step text,
    internal_note text,
    requested_by uuid references auth.users(id) on delete set null,
    assigned_to uuid references auth.users(id) on delete set null,
    promised_at timestamptz not null default now(),
    due_at timestamptz,
    fulfilled_at timestamptz,
    blocked_reason text,
    sponsorship_inventory_note text,
    custom_alert_config jsonb not null default '{}'::jsonb,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint command_perk_commitments_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint command_perk_commitments_due_after_promise check (
        due_at is null or due_at >= promised_at
    ),
    constraint command_perk_commitments_fulfilled_when_status check (
        (status = 'fulfilled' and fulfilled_at is not null)
        or (status <> 'fulfilled')
    ),
    constraint command_perk_commitments_blocked_has_reason check (
        status <> 'blocked'
        or length(trim(coalesce(blocked_reason, ''))) > 0
    )
);

create index if not exists command_perk_commitments_org_status_idx
on public.command_perk_commitments (organization_id, status, due_at);

create index if not exists command_perk_commitments_type_status_idx
on public.command_perk_commitments (perk_type, status, promised_at desc);

create index if not exists command_perk_commitments_assigned_status_idx
on public.command_perk_commitments (assigned_to, status, due_at)
where assigned_to is not null;

drop trigger if exists set_command_perk_commitments_updated_at
on public.command_perk_commitments;
create trigger set_command_perk_commitments_updated_at
before update on public.command_perk_commitments
for each row execute function public.set_updated_at();

alter table public.command_perk_commitments enable row level security;

grant select on public.command_perk_commitments to authenticated;
grant insert, update, delete on public.command_perk_commitments to authenticated;
grant all on public.command_perk_commitments to service_role;

drop policy if exists "command_perk_commitments_select_relevant"
on public.command_perk_commitments;
create policy "command_perk_commitments_select_relevant"
on public.command_perk_commitments
for select
to authenticated
using (
    app_private.is_org_admin(organization_id)
    or app_private.is_org_member(organization_id)
    or app_private.has_any_role(array['analyst', 'admin'])
);

drop policy if exists "command_perk_commitments_insert_staff"
on public.command_perk_commitments;
create policy "command_perk_commitments_insert_staff"
on public.command_perk_commitments
for insert
to authenticated
with check (
    app_private.has_any_role(array['analyst', 'admin'])
    and exists (
        select 1
        from public.entitlements entitlement
        where entitlement.organization_id = command_perk_commitments.organization_id
            and entitlement.tier = 'command'
            and entitlement.status = 'active'
            and (
                entitlement.ends_at is null
                or entitlement.ends_at > now()
            )
    )
);

drop policy if exists "command_perk_commitments_update_staff"
on public.command_perk_commitments;
create policy "command_perk_commitments_update_staff"
on public.command_perk_commitments
for update
to authenticated
using (app_private.has_any_role(array['analyst', 'admin']))
with check (
    app_private.has_any_role(array['analyst', 'admin'])
    and exists (
        select 1
        from public.entitlements entitlement
        where entitlement.organization_id = command_perk_commitments.organization_id
            and entitlement.tier = 'command'
            and entitlement.status = 'active'
            and (
                entitlement.ends_at is null
                or entitlement.ends_at > now()
            )
    )
);

drop policy if exists "command_perk_commitments_delete_admin"
on public.command_perk_commitments;
create policy "command_perk_commitments_delete_admin"
on public.command_perk_commitments
for delete
to authenticated
using (app_private.has_role('admin'));
