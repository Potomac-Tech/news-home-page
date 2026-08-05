insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'editorial-source-documents',
    'editorial-source-documents',
    false,
    10485760,
    array[
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]::text[]
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.editorial_source_documents (
    id uuid primary key default gen_random_uuid(),
    article_id uuid not null references public.editorial_articles(id) on delete cascade,
    storage_bucket text not null default 'editorial-source-documents'
        check (storage_bucket = 'editorial-source-documents'),
    storage_object_path text not null,
    original_file_name text not null,
    mime_type text not null
        check (mime_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
    uploaded_by uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    unique (storage_bucket, storage_object_path)
);

create index if not exists editorial_source_documents_article_created_idx
on public.editorial_source_documents (article_id, created_at desc);

alter table public.editorial_source_documents enable row level security;

revoke all on public.editorial_source_documents from anon;
grant select, insert, update, delete on public.editorial_source_documents to authenticated;

drop policy if exists "editorial_source_documents_staff_select"
on public.editorial_source_documents;
create policy "editorial_source_documents_staff_select"
on public.editorial_source_documents
for select
to authenticated
using (app_private.has_any_role(array['editor', 'admin']));

drop policy if exists "editorial_source_documents_staff_insert"
on public.editorial_source_documents;
create policy "editorial_source_documents_staff_insert"
on public.editorial_source_documents
for insert
to authenticated
with check (
    uploaded_by = (select auth.uid())
    and app_private.has_any_role(array['editor', 'admin'])
);

drop policy if exists "editorial_source_documents_staff_update"
on public.editorial_source_documents;
create policy "editorial_source_documents_staff_update"
on public.editorial_source_documents
for update
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));

drop policy if exists "editorial_source_documents_staff_delete"
on public.editorial_source_documents;
create policy "editorial_source_documents_staff_delete"
on public.editorial_source_documents
for delete
to authenticated
using (app_private.has_any_role(array['editor', 'admin']));

drop policy if exists "editorial_source_documents_storage_select"
on storage.objects;
create policy "editorial_source_documents_storage_select"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'editorial-source-documents'
    and app_private.has_any_role(array['editor', 'admin'])
);

drop policy if exists "editorial_source_documents_storage_insert"
on storage.objects;
create policy "editorial_source_documents_storage_insert"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'editorial-source-documents'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and app_private.has_any_role(array['editor', 'admin'])
);

drop policy if exists "editorial_source_documents_storage_update"
on storage.objects;
create policy "editorial_source_documents_storage_update"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'editorial-source-documents'
    and app_private.has_any_role(array['editor', 'admin'])
)
with check (
    bucket_id = 'editorial-source-documents'
    and app_private.has_any_role(array['editor', 'admin'])
);

drop policy if exists "editorial_source_documents_storage_delete"
on storage.objects;
create policy "editorial_source_documents_storage_delete"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'editorial-source-documents'
    and app_private.has_any_role(array['editor', 'admin'])
);
