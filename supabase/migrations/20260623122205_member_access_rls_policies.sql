create schema if not exists app_private;

revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated;

create or replace function app_private.has_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select auth.uid() is not null
        and exists (
            select 1
            from public.member_role_assignments role_assignment
            where role_assignment.user_id = auth.uid()
                and role_assignment.role_id = required_role
                and (
                    role_assignment.expires_at is null
                    or role_assignment.expires_at > now()
                )
        );
$$;

create or replace function app_private.has_any_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select auth.uid() is not null
        and exists (
            select 1
            from public.member_role_assignments role_assignment
            where role_assignment.user_id = auth.uid()
                and role_assignment.role_id = any(required_roles)
                and (
                    role_assignment.expires_at is null
                    or role_assignment.expires_at > now()
                )
        );
$$;

create or replace function app_private.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select auth.uid() is not null
        and exists (
            select 1
            from public.organization_members organization_member
            where organization_member.organization_id = target_organization_id
                and organization_member.user_id = auth.uid()
                and organization_member.status = 'active'
        );
$$;

create or replace function app_private.is_org_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select app_private.has_role('admin')
        or (
            auth.uid() is not null
            and exists (
                select 1
                from public.organization_members organization_member
                where organization_member.organization_id = target_organization_id
                    and organization_member.user_id = auth.uid()
                    and organization_member.role = 'org_admin'
                    and organization_member.status = 'active'
            )
        )
        or (
            auth.uid() is not null
            and exists (
                select 1
                from public.member_role_assignments role_assignment
                where role_assignment.organization_id = target_organization_id
                    and role_assignment.user_id = auth.uid()
                    and role_assignment.role_id = 'org_admin'
                    and (
                        role_assignment.expires_at is null
                        or role_assignment.expires_at > now()
                    )
            )
        );
$$;

grant execute on function app_private.has_role(text) to authenticated;
grant execute on function app_private.has_any_role(text[]) to authenticated;
grant execute on function app_private.is_org_member(uuid) to authenticated;
grant execute on function app_private.is_org_admin(uuid) to authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.app_roles to anon, authenticated;
grant insert on public.membership_applications to anon;

grant select, insert, update, delete on
    public.member_profiles,
    public.membership_applications,
    public.organizations,
    public.organization_members,
    public.app_roles,
    public.member_role_assignments,
    public.entitlements,
    public.access_audit_events
to authenticated;

grant all on
    public.member_profiles,
    public.membership_applications,
    public.organizations,
    public.organization_members,
    public.app_roles,
    public.member_role_assignments,
    public.entitlements,
    public.access_audit_events
to service_role;

drop policy if exists "member_profiles_select_own" on public.member_profiles;
create policy "member_profiles_select_own"
on public.member_profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "member_profiles_select_org_admin" on public.member_profiles;
create policy "member_profiles_select_org_admin"
on public.member_profiles
for select
to authenticated
using (
    exists (
        select 1
        from public.organization_members organization_member
        where organization_member.user_id = member_profiles.user_id
            and app_private.is_org_admin(organization_member.organization_id)
    )
);

drop policy if exists "member_profiles_select_staff" on public.member_profiles;
create policy "member_profiles_select_staff"
on public.member_profiles
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "member_profiles_insert_own_pending" on public.member_profiles;
create policy "member_profiles_insert_own_pending"
on public.member_profiles
for insert
to authenticated
with check (
    user_id = auth.uid()
    and status = 'pending'
    and base_tier = 'member'
);

drop policy if exists "member_profiles_manage_admin" on public.member_profiles;
create policy "member_profiles_manage_admin"
on public.member_profiles
for all
to authenticated
using (app_private.has_role('admin'))
with check (app_private.has_role('admin'));

drop policy if exists "membership_applications_insert_public_pending" on public.membership_applications;
create policy "membership_applications_insert_public_pending"
on public.membership_applications
for insert
to anon, authenticated
with check (
    status = 'pending'
    and reviewed_at is null
    and reviewed_by is null
    and (user_id is null or user_id = auth.uid())
);

drop policy if exists "membership_applications_select_own" on public.membership_applications;
create policy "membership_applications_select_own"
on public.membership_applications
for select
to authenticated
using (
    user_id = auth.uid()
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "membership_applications_select_staff" on public.membership_applications;
create policy "membership_applications_select_staff"
on public.membership_applications
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "membership_applications_manage_admin" on public.membership_applications;
create policy "membership_applications_manage_admin"
on public.membership_applications
for update
to authenticated
using (app_private.has_role('admin'))
with check (app_private.has_role('admin'));

drop policy if exists "membership_applications_delete_admin" on public.membership_applications;
create policy "membership_applications_delete_admin"
on public.membership_applications
for delete
to authenticated
using (app_private.has_role('admin'));

drop policy if exists "organizations_select_members_and_staff" on public.organizations;
create policy "organizations_select_members_and_staff"
on public.organizations
for select
to authenticated
using (
    app_private.is_org_member(id)
    or app_private.has_any_role(array['editor', 'analyst', 'admin'])
);

drop policy if exists "organizations_manage_admin" on public.organizations;
create policy "organizations_manage_admin"
on public.organizations
for all
to authenticated
using (app_private.has_role('admin'))
with check (app_private.has_role('admin'));

drop policy if exists "organizations_update_org_admin" on public.organizations;
create policy "organizations_update_org_admin"
on public.organizations
for update
to authenticated
using (app_private.is_org_admin(id))
with check (app_private.is_org_admin(id));

drop policy if exists "organization_members_select_self_org_admin_staff" on public.organization_members;
create policy "organization_members_select_self_org_admin_staff"
on public.organization_members
for select
to authenticated
using (
    user_id = auth.uid()
    or app_private.is_org_admin(organization_id)
    or app_private.has_any_role(array['analyst', 'admin'])
);

drop policy if exists "organization_members_insert_org_admin" on public.organization_members;
create policy "organization_members_insert_org_admin"
on public.organization_members
for insert
to authenticated
with check (
    app_private.has_role('admin')
    or (
        app_private.is_org_admin(organization_id)
        and role = 'member'
    )
);

drop policy if exists "organization_members_update_org_admin" on public.organization_members;
create policy "organization_members_update_org_admin"
on public.organization_members
for update
to authenticated
using (
    app_private.has_role('admin')
    or app_private.is_org_admin(organization_id)
)
with check (
    app_private.has_role('admin')
    or (
        app_private.is_org_admin(organization_id)
        and role = 'member'
    )
);

drop policy if exists "organization_members_delete_org_admin" on public.organization_members;
create policy "organization_members_delete_org_admin"
on public.organization_members
for delete
to authenticated
using (
    app_private.has_role('admin')
    or app_private.is_org_admin(organization_id)
);

drop policy if exists "app_roles_select_all" on public.app_roles;
create policy "app_roles_select_all"
on public.app_roles
for select
to anon, authenticated
using (true);

drop policy if exists "app_roles_manage_admin" on public.app_roles;
create policy "app_roles_manage_admin"
on public.app_roles
for all
to authenticated
using (app_private.has_role('admin'))
with check (app_private.has_role('admin'));

drop policy if exists "member_role_assignments_select_self_org_admin_staff" on public.member_role_assignments;
create policy "member_role_assignments_select_self_org_admin_staff"
on public.member_role_assignments
for select
to authenticated
using (
    user_id = auth.uid()
    or app_private.has_role('admin')
    or (
        organization_id is not null
        and app_private.is_org_admin(organization_id)
    )
);

drop policy if exists "member_role_assignments_manage_admin" on public.member_role_assignments;
create policy "member_role_assignments_manage_admin"
on public.member_role_assignments
for all
to authenticated
using (app_private.has_role('admin'))
with check (app_private.has_role('admin'));

drop policy if exists "entitlements_select_self_org_staff" on public.entitlements;
create policy "entitlements_select_self_org_staff"
on public.entitlements
for select
to authenticated
using (
    user_id = auth.uid()
    or (
        organization_id is not null
        and app_private.is_org_member(organization_id)
    )
    or app_private.has_any_role(array['analyst', 'admin'])
);

drop policy if exists "entitlements_manage_admin" on public.entitlements;
create policy "entitlements_manage_admin"
on public.entitlements
for all
to authenticated
using (app_private.has_role('admin'))
with check (app_private.has_role('admin'));

drop policy if exists "access_audit_events_select_relevant" on public.access_audit_events;
create policy "access_audit_events_select_relevant"
on public.access_audit_events
for select
to authenticated
using (
    target_user_id = auth.uid()
    or actor_user_id = auth.uid()
    or (
        organization_id is not null
        and app_private.is_org_admin(organization_id)
    )
    or app_private.has_any_role(array['analyst', 'admin'])
);

drop policy if exists "access_audit_events_insert_admin" on public.access_audit_events;
create policy "access_audit_events_insert_admin"
on public.access_audit_events
for insert
to authenticated
with check (app_private.has_role('admin'));

drop policy if exists "access_audit_events_manage_admin" on public.access_audit_events;
create policy "access_audit_events_manage_admin"
on public.access_audit_events
for update
to authenticated
using (app_private.has_role('admin'))
with check (app_private.has_role('admin'));

drop policy if exists "access_audit_events_delete_admin" on public.access_audit_events;
create policy "access_audit_events_delete_admin"
on public.access_audit_events
for delete
to authenticated
using (app_private.has_role('admin'));
