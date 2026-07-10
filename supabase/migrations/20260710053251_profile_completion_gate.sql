create table if not exists public.member_profile_completions (
    user_id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    affiliation text not null,
    role_title text not null,
    country_code text not null,
    timezone text not null,
    primary_interest_areas text[] not null default '{}',
    communication_preference text not null,
    phone text,
    budget_range text,
    procurement_timeline text,
    use_case_detail text,
    completed_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint member_profile_completions_affiliation_not_blank check (length(trim(affiliation)) > 0),
    constraint member_profile_completions_full_name_not_blank check (length(trim(full_name)) > 0),
    constraint member_profile_completions_role_title_not_blank check (length(trim(role_title)) > 0),
    constraint member_profile_completions_country_code_not_blank check (length(trim(country_code)) > 0),
    constraint member_profile_completions_timezone_not_blank check (length(trim(timezone)) > 0),
    constraint member_profile_completions_interests_not_empty check (cardinality(primary_interest_areas) > 0),
    constraint member_profile_completions_preference_valid check (communication_preference in ('product_updates', 'research_digest', 'both', 'none'))
);

drop trigger if exists set_member_profile_completions_updated_at
on public.member_profile_completions;

create trigger set_member_profile_completions_updated_at
before update on public.member_profile_completions
for each row execute function public.set_updated_at();

grant select, insert, update on public.member_profile_completions to authenticated;
grant all on public.member_profile_completions to service_role;

alter table public.member_profile_completions enable row level security;

drop policy if exists "member_profile_completions_select_own"
on public.member_profile_completions;

create policy "member_profile_completions_select_own"
on public.member_profile_completions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "member_profile_completions_insert_own"
on public.member_profile_completions;

create policy "member_profile_completions_insert_own"
on public.member_profile_completions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "member_profile_completions_update_own"
on public.member_profile_completions;

create policy "member_profile_completions_update_own"
on public.member_profile_completions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "member_profile_completions_select_staff"
on public.member_profile_completions;

create policy "member_profile_completions_select_staff"
on public.member_profile_completions
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));
