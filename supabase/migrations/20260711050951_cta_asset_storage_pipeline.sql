insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'cta-assets',
    'cta-assets',
    false,
    8388608,
    array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.cta_assets (
    id uuid primary key default gen_random_uuid(),
    product text not null check (product in ('pathfinder', 'source')),
    display_name text not null check (length(trim(display_name)) > 0),
    storage_bucket text not null default 'cta-assets'
        check (storage_bucket = 'cta-assets'),
    storage_object_path text,
    repo_fallback_url text,
    mime_type text not null
        check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
    file_size_bytes bigint not null
        check (file_size_bytes > 0 and file_size_bytes <= 8388608),
    width_px integer not null check (width_px >= 640 and width_px <= 8000),
    height_px integer not null check (height_px >= 360 and height_px <= 8000),
    alt_text text not null check (length(trim(alt_text)) >= 12),
    attribution_note text not null check (length(trim(attribution_note)) > 0),
    review_status text not null default 'draft'
        check (review_status in ('draft', 'reviewed', 'rejected', 'archived')),
    reviewed_by uuid references auth.users(id) on delete set null,
    reviewed_at timestamptz,
    expires_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint cta_assets_source_required check (
        storage_object_path is not null or repo_fallback_url is not null
    ),
    constraint cta_assets_review_fields check (
        review_status <> 'reviewed'
        or (reviewed_by is not null and reviewed_at is not null)
        or repo_fallback_url is not null
    ),
    constraint cta_assets_expiration_future check (
        expires_at is null or expires_at > created_at
    )
);

create unique index if not exists cta_assets_storage_object_key
on public.cta_assets (storage_bucket, storage_object_path)
where storage_object_path is not null;

create index if not exists cta_assets_product_review_idx
on public.cta_assets (product, review_status, expires_at);

drop trigger if exists set_cta_assets_updated_at on public.cta_assets;
create trigger set_cta_assets_updated_at
before update on public.cta_assets
for each row execute function public.set_updated_at();

alter table public.cta_assets enable row level security;

drop policy if exists "Public can read live reviewed CTA assets"
on public.cta_assets;
create policy "Public can read live reviewed CTA assets"
on public.cta_assets
for select
to anon, authenticated
using (
    review_status = 'reviewed'
    and (expires_at is null or expires_at > now())
);

drop policy if exists "Sponsor staff manage CTA assets"
on public.cta_assets;
create policy "Sponsor staff manage CTA assets"
on public.cta_assets
for all
to authenticated
using (
    exists (
        select 1
        from public.member_role_assignments role_assignment
        where role_assignment.user_id = (select auth.uid())
          and role_assignment.role_id in ('editor', 'admin')
          and (
              role_assignment.expires_at is null
              or role_assignment.expires_at > now()
          )
    )
)
with check (
    exists (
        select 1
        from public.member_role_assignments role_assignment
        where role_assignment.user_id = (select auth.uid())
          and role_assignment.role_id in ('editor', 'admin')
          and (
              role_assignment.expires_at is null
              or role_assignment.expires_at > now()
          )
    )
);

drop policy if exists "Public can read reviewed CTA image objects"
on storage.objects;
create policy "Public can read reviewed CTA image objects"
on storage.objects
for select
to anon, authenticated
using (
    bucket_id = 'cta-assets'
    and exists (
        select 1
        from public.cta_assets asset
        where asset.storage_bucket = storage.objects.bucket_id
          and asset.storage_object_path = storage.objects.name
          and asset.review_status = 'reviewed'
          and (asset.expires_at is null or asset.expires_at > now())
    )
);

drop policy if exists "Sponsor staff upload CTA image objects"
on storage.objects;
create policy "Sponsor staff upload CTA image objects"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'cta-assets'
    and (storage.foldername(name))[1] in ('pathfinder', 'source')
    and exists (
        select 1
        from public.member_role_assignments role_assignment
        where role_assignment.user_id = (select auth.uid())
          and role_assignment.role_id in ('editor', 'admin')
          and (
              role_assignment.expires_at is null
              or role_assignment.expires_at > now()
          )
    )
);

drop policy if exists "Sponsor staff update CTA image objects"
on storage.objects;
create policy "Sponsor staff update CTA image objects"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'cta-assets'
    and exists (
        select 1
        from public.member_role_assignments role_assignment
        where role_assignment.user_id = (select auth.uid())
          and role_assignment.role_id in ('editor', 'admin')
    )
)
with check (bucket_id = 'cta-assets');

drop policy if exists "Sponsor staff delete CTA image objects"
on storage.objects;
create policy "Sponsor staff delete CTA image objects"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'cta-assets'
    and exists (
        select 1
        from public.member_role_assignments role_assignment
        where role_assignment.user_id = (select auth.uid())
          and role_assignment.role_id in ('editor', 'admin')
    )
);

insert into public.cta_assets (
    id,
    product,
    display_name,
    repo_fallback_url,
    mime_type,
    file_size_bytes,
    width_px,
    height_px,
    alt_text,
    attribution_note,
    review_status,
    reviewed_at
)
values
    (
        '7b6f0b91-6b30-4bf1-a478-0daf6fcf1b2c',
        'pathfinder',
        'Pathfinder hardware rendering',
        '/hardware-pathfinder-05122026.png',
        'image/png',
        2688999,
        1448,
        1086,
        'Potomac Pathfinder lunar hardware planning rendering',
        'CEO-provided production asset retained as a reviewed repository fallback.',
        'reviewed',
        now()
    ),
    (
        'e5ee5ae4-2480-4edf-93a9-c75e6d73a25c',
        'source',
        'Source hardware rendering',
        '/hardware-source-10162025.png',
        'image/png',
        1889869,
        1024,
        919,
        'Potomac Source lunar data collection hardware rendering',
        'CEO-provided production asset retained as a reviewed repository fallback.',
        'reviewed',
        now()
    ),
    (
        'ac8ce50e-5acc-422c-a7c9-8df785514e57',
        'source',
        'Source mission rendering',
        '/Source Rendering.png',
        'image/png',
        6415416,
        2080,
        1811,
        'Potomac Source mission and lunar data hardware rendering',
        'CEO-provided production asset retained as a reviewed repository fallback.',
        'reviewed',
        now()
    )
on conflict (id) do update set
    repo_fallback_url = excluded.repo_fallback_url,
    file_size_bytes = excluded.file_size_bytes,
    width_px = excluded.width_px,
    height_px = excluded.height_px,
    alt_text = excluded.alt_text,
    attribution_note = excluded.attribution_note,
    review_status = excluded.review_status,
    reviewed_at = excluded.reviewed_at;

grant select on public.cta_assets to anon, authenticated;
grant insert, update, delete on public.cta_assets to authenticated;
