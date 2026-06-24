do $$
begin
    create type public.editorial_article_status as enum (
        'draft',
        'in_review',
        'scheduled',
        'published',
        'archived'
    );
exception
    when duplicate_object then null;
end $$;

do $$
begin
    create type public.editorial_citation_type as enum (
        'source',
        'quote',
        'data',
        'background',
        'correction'
    );
exception
    when duplicate_object then null;
end $$;

create table if not exists public.editorial_authors (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    display_name text not null,
    slug text not null,
    title text,
    organization text,
    bio text,
    avatar_url text,
    social_links jsonb not null default '{}'::jsonb,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint editorial_authors_display_name_not_blank check (
        length(trim(display_name)) > 0
    ),
    constraint editorial_authors_slug_not_blank check (
        length(trim(slug)) > 0
    ),
    constraint editorial_authors_social_links_object check (
        jsonb_typeof(social_links) = 'object'
    )
);

create unique index if not exists editorial_authors_slug_key
on public.editorial_authors (lower(slug));

create unique index if not exists editorial_authors_user_key
on public.editorial_authors (user_id)
where user_id is not null;

drop trigger if exists set_editorial_authors_updated_at on public.editorial_authors;
create trigger set_editorial_authors_updated_at
before update on public.editorial_authors
for each row execute function public.set_updated_at();

create table if not exists public.editorial_tags (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint editorial_tags_name_not_blank check (length(trim(name)) > 0),
    constraint editorial_tags_slug_not_blank check (length(trim(slug)) > 0)
);

create unique index if not exists editorial_tags_slug_key
on public.editorial_tags (lower(slug));

drop trigger if exists set_editorial_tags_updated_at on public.editorial_tags;
create trigger set_editorial_tags_updated_at
before update on public.editorial_tags
for each row execute function public.set_updated_at();

create table if not exists public.editorial_articles (
    id uuid primary key default gen_random_uuid(),
    slug text not null,
    status public.editorial_article_status not null default 'draft',
    access_tier_required public.membership_tier not null default 'member',
    title text not null,
    dek text,
    public_summary text not null default '',
    public_teaser_markdown text not null default '',
    public_key_points jsonb not null default '[]'::jsonb,
    intro_markdown text,
    primary_author_id uuid references public.editorial_authors(id) on delete set null,
    seo_title text,
    seo_description text,
    canonical_url text,
    hero_image_url text,
    hero_image_alt text,
    aeo_summary text,
    aeo_questions jsonb not null default '[]'::jsonb,
    metadata jsonb not null default '{}'::jsonb,
    scheduled_for timestamptz,
    published_at timestamptz,
    archived_at timestamptz,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint editorial_articles_slug_not_blank check (length(trim(slug)) > 0),
    constraint editorial_articles_title_not_blank check (length(trim(title)) > 0),
    constraint editorial_articles_public_key_points_array check (
        jsonb_typeof(public_key_points) = 'array'
    ),
    constraint editorial_articles_aeo_questions_array check (
        jsonb_typeof(aeo_questions) = 'array'
    ),
    constraint editorial_articles_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    ),
    constraint editorial_articles_published_has_public_fields check (
        status <> 'published'
        or (
            published_at is not null
            and length(trim(public_summary)) > 0
            and length(trim(public_teaser_markdown)) > 0
        )
    ),
    constraint editorial_articles_scheduled_has_date check (
        status <> 'scheduled'
        or scheduled_for is not null
    )
);

create unique index if not exists editorial_articles_slug_key
on public.editorial_articles (lower(slug));

create index if not exists editorial_articles_status_published_at_idx
on public.editorial_articles (status, published_at desc);

create index if not exists editorial_articles_primary_author_idx
on public.editorial_articles (primary_author_id);

drop trigger if exists set_editorial_articles_updated_at on public.editorial_articles;
create trigger set_editorial_articles_updated_at
before update on public.editorial_articles
for each row execute function public.set_updated_at();

create table if not exists public.editorial_article_bodies (
    article_id uuid primary key references public.editorial_articles(id) on delete cascade,
    body_markdown text not null,
    body_json jsonb not null default '{}'::jsonb,
    body_excerpt text,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint editorial_article_bodies_body_not_blank check (
        length(trim(body_markdown)) > 0
    ),
    constraint editorial_article_bodies_body_json_object check (
        jsonb_typeof(body_json) = 'object'
    )
);

drop trigger if exists set_editorial_article_bodies_updated_at
on public.editorial_article_bodies;
create trigger set_editorial_article_bodies_updated_at
before update on public.editorial_article_bodies
for each row execute function public.set_updated_at();

create table if not exists public.editorial_article_authors (
    article_id uuid not null references public.editorial_articles(id) on delete cascade,
    author_id uuid not null references public.editorial_authors(id) on delete restrict,
    sort_order integer not null default 0,
    role_label text,
    created_at timestamptz not null default now(),
    primary key (article_id, author_id),
    constraint editorial_article_authors_sort_nonnegative check (sort_order >= 0)
);

create index if not exists editorial_article_authors_author_idx
on public.editorial_article_authors (author_id, sort_order);

create table if not exists public.editorial_article_tags (
    article_id uuid not null references public.editorial_articles(id) on delete cascade,
    tag_id uuid not null references public.editorial_tags(id) on delete restrict,
    created_at timestamptz not null default now(),
    primary key (article_id, tag_id)
);

create index if not exists editorial_article_tags_tag_idx
on public.editorial_article_tags (tag_id);

create table if not exists public.editorial_article_versions (
    id uuid primary key default gen_random_uuid(),
    article_id uuid not null references public.editorial_articles(id) on delete cascade,
    version_number integer not null,
    status public.editorial_article_status not null,
    slug text not null,
    title text not null,
    public_summary text not null,
    public_teaser_markdown text not null,
    gated_body_markdown text,
    seo_metadata jsonb not null default '{}'::jsonb,
    aeo_metadata jsonb not null default '{}'::jsonb,
    citation_snapshot jsonb not null default '[]'::jsonb,
    created_by uuid references auth.users(id) on delete set null,
    change_note text,
    created_at timestamptz not null default now(),
    constraint editorial_article_versions_number_positive check (
        version_number > 0
    ),
    constraint editorial_article_versions_slug_not_blank check (
        length(trim(slug)) > 0
    ),
    constraint editorial_article_versions_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint editorial_article_versions_seo_object check (
        jsonb_typeof(seo_metadata) = 'object'
    ),
    constraint editorial_article_versions_aeo_object check (
        jsonb_typeof(aeo_metadata) = 'object'
    ),
    constraint editorial_article_versions_citations_array check (
        jsonb_typeof(citation_snapshot) = 'array'
    )
);

create unique index if not exists editorial_article_versions_article_number_key
on public.editorial_article_versions (article_id, version_number);

create index if not exists editorial_article_versions_article_created_idx
on public.editorial_article_versions (article_id, created_at desc);

create table if not exists public.editorial_article_citations (
    id uuid primary key default gen_random_uuid(),
    article_id uuid not null references public.editorial_articles(id) on delete cascade,
    version_id uuid references public.editorial_article_versions(id) on delete set null,
    citation_type public.editorial_citation_type not null default 'source',
    label text,
    title text not null,
    publisher text,
    author text,
    url text,
    archived_url text,
    published_on date,
    accessed_on date,
    quote text,
    summary text,
    sort_order integer not null default 0,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint editorial_article_citations_title_not_blank check (
        length(trim(title)) > 0
    ),
    constraint editorial_article_citations_sort_nonnegative check (
        sort_order >= 0
    ),
    constraint editorial_article_citations_metadata_object check (
        jsonb_typeof(metadata) = 'object'
    )
);

create index if not exists editorial_article_citations_article_sort_idx
on public.editorial_article_citations (article_id, sort_order);

create index if not exists editorial_article_citations_version_idx
on public.editorial_article_citations (version_id)
where version_id is not null;

drop trigger if exists set_editorial_article_citations_updated_at
on public.editorial_article_citations;
create trigger set_editorial_article_citations_updated_at
before update on public.editorial_article_citations
for each row execute function public.set_updated_at();

alter table public.editorial_authors enable row level security;
alter table public.editorial_tags enable row level security;
alter table public.editorial_articles enable row level security;
alter table public.editorial_article_bodies enable row level security;
alter table public.editorial_article_authors enable row level security;
alter table public.editorial_article_tags enable row level security;
alter table public.editorial_article_versions enable row level security;
alter table public.editorial_article_citations enable row level security;

grant select on
    public.editorial_authors,
    public.editorial_tags,
    public.editorial_articles,
    public.editorial_article_authors,
    public.editorial_article_tags,
    public.editorial_article_citations
to anon, authenticated;

grant select, insert, update, delete on
    public.editorial_authors,
    public.editorial_tags,
    public.editorial_articles,
    public.editorial_article_bodies,
    public.editorial_article_authors,
    public.editorial_article_tags,
    public.editorial_article_versions,
    public.editorial_article_citations
to authenticated;

grant all on
    public.editorial_authors,
    public.editorial_tags,
    public.editorial_articles,
    public.editorial_article_bodies,
    public.editorial_article_authors,
    public.editorial_article_tags,
    public.editorial_article_versions,
    public.editorial_article_citations
to service_role;

drop policy if exists "editorial_authors_select_active" on public.editorial_authors;
create policy "editorial_authors_select_active"
on public.editorial_authors
for select
to anon, authenticated
using (is_active);

drop policy if exists "editorial_authors_select_staff" on public.editorial_authors;
create policy "editorial_authors_select_staff"
on public.editorial_authors
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "editorial_authors_manage_staff" on public.editorial_authors;
create policy "editorial_authors_manage_staff"
on public.editorial_authors
for all
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));

drop policy if exists "editorial_tags_select_all" on public.editorial_tags;
create policy "editorial_tags_select_all"
on public.editorial_tags
for select
to anon, authenticated
using (true);

drop policy if exists "editorial_tags_manage_staff" on public.editorial_tags;
create policy "editorial_tags_manage_staff"
on public.editorial_tags
for all
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));

drop policy if exists "editorial_articles_select_published" on public.editorial_articles;
create policy "editorial_articles_select_published"
on public.editorial_articles
for select
to anon, authenticated
using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
);

drop policy if exists "editorial_articles_select_staff" on public.editorial_articles;
create policy "editorial_articles_select_staff"
on public.editorial_articles
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "editorial_articles_manage_staff" on public.editorial_articles;
create policy "editorial_articles_manage_staff"
on public.editorial_articles
for all
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));

drop policy if exists "editorial_article_bodies_select_entitled"
on public.editorial_article_bodies;
create policy "editorial_article_bodies_select_entitled"
on public.editorial_article_bodies
for select
to authenticated
using (
    app_private.has_any_role(array['editor', 'analyst', 'admin'])
    or exists (
        select 1
        from public.editorial_articles article
        where article.id = editorial_article_bodies.article_id
            and article.status = 'published'
            and article.published_at is not null
            and article.published_at <= now()
            and (
                (
                    article.access_tier_required = 'member'
                    and app_private.has_any_role(
                        array['member', 'scout', 'command_user']
                    )
                )
                or (
                    article.access_tier_required = 'scout'
                    and app_private.has_any_role(
                        array['scout', 'command_user']
                    )
                )
                or (
                    article.access_tier_required = 'command'
                    and app_private.has_any_role(array['command_user'])
                )
            )
    )
);

drop policy if exists "editorial_article_bodies_manage_staff"
on public.editorial_article_bodies;
create policy "editorial_article_bodies_manage_staff"
on public.editorial_article_bodies
for all
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));

drop policy if exists "editorial_article_authors_select_published"
on public.editorial_article_authors;
create policy "editorial_article_authors_select_published"
on public.editorial_article_authors
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.editorial_articles article
        where article.id = editorial_article_authors.article_id
            and article.status = 'published'
            and article.published_at is not null
            and article.published_at <= now()
    )
);

drop policy if exists "editorial_article_authors_select_staff"
on public.editorial_article_authors;
create policy "editorial_article_authors_select_staff"
on public.editorial_article_authors
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "editorial_article_authors_manage_staff"
on public.editorial_article_authors;
create policy "editorial_article_authors_manage_staff"
on public.editorial_article_authors
for all
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));

drop policy if exists "editorial_article_tags_select_published"
on public.editorial_article_tags;
create policy "editorial_article_tags_select_published"
on public.editorial_article_tags
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.editorial_articles article
        where article.id = editorial_article_tags.article_id
            and article.status = 'published'
            and article.published_at is not null
            and article.published_at <= now()
    )
);

drop policy if exists "editorial_article_tags_select_staff"
on public.editorial_article_tags;
create policy "editorial_article_tags_select_staff"
on public.editorial_article_tags
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "editorial_article_tags_manage_staff"
on public.editorial_article_tags;
create policy "editorial_article_tags_manage_staff"
on public.editorial_article_tags
for all
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));

drop policy if exists "editorial_article_versions_select_staff"
on public.editorial_article_versions;
create policy "editorial_article_versions_select_staff"
on public.editorial_article_versions
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "editorial_article_versions_manage_staff"
on public.editorial_article_versions;
create policy "editorial_article_versions_manage_staff"
on public.editorial_article_versions
for all
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));

drop policy if exists "editorial_article_citations_select_published"
on public.editorial_article_citations;
create policy "editorial_article_citations_select_published"
on public.editorial_article_citations
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.editorial_articles article
        where article.id = editorial_article_citations.article_id
            and article.status = 'published'
            and article.published_at is not null
            and article.published_at <= now()
    )
);

drop policy if exists "editorial_article_citations_select_staff"
on public.editorial_article_citations;
create policy "editorial_article_citations_select_staff"
on public.editorial_article_citations
for select
to authenticated
using (app_private.has_any_role(array['editor', 'analyst', 'admin']));

drop policy if exists "editorial_article_citations_manage_staff"
on public.editorial_article_citations;
create policy "editorial_article_citations_manage_staff"
on public.editorial_article_citations
for all
to authenticated
using (app_private.has_any_role(array['editor', 'admin']))
with check (app_private.has_any_role(array['editor', 'admin']));
