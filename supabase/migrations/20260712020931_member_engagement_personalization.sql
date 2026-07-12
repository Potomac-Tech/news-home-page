create table if not exists public.member_personalization_preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,
    behavior_ranking_enabled boolean not null default true,
    minimum_event_threshold smallint not null default 5
        check (minimum_event_threshold >= 5 and minimum_event_threshold <= 100),
    updated_at timestamptz not null default now()
);

create table if not exists public.member_engagement_events (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete set null,
    event_type text not null check (event_type in (
        'article_read', 'search', 'saved_work', 'watchlist', 'tracker_row',
        'company_profile_view', 'alert', 'paid_article', 'dataset', 'export', 'cta_click'
    )),
    object_type text,
    object_id text,
    route text not null check (route like '/%' and route not like '//%'),
    metadata jsonb not null default '{}'::jsonb,
    occurred_at timestamptz not null default now(),
    expires_at timestamptz not null default (now() + interval '90 days'),
    check (expires_at > occurred_at and expires_at <= occurred_at + interval '90 days 1 minute')
);

create index if not exists member_engagement_user_window_idx
on public.member_engagement_events (user_id, occurred_at desc);
create index if not exists member_engagement_expiration_idx
on public.member_engagement_events (expires_at);

create table if not exists public.member_custom_intelligence_cards (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    card_key text not null,
    title text not null,
    summary text not null,
    cta_route text not null check (cta_route like '/%' and cta_route not like '//%'),
    reason_code text not null,
    reason_text text not null,
    source_event_count integer not null check (source_event_count >= 5),
    display_rank integer not null default 100,
    generated_at timestamptz not null default now(),
    expires_at timestamptz not null default (now() + interval '24 hours'),
    unique (user_id, card_key)
);

alter table public.member_personalization_preferences enable row level security;
alter table public.member_engagement_events enable row level security;
alter table public.member_custom_intelligence_cards enable row level security;

create policy "Members read own personalization preference"
on public.member_personalization_preferences for select to authenticated
using (user_id = (select auth.uid()));

create policy "Members update own personalization preference"
on public.member_personalization_preferences for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Members read own engagement history"
on public.member_engagement_events for select to authenticated
using (user_id = (select auth.uid()));

create policy "Members read own custom cards"
on public.member_custom_intelligence_cards for select to authenticated
using (
    user_id = (select auth.uid())
    and (
        organization_id is null
        or exists (
            select 1 from public.organization_members membership
            where membership.user_id = (select auth.uid())
              and membership.organization_id = member_custom_intelligence_cards.organization_id
              and membership.status = 'active'
        )
    )
);

grant select, update on public.member_personalization_preferences to authenticated;
grant select on public.member_engagement_events, public.member_custom_intelligence_cards to authenticated;

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
    return v_result;
end;
$$;

create or replace function public.record_member_engagement(
    p_event_type text, p_route text, p_object_type text default null,
    p_object_id text default null, p_metadata jsonb default '{}'::jsonb
) returns bigint
language plpgsql security definer set search_path = public, auth, pg_temp
as $$
declare v_id bigint; v_organization_id uuid;
begin
    if auth.uid() is null then return null; end if;
    if not exists (select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null)
       or not exists (select 1 from public.member_profile_completions p where p.user_id = auth.uid()) then
        return null;
    end if;
    if p_event_type not in ('article_read','search','saved_work','watchlist','tracker_row','company_profile_view','alert','paid_article','dataset','export','cta_click') then
        raise exception 'unsupported engagement event';
    end if;
    if p_route is null or left(p_route, 1) <> '/' or left(p_route, 2) = '//' then raise exception 'invalid route'; end if;
    select membership.organization_id into v_organization_id
    from public.organization_members membership
    where membership.user_id = auth.uid() and membership.status = 'active'
    order by membership.joined_at desc nulls last limit 1;
    insert into public.member_engagement_events (
        user_id, organization_id, event_type, object_type, object_id, route, metadata
    ) values (
        auth.uid(), v_organization_id, p_event_type,
        nullif(left(trim(p_object_type), 80), ''), nullif(left(trim(p_object_id), 200), ''),
        left(p_route, 500), coalesce(p_metadata, '{}'::jsonb) - array['email','name','query','message','body','content','token']
    ) returning id into v_id;
    return v_id;
end;
$$;

create or replace function public.refresh_my_custom_intelligence_cards()
returns table (personalization_enabled boolean, qualifying_events bigint, reason_text text)
language plpgsql security definer set search_path = public, auth, pg_temp
as $$
declare v_enabled boolean := true; v_threshold integer := 5; v_count bigint; v_top text; v_org uuid;
begin
    if auth.uid() is null then raise exception 'authentication required'; end if;
    if not exists (select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null)
       or not exists (select 1 from public.member_profile_completions p where p.user_id = auth.uid()) then
        return query select false, 0::bigint, 'Personalization requires a verified email and completed profile.'; return;
    end if;
    select p.behavior_ranking_enabled, p.minimum_event_threshold into v_enabled, v_threshold
    from public.member_personalization_preferences p where p.user_id = auth.uid();
    v_enabled := coalesce(v_enabled, true); v_threshold := coalesce(v_threshold, 5);
    select count(*) into v_count from public.member_engagement_events e
    where e.user_id = auth.uid() and e.occurred_at >= now() - interval '90 days' and e.expires_at > now();
    if not v_enabled or v_count < v_threshold then
        delete from public.member_custom_intelligence_cards c where c.user_id = auth.uid();
        return query select v_enabled, v_count,
            case when not v_enabled then 'Behavior-based ranking is disabled.' else format('Personalization begins after %s qualifying events.', v_threshold) end;
        return;
    end if;
    select e.event_type into v_top from public.member_engagement_events e
    where e.user_id = auth.uid() and e.occurred_at >= now() - interval '90 days' and e.expires_at > now()
    group by e.event_type order by count(*) desc, max(e.occurred_at) desc limit 1;
    select membership.organization_id into v_org from public.organization_members membership
    where membership.user_id = auth.uid() and membership.status = 'active'
    order by membership.joined_at desc nulls last limit 1;
    insert into public.member_custom_intelligence_cards (
        user_id, organization_id, card_key, title, summary, cta_route,
        reason_code, reason_text, source_event_count, display_rank, generated_at, expires_at
    ) values (
        auth.uid(), v_org, 'engagement:' || v_top, 'Your lunar intelligence brief',
        'Reviewed intelligence selected from your recent Cabeus Explorer activity.', '/',
        'recent_' || v_top, 'Shown because your recent activity most often involved ' || replace(v_top, '_', ' ') || '.',
        v_count::integer, 100, now(), now() + interval '24 hours'
    ) on conflict (user_id, card_key) do update set
        organization_id = excluded.organization_id, reason_text = excluded.reason_text,
        source_event_count = excluded.source_event_count, generated_at = now(), expires_at = now() + interval '24 hours';
    return query select true, v_count, 'Personalized from recent ' || replace(v_top, '_', ' ') || ' activity.';
end;
$$;

revoke all on function public.set_member_personalization_enabled(boolean) from public, anon;
revoke all on function public.record_member_engagement(text,text,text,text,jsonb) from public, anon;
revoke all on function public.refresh_my_custom_intelligence_cards() from public, anon;
grant execute on function public.set_member_personalization_enabled(boolean) to authenticated;
grant execute on function public.record_member_engagement(text,text,text,text,jsonb) to authenticated;
grant execute on function public.refresh_my_custom_intelligence_cards() to authenticated;

do $$ begin
    if exists (select 1 from pg_extension where extname = 'pg_cron') then
        perform cron.unschedule(jobid) from cron.job where jobname = 'purge-expired-member-engagement';
        perform cron.schedule('purge-expired-member-engagement', '17 3 * * *',
            $job$delete from public.member_engagement_events where expires_at <= now(); delete from public.member_custom_intelligence_cards where expires_at <= now();$job$);
    end if;
end $$;
