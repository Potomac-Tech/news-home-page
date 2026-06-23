do $$
begin
    create type public.command_interest_status as enum (
        'new',
        'contacted',
        'qualified',
        'approved',
        'rejected',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.command_interest_requests (
    id uuid primary key default gen_random_uuid(),
    contact_name text not null,
    contact_email text not null,
    organization_name text not null,
    title text,
    estimated_seats integer,
    use_case text,
    status public.command_interest_status not null default 'new',
    reviewed_at timestamptz,
    reviewed_by uuid references auth.users(id) on delete set null,
    decision_note text,
    created_organization_id uuid references public.organizations(id) on delete set null,
    created_entitlement_id uuid references public.entitlements(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint command_interest_contact_name_not_blank check (length(trim(contact_name)) > 0),
    constraint command_interest_contact_email_not_blank check (length(trim(contact_email)) > 0),
    constraint command_interest_org_name_not_blank check (length(trim(organization_name)) > 0),
    constraint command_interest_estimated_seats_positive check (
        estimated_seats is null or estimated_seats > 0
    )
);

create index if not exists command_interest_status_created_at_idx
on public.command_interest_requests (status, created_at desc);

create trigger set_command_interest_requests_updated_at
before update on public.command_interest_requests
for each row execute function public.set_updated_at();

alter table public.command_interest_requests enable row level security;

grant insert on public.command_interest_requests to anon;
grant select, insert, update, delete on public.command_interest_requests to authenticated;
grant all on public.command_interest_requests to service_role;

drop policy if exists "command_interest_insert_public" on public.command_interest_requests;
create policy "command_interest_insert_public"
on public.command_interest_requests
for insert
to anon, authenticated
with check (
    status = 'new'
    and reviewed_at is null
    and reviewed_by is null
    and created_organization_id is null
    and created_entitlement_id is null
);

drop policy if exists "command_interest_select_staff" on public.command_interest_requests;
create policy "command_interest_select_staff"
on public.command_interest_requests
for select
to authenticated
using (app_private.has_any_role(array['analyst', 'admin']));

drop policy if exists "command_interest_manage_admin" on public.command_interest_requests;
create policy "command_interest_manage_admin"
on public.command_interest_requests
for update
to authenticated
using (app_private.has_role('admin'))
with check (app_private.has_role('admin'));

drop policy if exists "command_interest_delete_admin" on public.command_interest_requests;
create policy "command_interest_delete_admin"
on public.command_interest_requests
for delete
to authenticated
using (app_private.has_role('admin'));
