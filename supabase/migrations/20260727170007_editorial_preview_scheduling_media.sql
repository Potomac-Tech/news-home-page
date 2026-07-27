insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'editorial-media',
    'editorial-media',
    true,
    52428800,
    array[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/webm'
    ]::text[]
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.editorial_media_assets (
    id uuid primary key default gen_random_uuid(),
    article_id uuid not null references public.editorial_articles(id) on delete cascade,
    storage_bucket text not null default 'editorial-media'
        check (storage_bucket = 'editorial-media'),
    storage_object_path text not null,
    public_url text not null,
    original_file_name text not null,
    media_type text not null check (media_type in ('image', 'video')),
    mime_type text not null,
    size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
    alt_text text,
    caption text,
    sort_order integer not null default 0 check (sort_order >= 0),
    uploaded_by uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    unique (storage_bucket, storage_object_path)
);

create index if not exists editorial_media_assets_article_order_idx
on public.editorial_media_assets (article_id, sort_order, created_at);

create table if not exists public.editorial_preview_approvals (
    article_id uuid primary key references public.editorial_articles(id) on delete cascade,
    article_updated_at timestamptz not null,
    previewed_by uuid not null references auth.users(id) on delete restrict,
    previewed_at timestamptz not null default now()
);

alter table public.editorial_media_assets enable row level security;
alter table public.editorial_preview_approvals enable row level security;

revoke all on public.editorial_media_assets from anon;
grant select on public.editorial_media_assets to anon;
grant select, insert, update, delete on public.editorial_media_assets to authenticated;
revoke all on public.editorial_preview_approvals from anon;
grant select, insert, update, delete on public.editorial_preview_approvals to authenticated;

create policy "editorial_media_public_select"
on public.editorial_media_assets for select
to anon, authenticated
using (
    exists (
        select 1
        from public.editorial_articles article
        where article.id = article_id
          and article.status = 'published'
          and article.published_at <= now()
    )
    or app_private.has_any_role(array['editor', 'admin'])
);

create policy "editorial_media_staff_insert"
on public.editorial_media_assets for insert
to authenticated
with check (
    uploaded_by = (select auth.uid())
    and app_private.has_any_role(array['editor', 'admin'])
);

create policy "editorial_media_staff_update"
on public.editorial_media_assets for update
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));

create policy "editorial_media_staff_delete"
on public.editorial_media_assets for delete
to authenticated
using (app_private.has_any_role(array['editor', 'admin']));

create policy "editorial_preview_staff_select"
on public.editorial_preview_approvals for select
to authenticated
using (app_private.has_any_role(array['editor', 'admin']));

create policy "editorial_preview_staff_insert"
on public.editorial_preview_approvals for insert
to authenticated
with check (
    previewed_by = (select auth.uid())
    and app_private.has_any_role(array['editor', 'admin'])
);

create policy "editorial_preview_staff_update"
on public.editorial_preview_approvals for update
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (
    previewed_by = (select auth.uid())
    and app_private.has_any_role(array['editor', 'admin'])
);

create policy "editorial_preview_staff_delete"
on public.editorial_preview_approvals for delete
to authenticated
using (app_private.has_any_role(array['editor', 'admin']));

create policy "editorial_media_storage_insert"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'editorial-media'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and app_private.has_any_role(array['editor', 'admin'])
);

create policy "editorial_media_storage_update"
on storage.objects for update
to authenticated
using (
    bucket_id = 'editorial-media'
    and app_private.has_any_role(array['editor', 'admin'])
)
with check (
    bucket_id = 'editorial-media'
    and app_private.has_any_role(array['editor', 'admin'])
);

create policy "editorial_media_storage_delete"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'editorial-media'
    and app_private.has_any_role(array['editor', 'admin'])
);

create or replace function public.publish_due_editorial_articles()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
    published_count integer;
begin
    update public.editorial_articles
    set
        status = 'published',
        published_at = scheduled_for,
        updated_at = now()
    where status = 'scheduled'
      and scheduled_for <= now();

    get diagnostics published_count = row_count;
    return published_count;
end;
$$;

revoke all on function public.publish_due_editorial_articles() from public;
grant execute on function public.publish_due_editorial_articles() to postgres;

create extension if not exists pg_cron with schema extensions;

do $$
declare
    existing_job bigint;
begin
    select jobid into existing_job
    from cron.job
    where jobname = 'publish-due-editorial-articles';

    if existing_job is not null then
        perform cron.unschedule(existing_job);
    end if;

    perform cron.schedule(
        'publish-due-editorial-articles',
        '*/5 * * * *',
        'select public.publish_due_editorial_articles();'
    );
end $$;
