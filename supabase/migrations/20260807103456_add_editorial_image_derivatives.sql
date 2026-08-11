alter table public.editorial_media_assets
    add column if not exists original_storage_object_path text,
    add column if not exists thumbnail_storage_object_path text,
    add column if not exists thumbnail_url text,
    add column if not exists pixel_width integer,
    add column if not exists pixel_height integer,
    add column if not exists original_size_bytes bigint,
    add column if not exists is_optimized boolean not null default false;

alter table public.editorial_media_assets
    add constraint editorial_media_assets_pixel_width_check
        check (pixel_width is null or pixel_width > 0),
    add constraint editorial_media_assets_pixel_height_check
        check (pixel_height is null or pixel_height > 0),
    add constraint editorial_media_assets_original_size_check
        check (original_size_bytes is null or original_size_bytes > 0);

alter table public.editorial_articles
    add column if not exists hero_thumbnail_url text;

update public.editorial_articles
set hero_thumbnail_url = hero_image_url
where hero_thumbnail_url is null
  and hero_image_url is not null;

drop policy if exists "editorial_media_storage_select" on storage.objects;
create policy "editorial_media_storage_select"
on storage.objects for select
to anon, authenticated
using (
    bucket_id = 'editorial-media'
    and (
        app_private.has_any_role(array['editor', 'admin'])
        or exists (
            select 1
            from public.editorial_media_assets asset
            join public.editorial_articles article on article.id = asset.article_id
            where asset.storage_bucket = storage.objects.bucket_id
              and storage.objects.name in (
                  asset.storage_object_path,
                  asset.thumbnail_storage_object_path
              )
              and article.status = 'published'
              and article.published_at <= now()
        )
    )
);

comment on column public.editorial_media_assets.storage_object_path is
    'Article-display media object. Images uploaded after this migration are bounded to 1600px.';
comment on column public.editorial_media_assets.thumbnail_storage_object_path is
    'Optional 640px listing derivative for homepage, carousel, archive, and author cards.';
comment on column public.editorial_media_assets.original_storage_object_path is
    'Private original upload retained for editorial reuse and never served by the public media route.';
comment on column public.editorial_articles.hero_thumbnail_url is
    'Listing-safe derivative for the selected hero image; falls back to hero_image_url for legacy records.';
