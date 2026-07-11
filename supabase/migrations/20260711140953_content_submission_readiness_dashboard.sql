insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'content-submissions', 'content-submissions', false, 8388608,
    array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.content_submissions (
    id uuid primary key default gen_random_uuid(),
    content_type text not null check (content_type in (
        'homepage_slide', 'carousel_visual', 'tracker_row', 'source_citation',
        'house_ad', 'pathfinder_cta', 'source_cta', 'contract_award',
        'public_empty_state'
    )),
    title text not null check (length(trim(title)) between 3 and 200),
    body_copy text not null check (length(trim(body_copy)) between 10 and 4000),
    destination_url text,
    citation_urls text[] not null default '{}',
    source_note text not null check (length(trim(source_note)) > 0),
    content_origin text not null check (content_origin in (
        'ceo_provided', 'editor_authored', 'partner_provided', 'licensed_import'
    )),
    copy_owner_confirmed boolean not null default false,
    storage_bucket text check (storage_bucket is null or storage_bucket = 'content-submissions'),
    storage_object_path text,
    asset_mime_type text,
    asset_size_bytes bigint,
    asset_width_px integer,
    asset_height_px integer,
    asset_alt_text text,
    status text not null default 'submitted' check (status in (
        'submitted', 'approved', 'rejected', 'published', 'expired'
    )),
    readiness_issues text[] not null default '{}',
    scheduled_at timestamptz,
    expires_at timestamptz not null,
    submitted_by uuid not null references auth.users(id) on delete restrict,
    approved_by uuid references auth.users(id) on delete set null,
    approved_at timestamptz,
    published_by uuid references auth.users(id) on delete set null,
    published_at timestamptz,
    review_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint content_submission_destination_format check (
        destination_url is null
        or (destination_url like '/%' and destination_url not like '//%')
        or destination_url ~ '^https://'
    ),
    constraint content_submission_expiry_order check (
        expires_at > coalesce(scheduled_at, created_at)
    ),
    constraint content_submission_asset_complete check (
        storage_object_path is null or (
            storage_bucket = 'content-submissions'
            and asset_mime_type in ('image/png', 'image/jpeg', 'image/webp')
            and asset_size_bytes between 1 and 8388608
            and asset_width_px between 640 and 8000
            and asset_height_px between 360 and 8000
            and length(trim(asset_alt_text)) >= 12
        )
    )
);

create index if not exists content_submissions_status_expiry_idx
on public.content_submissions (status, expires_at, created_at desc);
create index if not exists content_submissions_type_status_idx
on public.content_submissions (content_type, status, created_at desc);

create table if not exists public.content_submission_audit (
    id uuid primary key default gen_random_uuid(),
    submission_id uuid not null references public.content_submissions(id) on delete cascade,
    action text not null check (action in ('submitted', 'updated', 'approved', 'rejected', 'published', 'expired')),
    actor_user_id uuid references auth.users(id) on delete set null,
    details jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create or replace function public.set_content_submission_readiness()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare v_issues text[] := '{}';
begin
    if not new.copy_owner_confirmed then v_issues := array_append(v_issues, 'copy_owner_unconfirmed'); end if;
    if cardinality(new.citation_urls) = 0 then v_issues := array_append(v_issues, 'citation_required'); end if;
    if new.destination_url is null or trim(new.destination_url) = '' then v_issues := array_append(v_issues, 'destination_required'); end if;
    if new.expires_at is null then v_issues := array_append(v_issues, 'expiration_required'); end if;
    if new.content_type in ('homepage_slide', 'carousel_visual', 'house_ad', 'pathfinder_cta', 'source_cta')
       and new.storage_object_path is null then
        v_issues := array_append(v_issues, 'reviewed_asset_required');
    end if;
    if new.expires_at <= now() then v_issues := array_append(v_issues, 'expiration_must_be_future'); end if;
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

drop trigger if exists validate_content_submission_readiness on public.content_submissions;
create trigger validate_content_submission_readiness
before insert or update on public.content_submissions
for each row execute function public.set_content_submission_readiness();

drop trigger if exists set_content_submissions_updated_at on public.content_submissions;
create trigger set_content_submissions_updated_at
before update on public.content_submissions
for each row execute function public.set_updated_at();

create or replace function public.audit_content_submission_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_action text;
begin
    v_action := case
        when tg_op = 'INSERT' then 'submitted'
        when old.status is distinct from new.status then new.status
        else 'updated'
    end;
    insert into public.content_submission_audit (submission_id, action, actor_user_id, details)
    values (new.id, v_action, auth.uid(), jsonb_build_object('status', new.status, 'readiness_issues', new.readiness_issues));
    return new;
end;
$$;

drop trigger if exists audit_content_submission_changes on public.content_submissions;
create trigger audit_content_submission_changes
after insert or update on public.content_submissions
for each row execute function public.audit_content_submission_change();

alter table public.content_submissions enable row level security;
alter table public.content_submission_audit enable row level security;

drop policy if exists "Content staff manage submissions" on public.content_submissions;
create policy "Content staff manage submissions" on public.content_submissions
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

drop policy if exists "Content staff read submission audit" on public.content_submission_audit;
create policy "Content staff read submission audit" on public.content_submission_audit
for select to authenticated
using (exists (
    select 1 from public.member_role_assignments assignment
    where assignment.user_id = (select auth.uid())
      and assignment.role_id in ('editor', 'admin')
      and (assignment.expires_at is null or assignment.expires_at > now())
));

drop policy if exists "Content staff upload submission assets" on storage.objects;
create policy "Content staff upload submission assets" on storage.objects
for insert to authenticated
with check (
    bucket_id = 'content-submissions'
    and exists (
        select 1 from public.member_role_assignments assignment
        where assignment.user_id = (select auth.uid())
          and assignment.role_id in ('editor', 'admin')
          and (assignment.expires_at is null or assignment.expires_at > now())
    )
);

drop policy if exists "Content staff read submission assets" on storage.objects;
create policy "Content staff read submission assets" on storage.objects
for select to authenticated
using (
    bucket_id = 'content-submissions'
    and exists (
        select 1 from public.member_role_assignments assignment
        where assignment.user_id = (select auth.uid())
          and assignment.role_id in ('editor', 'admin')
    )
);

drop policy if exists "Content staff delete submission assets" on storage.objects;
create policy "Content staff delete submission assets" on storage.objects
for delete to authenticated
using (
    bucket_id = 'content-submissions'
    and exists (
        select 1 from public.member_role_assignments assignment
        where assignment.user_id = (select auth.uid())
          and assignment.role_id in ('editor', 'admin')
    )
);

grant select, insert, update, delete on public.content_submissions to authenticated;
grant select on public.content_submission_audit to authenticated;
revoke all on function public.audit_content_submission_change() from public, anon, authenticated;
