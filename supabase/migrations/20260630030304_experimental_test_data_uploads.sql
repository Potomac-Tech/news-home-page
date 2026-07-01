do $$
begin
    create type public.experimental_test_data_format as enum (
        'csv',
        'xlsx'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.experimental_test_data_status as enum (
        'accepted',
        'needs_review',
        'rejected'
    );
exception
    when duplicate_object then null;
end $$;

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'experimental-test-data',
    'experimental-test-data',
    false,
    6291456,
    array[
        'text/csv',
        'application/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.experimental_test_data_uploads (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete set null,
    title text not null,
    test_environment text,
    test_campaign text,
    notes text,
    storage_bucket text not null default 'experimental-test-data',
    storage_object_path text not null unique,
    original_filename text not null,
    file_format public.experimental_test_data_format not null,
    mime_type text not null,
    byte_size bigint not null,
    validation_status public.experimental_test_data_status not null default 'accepted',
    validation_errors jsonb not null default '[]'::jsonb,
    uploaded_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint experimental_test_data_uploads_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint experimental_test_data_uploads_filename_not_blank check (
        length(trim(original_filename)) > 0
    ),
    constraint experimental_test_data_uploads_bucket_check check (
        storage_bucket = 'experimental-test-data'
    ),
    constraint experimental_test_data_uploads_path_owner check (
        storage_object_path like user_id::text || '/%'
    ),
    constraint experimental_test_data_uploads_byte_size_positive check (
        byte_size > 0 and byte_size <= 6291456
    ),
    constraint experimental_test_data_uploads_validation_errors_array check (
        jsonb_typeof(validation_errors) = 'array'
    )
);

create index if not exists experimental_test_data_uploads_user_uploaded_idx
on public.experimental_test_data_uploads (user_id, uploaded_at desc);

create index if not exists experimental_test_data_uploads_org_uploaded_idx
on public.experimental_test_data_uploads (organization_id, uploaded_at desc)
where organization_id is not null;

drop trigger if exists set_experimental_test_data_uploads_updated_at
on public.experimental_test_data_uploads;
create trigger set_experimental_test_data_uploads_updated_at
before update on public.experimental_test_data_uploads
for each row execute function public.set_updated_at();

alter table public.experimental_test_data_uploads enable row level security;

grant select, insert on public.experimental_test_data_uploads to authenticated;
grant update, delete on public.experimental_test_data_uploads to authenticated;
grant all on public.experimental_test_data_uploads to service_role;

drop policy if exists "experimental_test_data_uploads_select_owner_org_staff"
on public.experimental_test_data_uploads;
create policy "experimental_test_data_uploads_select_owner_org_staff"
on public.experimental_test_data_uploads
for select
to authenticated
using (
    user_id = auth.uid()
    or (
        organization_id is not null
        and app_private.is_org_admin(organization_id)
    )
    or app_private.has_any_role(array['editor', 'analyst', 'admin'])
);

drop policy if exists "experimental_test_data_uploads_insert_paid_owner"
on public.experimental_test_data_uploads;
create policy "experimental_test_data_uploads_insert_paid_owner"
on public.experimental_test_data_uploads
for insert
to authenticated
with check (
    user_id = auth.uid()
    and app_private.has_any_role(
        array['scout', 'command_user', 'editor', 'analyst', 'admin']
    )
    and (
        organization_id is null
        or app_private.is_org_member(organization_id)
        or app_private.has_role('admin')
    )
);

drop policy if exists "experimental_test_data_uploads_update_staff"
on public.experimental_test_data_uploads;
create policy "experimental_test_data_uploads_update_staff"
on public.experimental_test_data_uploads
for update
to authenticated
using (app_private.has_any_role(array['analyst', 'admin']))
with check (app_private.has_any_role(array['analyst', 'admin']));

drop policy if exists "experimental_test_data_uploads_delete_staff"
on public.experimental_test_data_uploads;
create policy "experimental_test_data_uploads_delete_staff"
on public.experimental_test_data_uploads
for delete
to authenticated
using (app_private.has_role('admin'));

drop policy if exists "experimental_test_data_objects_select_owner_org_staff"
on storage.objects;
create policy "experimental_test_data_objects_select_owner_org_staff"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'experimental-test-data'
    and (
        (storage.foldername(name))[1] = auth.uid()::text
        or exists (
            select 1
            from public.experimental_test_data_uploads upload
            where upload.storage_bucket = storage.objects.bucket_id
                and upload.storage_object_path = storage.objects.name
                and upload.organization_id is not null
                and app_private.is_org_admin(upload.organization_id)
        )
        or app_private.has_any_role(array['editor', 'analyst', 'admin'])
    )
);

drop policy if exists "experimental_test_data_objects_insert_paid_owner"
on storage.objects;
create policy "experimental_test_data_objects_insert_paid_owner"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'experimental-test-data'
    and (storage.foldername(name))[1] = auth.uid()::text
    and app_private.has_any_role(
        array['scout', 'command_user', 'editor', 'analyst', 'admin']
    )
);
