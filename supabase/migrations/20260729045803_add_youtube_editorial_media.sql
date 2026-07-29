alter table public.editorial_media_assets
    add column if not exists hosting_provider text not null default 'supabase',
    add column if not exists external_video_id text,
    add column if not exists source_url text;

alter table public.editorial_media_assets
    alter column storage_bucket drop not null,
    alter column storage_object_path drop not null,
    alter column original_file_name drop not null,
    alter column mime_type drop not null,
    alter column size_bytes drop not null;

alter table public.editorial_media_assets
    drop constraint if exists editorial_media_assets_hosting_provider_check,
    add constraint editorial_media_assets_hosting_provider_check
        check (hosting_provider in ('supabase', 'youtube')),
    drop constraint if exists editorial_media_assets_provider_fields_check,
    add constraint editorial_media_assets_provider_fields_check
        check (
            (
                hosting_provider = 'supabase'
                and storage_bucket = 'editorial-media'
                and storage_object_path is not null
                and original_file_name is not null
                and mime_type is not null
                and size_bytes is not null
                and external_video_id is null
            )
            or
            (
                hosting_provider = 'youtube'
                and media_type = 'video'
                and storage_bucket is null
                and storage_object_path is null
                and original_file_name is null
                and mime_type is null
                and size_bytes is null
                and external_video_id ~ '^[A-Za-z0-9_-]{11}$'
                and source_url = 'https://www.youtube.com/watch?v=' || external_video_id
                and public_url = 'https://www.youtube-nocookie.com/embed/' || external_video_id || '?rel=0'
            )
        );

create unique index if not exists editorial_media_assets_article_youtube_unique
on public.editorial_media_assets (article_id, external_video_id)
where hosting_provider = 'youtube';

comment on column public.editorial_media_assets.hosting_provider is
    'Media delivery provider. YouTube rows store only canonical video metadata and no Storage object.';

comment on column public.editorial_media_assets.external_video_id is
    'Validated 11-character YouTube video ID for externally hosted story video.';

comment on column public.editorial_media_assets.source_url is
    'Canonical editor-facing source URL. YouTube playback uses the privacy-enhanced public_url embed.';
