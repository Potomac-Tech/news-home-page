create extension if not exists pg_cron;

alter table public.content_submissions
    add column if not exists expiration_exception_reason text,
    add column if not exists expiration_exception_approved_by uuid
        references auth.users(id) on delete set null;

alter table public.content_submissions
    drop constraint if exists content_submission_expiration_exception_complete;
alter table public.content_submissions
    add constraint content_submission_expiration_exception_complete check (
        (expiration_exception_reason is null and expiration_exception_approved_by is null)
        or (
            length(trim(expiration_exception_reason)) >= 10
            and expiration_exception_approved_by is not null
        )
    );

drop policy if exists "Public reads active published content submissions"
on public.content_submissions;
create policy "Public reads active published content submissions"
on public.content_submissions
for select
to anon, authenticated
using (
    status = 'published'
    and (scheduled_at is null or scheduled_at <= now())
    and expires_at > now()
);
grant select on public.content_submissions to anon;

drop policy if exists "Public reads active published content assets"
on storage.objects;
create policy "Public reads active published content assets"
on storage.objects
for select
to anon, authenticated
using (
    bucket_id = 'content-submissions'
    and exists (
        select 1 from public.content_submissions submission
        where submission.storage_bucket = storage.objects.bucket_id
          and submission.storage_object_path = storage.objects.name
          and submission.status = 'published'
          and (submission.scheduled_at is null or submission.scheduled_at <= now())
          and submission.expires_at > now()
    )
);

create or replace function public.set_content_submission_readiness()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
    v_issues text[] := '{}';
    v_window_days integer;
    v_window_start timestamptz := coalesce(new.scheduled_at, new.created_at, now());
begin
    v_window_days := case
        when new.content_type = 'tracker_row' then 7
        when new.content_type in ('homepage_slide', 'carousel_visual') then 14
        else 30
    end;
    if not new.copy_owner_confirmed then v_issues := array_append(v_issues, 'copy_owner_unconfirmed'); end if;
    if cardinality(new.citation_urls) = 0 then v_issues := array_append(v_issues, 'citation_required'); end if;
    if new.destination_url is null or trim(new.destination_url) = '' then v_issues := array_append(v_issues, 'destination_required'); end if;
    if new.expires_at is null then v_issues := array_append(v_issues, 'expiration_required'); end if;
    if new.content_type in ('homepage_slide', 'carousel_visual', 'house_ad', 'pathfinder_cta', 'source_cta')
       and new.storage_object_path is null then
        v_issues := array_append(v_issues, 'reviewed_asset_required');
    end if;
    if new.expires_at <= now() and new.status <> 'expired' then
        v_issues := array_append(v_issues, 'expiration_must_be_future');
    end if;
    if new.expires_at > v_window_start + make_interval(days => v_window_days)
       and new.expiration_exception_approved_by is null then
        v_issues := array_append(v_issues, 'expiration_window_exceeded');
    end if;
    new.readiness_issues := v_issues;
    if new.status in ('approved', 'published') and cardinality(v_issues) > 0 then
        raise exception 'content is not deployment ready: %', array_to_string(v_issues, ', ');
    end if;
    if new.status = 'published' and (new.approved_by is null or new.approved_at is null) then
        raise exception 'editor approval is required before publication';
    end if;
    return new;
end;
$$;

update public.cta_assets
set expires_at = created_at + interval '30 days'
where expires_at is null;

alter table public.cta_assets
    alter column expires_at set not null,
    add column if not exists expiration_exception_reason text,
    add column if not exists expiration_exception_approved_by uuid
        references auth.users(id) on delete set null;

alter table public.cta_assets
    drop constraint if exists cta_assets_expiration_window;
alter table public.cta_assets
    add constraint cta_assets_expiration_window check (
        expires_at <= created_at + interval '30 days 1 hour'
        or (
            length(trim(expiration_exception_reason)) >= 10
            and expiration_exception_approved_by is not null
        )
    );

create table if not exists private.promotional_expiration_audit (
    id uuid primary key default gen_random_uuid(),
    record_type text not null check (record_type in ('content_submission', 'cta_asset')),
    record_id uuid not null,
    previous_status text not null,
    expired_at timestamptz not null default now(),
    reason text not null default 'scheduled_expiration'
);
alter table private.promotional_expiration_audit enable row level security;
revoke all on table private.promotional_expiration_audit from public, anon, authenticated;
grant all on table private.promotional_expiration_audit to service_role;

create or replace function private.expire_promotional_content()
returns jsonb
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
    v_content_count integer := 0;
    v_asset_count integer := 0;
begin
    with candidates as materialized (
        select id, status from public.content_submissions
        where status in ('approved', 'published') and expires_at <= now()
        for update
    ), expired as (
        update public.content_submissions submission
        set status = 'expired', updated_at = now()
        from candidates
        where submission.id = candidates.id
        returning submission.id, candidates.status as previous_status
    ), logged as (
        insert into private.promotional_expiration_audit (
            record_type, record_id, previous_status
        )
        select 'content_submission', id, previous_status from expired
        returning id
    )
    select count(*) into v_content_count from logged;

    with expired as (
        update public.cta_assets
        set review_status = 'archived', updated_at = now()
        where review_status = 'reviewed' and expires_at <= now()
        returning id
    ), logged as (
        insert into private.promotional_expiration_audit (
            record_type, record_id, previous_status
        )
        select 'cta_asset', id, 'reviewed' from expired
        returning id
    )
    select count(*) into v_asset_count from logged;

    return jsonb_build_object(
        'content_submissions_expired', v_content_count,
        'cta_assets_expired', v_asset_count
    );
end;
$$;

revoke all on function private.expire_promotional_content() from public, anon, authenticated;
grant execute on function private.expire_promotional_content() to service_role;

do $$
declare v_job_id bigint;
begin
    select jobid into v_job_id from cron.job
    where jobname = 'expire-promotional-content-daily';
    if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
    perform cron.schedule(
        'expire-promotional-content-daily',
        '17 4 * * *',
        'select private.expire_promotional_content();'
    );
end;
$$;
