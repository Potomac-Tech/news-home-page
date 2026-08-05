create table if not exists public.member_personalization_preference_audit (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    behavior_ranking_enabled boolean not null,
    changed_at timestamptz not null default now()
);

create index if not exists member_personalization_audit_user_idx
on public.member_personalization_preference_audit (user_id, changed_at desc);

alter table public.member_personalization_preference_audit enable row level security;
create policy "Members read own personalization audit"
on public.member_personalization_preference_audit for select to authenticated
using (user_id = (select auth.uid()));
grant select on public.member_personalization_preference_audit to authenticated;

create or replace function public.set_member_personalization_enabled(p_enabled boolean)
returns public.member_personalization_preferences
language plpgsql security definer set search_path = public, auth, pg_temp
as $$
declare v_result public.member_personalization_preferences;
begin
    if auth.uid() is null then raise exception 'authentication required'; end if;
    insert into public.member_personalization_preferences (user_id, behavior_ranking_enabled, updated_at)
    values (auth.uid(), p_enabled, now())
    on conflict (user_id) do update set
        behavior_ranking_enabled = excluded.behavior_ranking_enabled,
        updated_at = now()
    returning * into v_result;
    insert into public.member_personalization_preference_audit (user_id, behavior_ranking_enabled)
    values (auth.uid(), p_enabled);
    return v_result;
end;
$$;

revoke all on function public.set_member_personalization_enabled(boolean) from public, anon;
grant execute on function public.set_member_personalization_enabled(boolean) to authenticated;
