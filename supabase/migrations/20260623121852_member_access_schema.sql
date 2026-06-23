create extension if not exists pgcrypto with schema extensions;

do $$
begin
    create type public.member_application_status as enum (
        'pending',
        'approved',
        'rejected',
        'withdrawn'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.member_status as enum (
        'pending',
        'approved',
        'rejected',
        'suspended'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.membership_tier as enum (
        'member',
        'scout',
        'command'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.organization_status as enum (
        'prospect',
        'active',
        'suspended',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.organization_member_role as enum (
        'member',
        'org_admin'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.entitlement_status as enum (
        'pending',
        'active',
        'expired',
        'revoked'
    );
exception
    when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create table if not exists public.member_profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    full_name text,
    company text,
    title text,
    status public.member_status not null default 'pending',
    base_tier public.membership_tier not null default 'member',
    approved_at timestamptz,
    approved_by uuid references auth.users(id) on delete set null,
    rejected_at timestamptz,
    rejected_by uuid references auth.users(id) on delete set null,
    decision_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint member_profiles_email_not_blank check (length(trim(email)) > 0),
    constraint member_profiles_approved_has_reviewer check (
        status <> 'approved'
        or (approved_at is not null and approved_by is not null)
    ),
    constraint member_profiles_rejected_has_reviewer check (
        status <> 'rejected'
        or (rejected_at is not null and rejected_by is not null)
    )
);

create unique index if not exists member_profiles_email_key
on public.member_profiles (lower(email));

create trigger set_member_profiles_updated_at
before update on public.member_profiles
for each row execute function public.set_updated_at();

create table if not exists public.membership_applications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    email text not null,
    full_name text not null,
    company text,
    title text,
    intended_use text,
    status public.member_application_status not null default 'pending',
    reviewed_at timestamptz,
    reviewed_by uuid references auth.users(id) on delete set null,
    decision_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint membership_applications_email_not_blank check (length(trim(email)) > 0),
    constraint membership_applications_name_not_blank check (length(trim(full_name)) > 0),
    constraint membership_applications_reviewed_has_reviewer check (
        status not in ('approved', 'rejected')
        or (reviewed_at is not null and reviewed_by is not null)
    )
);

create unique index if not exists membership_applications_one_pending_email
on public.membership_applications (lower(email))
where status = 'pending';

create index if not exists membership_applications_status_created_at_idx
on public.membership_applications (status, created_at desc);

create trigger set_membership_applications_updated_at
before update on public.membership_applications
for each row execute function public.set_updated_at();

create table if not exists public.organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null,
    status public.organization_status not null default 'prospect',
    primary_billing_email text,
    seat_limit integer,
    command_contract_reference text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint organizations_name_not_blank check (length(trim(name)) > 0),
    constraint organizations_slug_not_blank check (length(trim(slug)) > 0),
    constraint organizations_seat_limit_positive check (
        seat_limit is null or seat_limit > 0
    )
);

create unique index if not exists organizations_slug_key
on public.organizations (lower(slug));

create trigger set_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create table if not exists public.organization_members (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role public.organization_member_role not null default 'member',
    status public.entitlement_status not null default 'active',
    invited_by uuid references auth.users(id) on delete set null,
    joined_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint organization_members_joined_when_active check (
        status <> 'active' or joined_at is not null
    )
);

create unique index if not exists organization_members_org_user_key
on public.organization_members (organization_id, user_id);

create index if not exists organization_members_user_idx
on public.organization_members (user_id);

create trigger set_organization_members_updated_at
before update on public.organization_members
for each row execute function public.set_updated_at();

create table if not exists public.app_roles (
    id text primary key,
    description text not null,
    created_at timestamptz not null default now(),
    constraint app_roles_id_not_blank check (length(trim(id)) > 0)
);

insert into public.app_roles (id, description)
values
    ('pending_applicant', 'Visitor with a submitted free Member application awaiting review.'),
    ('member', 'Approved free Member with access to member-gated article bodies.'),
    ('scout', 'Self-serve paid Scout user.'),
    ('command_user', 'User covered by an organization-level Command entitlement.'),
    ('org_admin', 'Organization administrator who can manage seats and members.'),
    ('editor', 'Editorial user who can draft and publish content.'),
    ('analyst', 'Analyst user who can maintain methodology and intelligence records.'),
    ('admin', 'Potomac administrator with elevated operational access.')
on conflict (id) do update set
    description = excluded.description;

create table if not exists public.member_role_assignments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    role_id text not null references public.app_roles(id) on delete restrict,
    organization_id uuid references public.organizations(id) on delete cascade,
    granted_by uuid references auth.users(id) on delete set null,
    granted_at timestamptz not null default now(),
    expires_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    constraint member_role_assignments_expiry_after_grant check (
        expires_at is null or expires_at > granted_at
    )
);

create unique index if not exists member_role_assignments_active_key
on public.member_role_assignments (
    user_id,
    role_id,
    coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)
)
where expires_at is null;

create index if not exists member_role_assignments_user_idx
on public.member_role_assignments (user_id, role_id);

create table if not exists public.entitlements (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    tier public.membership_tier not null,
    status public.entitlement_status not null default 'pending',
    source text not null,
    starts_at timestamptz,
    ends_at timestamptz,
    granted_by uuid references auth.users(id) on delete set null,
    stripe_customer_id text,
    stripe_subscription_id text,
    external_reference text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint entitlements_scope_check check (
        (user_id is not null and organization_id is null)
        or (user_id is null and organization_id is not null)
    ),
    constraint entitlements_source_not_blank check (length(trim(source)) > 0),
    constraint entitlements_end_after_start check (
        starts_at is null
        or ends_at is null
        or ends_at > starts_at
    )
);

create index if not exists entitlements_user_status_idx
on public.entitlements (user_id, status, tier)
where user_id is not null;

create index if not exists entitlements_organization_status_idx
on public.entitlements (organization_id, status, tier)
where organization_id is not null;

create unique index if not exists entitlements_stripe_subscription_key
on public.entitlements (stripe_subscription_id)
where stripe_subscription_id is not null;

create trigger set_entitlements_updated_at
before update on public.entitlements
for each row execute function public.set_updated_at();

create table if not exists public.access_audit_events (
    id uuid primary key default gen_random_uuid(),
    actor_user_id uuid references auth.users(id) on delete set null,
    target_user_id uuid references auth.users(id) on delete set null,
    organization_id uuid references public.organizations(id) on delete set null,
    event_type text not null,
    event_summary text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint access_audit_events_type_not_blank check (length(trim(event_type)) > 0),
    constraint access_audit_events_summary_not_blank check (length(trim(event_summary)) > 0)
);

create index if not exists access_audit_events_target_created_at_idx
on public.access_audit_events (target_user_id, created_at desc);

create index if not exists access_audit_events_org_created_at_idx
on public.access_audit_events (organization_id, created_at desc);

alter table public.member_profiles enable row level security;
alter table public.membership_applications enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.app_roles enable row level security;
alter table public.member_role_assignments enable row level security;
alter table public.entitlements enable row level security;
alter table public.access_audit_events enable row level security;
