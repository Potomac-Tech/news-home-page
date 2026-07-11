create table if not exists public.homepage_carousel_slides (
    id uuid primary key default gen_random_uuid(),
    slide_type text not null check (slide_type in (
        'anonymous_teaser', 'signed_in_editorial_story',
        'custom_intelligence_card', 'paid_tier_teaser'
    )),
    article_id uuid references public.editorial_articles(id) on delete cascade,
    selection_mode text not null default 'manual' check (selection_mode in ('manual', 'auto_latest')),
    title text not null check (length(trim(title)) between 3 and 200),
    summary text not null check (length(trim(summary)) between 20 and 600),
    status text not null default 'draft' check (status in (
        'draft', 'preview', 'published', 'unpublished', 'expired'
    )),
    is_pinned boolean not null default false,
    display_rank integer not null default 100 check (display_rank between 0 and 10000),
    is_required boolean not null default false,
    content_visibility text not null default 'public_teaser'
        check (content_visibility in ('public_teaser', 'member_only')),
    audience_mode text not null default 'anonymous'
        check (audience_mode in ('anonymous', 'verified_member')),
    minimum_tier text not null default 'public'
        check (minimum_tier in ('public', 'member', 'scout', 'command')),
    visual_asset_url text not null,
    visual_asset_alt text not null check (length(trim(visual_asset_alt)) >= 12),
    cta_label text not null default 'Read the brief'
        check (length(trim(cta_label)) between 2 and 60),
    cta_route text not null,
    citation_url text not null check (citation_url ~ '^https://'),
    source_note text not null check (length(trim(source_note)) >= 10),
    freshness_at timestamptz not null,
    scheduled_at timestamptz,
    expires_at timestamptz not null,
    created_by uuid not null references auth.users(id) on delete restrict,
    updated_by uuid not null references auth.users(id) on delete restrict,
    published_by uuid references auth.users(id) on delete set null,
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint carousel_asset_url_format check (
        (visual_asset_url like '/%' and visual_asset_url not like '//%')
        or visual_asset_url ~ '^https://'
    ),
    constraint carousel_cta_route_format check (
        (cta_route like '/%' and cta_route not like '//%')
        or cta_route ~ '^https://'
    ),
    constraint carousel_expiration_order check (
        expires_at > coalesce(scheduled_at, created_at)
        and expires_at <= coalesce(scheduled_at, created_at) + interval '14 days 1 hour'
    ),
    constraint carousel_member_visibility check (
        content_visibility <> 'member_only'
        or (audience_mode = 'verified_member' and minimum_tier <> 'public')
    ),
    constraint carousel_article_type_reference check (
        slide_type not in ('anonymous_teaser', 'signed_in_editorial_story')
        or article_id is not null
        or selection_mode = 'auto_latest'
    ),
    constraint carousel_published_metadata check (
        status <> 'published'
        or (published_by is not null and published_at is not null)
    )
);

create index if not exists homepage_carousel_active_rank_idx
on public.homepage_carousel_slides (
    status, is_required desc, is_pinned desc, display_rank, scheduled_at, expires_at
);
create index if not exists homepage_carousel_article_idx
on public.homepage_carousel_slides (article_id)
where article_id is not null;

create table if not exists public.homepage_carousel_audit (
    id uuid primary key default gen_random_uuid(),
    slide_id uuid not null references public.homepage_carousel_slides(id) on delete cascade,
    action text not null check (action in (
        'created', 'updated', 'previewed', 'published', 'unpublished', 'reordered', 'expired'
    )),
    actor_user_id uuid references auth.users(id) on delete set null,
    snapshot jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create or replace function public.enforce_homepage_carousel_active_limit()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
    if new.status = 'published' and (
        select count(*) from public.homepage_carousel_slides slide
        where slide.status = 'published'
          and slide.expires_at > now()
          and slide.id <> new.id
    ) >= 5 then
        raise exception 'homepage carousel supports no more than five active slides';
    end if;
    return new;
end;
$$;

drop trigger if exists enforce_homepage_carousel_active_limit
on public.homepage_carousel_slides;
create trigger enforce_homepage_carousel_active_limit
before insert or update on public.homepage_carousel_slides
for each row execute function public.enforce_homepage_carousel_active_limit();

drop trigger if exists set_homepage_carousel_updated_at
on public.homepage_carousel_slides;
create trigger set_homepage_carousel_updated_at
before update on public.homepage_carousel_slides
for each row execute function public.set_updated_at();

create or replace function public.audit_homepage_carousel_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_action text;
begin
    v_action := case
        when tg_op = 'INSERT' then 'created'
        when old.status is distinct from new.status then
            case new.status when 'preview' then 'previewed' else new.status end
        when old.display_rank is distinct from new.display_rank then 'reordered'
        else 'updated'
    end;
    insert into public.homepage_carousel_audit (slide_id, action, actor_user_id, snapshot)
    values (
        new.id, v_action, auth.uid(),
        jsonb_build_object(
            'status', new.status, 'rank', new.display_rank,
            'required', new.is_required, 'expires_at', new.expires_at
        )
    );
    return new;
end;
$$;

drop trigger if exists audit_homepage_carousel_changes
on public.homepage_carousel_slides;
create trigger audit_homepage_carousel_changes
after insert or update on public.homepage_carousel_slides
for each row execute function public.audit_homepage_carousel_change();

alter table public.homepage_carousel_slides enable row level security;
alter table public.homepage_carousel_audit enable row level security;

create policy "Public reads active carousel teasers"
on public.homepage_carousel_slides
for select to anon, authenticated
using (
    status = 'published'
    and content_visibility = 'public_teaser'
    and (scheduled_at is null or scheduled_at <= now())
    and expires_at > now()
);

create or replace function private.has_verified_complete_profile()
returns boolean
language sql
stable
security definer
set search_path = auth, public, pg_temp
as $$
    select auth.uid() is not null
       and exists (
           select 1 from auth.users user_record
           where user_record.id = auth.uid()
             and user_record.email_confirmed_at is not null
       )
       and exists (
           select 1 from public.member_profile_completions completion
           where completion.user_id = auth.uid()
       );
$$;
revoke all on function private.has_verified_complete_profile() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.has_verified_complete_profile() to authenticated;

create policy "Verified complete members read member carousel"
on public.homepage_carousel_slides
for select to authenticated
using (
    status = 'published'
    and content_visibility = 'member_only'
    and (scheduled_at is null or scheduled_at <= now())
    and expires_at > now()
    and (select private.has_verified_complete_profile())
);

create policy "Editorial staff manage carousel"
on public.homepage_carousel_slides
for all to authenticated
using (exists (
    select 1 from public.member_role_assignments assignment
    where assignment.user_id = (select auth.uid())
      and assignment.role_id in ('editor', 'admin')
      and (assignment.expires_at is null or assignment.expires_at > now())
))
with check (exists (
    select 1 from public.member_role_assignments assignment
    where assignment.user_id = (select auth.uid())
      and assignment.role_id in ('editor', 'admin')
      and (assignment.expires_at is null or assignment.expires_at > now())
));

create policy "Editorial staff read carousel audit"
on public.homepage_carousel_audit
for select to authenticated
using (exists (
    select 1 from public.member_role_assignments assignment
    where assignment.user_id = (select auth.uid())
      and assignment.role_id in ('editor', 'admin')
      and (assignment.expires_at is null or assignment.expires_at > now())
));

grant select on public.homepage_carousel_slides to anon, authenticated;
grant select, insert, update, delete on public.homepage_carousel_slides to authenticated;
grant select on public.homepage_carousel_audit to authenticated;
revoke all on function public.audit_homepage_carousel_change() from public, anon, authenticated;

alter table private.promotional_expiration_audit
    drop constraint if exists promotional_expiration_audit_record_type_check;
alter table private.promotional_expiration_audit
    add constraint promotional_expiration_audit_record_type_check check (
        record_type in ('content_submission', 'cta_asset', 'carousel_slide')
    );

create or replace function private.expire_promotional_content()
returns jsonb
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
    v_content_count integer := 0;
    v_asset_count integer := 0;
    v_slide_count integer := 0;
begin
    with candidates as materialized (
        select id, status from public.content_submissions
        where status in ('approved', 'published') and expires_at <= now() for update
    ), expired as (
        update public.content_submissions submission set status = 'expired', updated_at = now()
        from candidates where submission.id = candidates.id
        returning submission.id, candidates.status as previous_status
    ), logged as (
        insert into private.promotional_expiration_audit (record_type, record_id, previous_status)
        select 'content_submission', id, previous_status from expired returning id
    ) select count(*) into v_content_count from logged;

    with expired as (
        update public.cta_assets set review_status = 'archived', updated_at = now()
        where review_status = 'reviewed' and expires_at <= now() returning id
    ), logged as (
        insert into private.promotional_expiration_audit (record_type, record_id, previous_status)
        select 'cta_asset', id, 'reviewed' from expired returning id
    ) select count(*) into v_asset_count from logged;

    with candidates as materialized (
        select id, status from public.homepage_carousel_slides
        where status in ('preview', 'published') and expires_at <= now() for update
    ), expired as (
        update public.homepage_carousel_slides slide set status = 'expired', updated_at = now()
        from candidates where slide.id = candidates.id
        returning slide.id, candidates.status as previous_status
    ), logged as (
        insert into private.promotional_expiration_audit (record_type, record_id, previous_status)
        select 'carousel_slide', id, previous_status from expired returning id
    ) select count(*) into v_slide_count from logged;

    return jsonb_build_object(
        'content_submissions_expired', v_content_count,
        'cta_assets_expired', v_asset_count,
        'carousel_slides_expired', v_slide_count
    );
end;
$$;
