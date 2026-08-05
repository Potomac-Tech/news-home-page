-- Keep the legacy Nexus profile role aligned with Cabeus Explorer membership.
-- Nexus and Cabeus use the same auth.users identities in the canonical project.

create or replace function private.resolve_nexus_profile_role(target_user_id uuid)
returns public.profile_role
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    current_nexus_role public.profile_role;
begin
    if target_user_id is null then
        return null;
    end if;

    select profile.role
    into current_nexus_role
    from public.profiles profile
    where profile.user_id = target_user_id;

    -- Nexus administrators remain administrators regardless of membership tier.
    if current_nexus_role = 'admin'::public.profile_role then
        return current_nexus_role;
    end if;

    if exists (
        select 1
        from public.member_profiles member_profile
        where member_profile.user_id = target_user_id
          and member_profile.status = 'approved'::public.member_status
          and member_profile.base_tier = 'command'::public.membership_tier
    ) or exists (
        select 1
        from public.member_role_assignments assignment
        where assignment.user_id = target_user_id
          and assignment.role_id = 'command_user'
          and (assignment.expires_at is null or assignment.expires_at > now())
    ) or exists (
        select 1
        from public.entitlements entitlement
        where entitlement.user_id = target_user_id
          and entitlement.tier = 'command'::public.membership_tier
          and entitlement.status = 'active'::public.entitlement_status
          and entitlement.starts_at <= now()
          and (entitlement.ends_at is null or entitlement.ends_at > now())
    ) then
        return 'superior_user'::public.profile_role;
    end if;

    if exists (
        select 1
        from public.member_profiles member_profile
        where member_profile.user_id = target_user_id
          and member_profile.status = 'approved'::public.member_status
          and member_profile.base_tier = 'scout'::public.membership_tier
    ) or exists (
        select 1
        from public.member_role_assignments assignment
        where assignment.user_id = target_user_id
          and assignment.role_id = 'scout'
          and (assignment.expires_at is null or assignment.expires_at > now())
    ) or exists (
        select 1
        from public.entitlements entitlement
        where entitlement.user_id = target_user_id
          and entitlement.tier = 'scout'::public.membership_tier
          and entitlement.status = 'active'::public.entitlement_status
          and entitlement.starts_at <= now()
          and (entitlement.ends_at is null or entitlement.ends_at > now())
    ) then
        return 'premium_user'::public.profile_role;
    end if;

    if exists (
        select 1
        from public.member_profiles member_profile
        where member_profile.user_id = target_user_id
          and member_profile.status = 'approved'::public.member_status
    ) or exists (
        select 1
        from public.member_role_assignments assignment
        where assignment.user_id = target_user_id
          and assignment.role_id = 'member'
          and (assignment.expires_at is null or assignment.expires_at > now())
    ) then
        return 'base_user'::public.profile_role;
    end if;

    return null;
end;
$$;

revoke all on function private.resolve_nexus_profile_role(uuid) from public;
grant execute on function private.resolve_nexus_profile_role(uuid) to service_role;

create or replace function private.sync_nexus_profile_role(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    resolved_role public.profile_role;
begin
    if target_user_id is null then
        return;
    end if;

    resolved_role := private.resolve_nexus_profile_role(target_user_id);
    if resolved_role is null then
        return;
    end if;

    insert into public.profiles (user_id, display_name, role)
    select
        auth_user.id,
        split_part(auth_user.email, '@', 1),
        resolved_role
    from auth.users auth_user
    where auth_user.id = target_user_id
    on conflict (user_id) do update
    set role = excluded.role,
        updated_at = now()
    where public.profiles.role is distinct from excluded.role
      and public.profiles.role <> 'admin'::public.profile_role;
end;
$$;

revoke all on function private.sync_nexus_profile_role(uuid) from public;
grant execute on function private.sync_nexus_profile_role(uuid) to service_role;

create or replace function private.sync_nexus_profile_role_from_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    previous_user_id uuid;
    current_user_id uuid;
begin
    if tg_op <> 'INSERT' then
        previous_user_id := old.user_id;
    end if;

    if tg_op <> 'DELETE' then
        current_user_id := new.user_id;
    end if;

    if previous_user_id is not null then
        perform private.sync_nexus_profile_role(previous_user_id);
    end if;

    if current_user_id is not null and current_user_id is distinct from previous_user_id then
        perform private.sync_nexus_profile_role(current_user_id);
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;

    return new;
end;
$$;

revoke all on function private.sync_nexus_profile_role_from_membership() from public;

drop trigger if exists sync_nexus_role_from_member_profile on public.member_profiles;
create trigger sync_nexus_role_from_member_profile
after insert or update or delete on public.member_profiles
for each row execute function private.sync_nexus_profile_role_from_membership();

drop trigger if exists sync_nexus_role_from_assignment on public.member_role_assignments;
create trigger sync_nexus_role_from_assignment
after insert or update or delete on public.member_role_assignments
for each row execute function private.sync_nexus_profile_role_from_membership();

drop trigger if exists sync_nexus_role_from_entitlement on public.entitlements;
create trigger sync_nexus_role_from_entitlement
after insert or update or delete on public.entitlements
for each row execute function private.sync_nexus_profile_role_from_membership();

do $$
declare
    member_user_id uuid;
begin
    for member_user_id in
        select user_id from public.member_profiles
        union
        select user_id from public.member_role_assignments where user_id is not null
        union
        select user_id from public.entitlements where user_id is not null
    loop
        perform private.sync_nexus_profile_role(member_user_id);
    end loop;
end;
$$;

-- A member may update profile presentation fields, but membership controls role.
revoke insert, update on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (user_id, display_name, last_login) on public.profiles to authenticated;
grant update (
    user_id,
    display_name,
    department,
    security_clearance,
    mfa_enabled,
    last_login,
    first_name,
    last_name,
    bio,
    avatar_url
) on public.profiles to authenticated;

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
