create or replace function private.sync_editable_member_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    update public.member_profiles
    set
        full_name = new.full_name,
        company = new.affiliation,
        title = new.role_title
    where user_id = new.user_id;

    return new;
end;
$$;

revoke all on function private.sync_editable_member_profile()
from public, anon, authenticated;

drop trigger if exists sync_editable_member_profile
on public.member_profile_completions;

create trigger sync_editable_member_profile
after insert or update of full_name, affiliation, role_title
on public.member_profile_completions
for each row execute function private.sync_editable_member_profile();

create or replace function private.sync_member_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if new.email is distinct from old.email
       and new.email is not null
       and new.email_confirmed_at is not null then
        update public.member_profiles
        set email = lower(trim(new.email))
        where user_id = new.id;
    end if;

    return new;
end;
$$;

revoke all on function private.sync_member_profile_email_from_auth()
from public, anon, authenticated;

drop trigger if exists sync_member_profile_email_from_auth
on auth.users;

create trigger sync_member_profile_email_from_auth
after update of email
on auth.users
for each row execute function private.sync_member_profile_email_from_auth();

update public.member_profiles as member_profile
set
    full_name = completion.full_name,
    company = completion.affiliation,
    title = completion.role_title
from public.member_profile_completions as completion
where member_profile.user_id = completion.user_id
  and (
      member_profile.full_name is distinct from completion.full_name
      or member_profile.company is distinct from completion.affiliation
      or member_profile.title is distinct from completion.role_title
  );
