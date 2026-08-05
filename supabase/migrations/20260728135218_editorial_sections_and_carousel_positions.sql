alter table public.editorial_articles
    add column if not exists carousel_position smallint;

alter table public.editorial_articles
    drop constraint if exists editorial_articles_carousel_position_check;

alter table public.editorial_articles
    add constraint editorial_articles_carousel_position_check
    check (carousel_position is null or carousel_position between 1 and 5);

create unique index if not exists editorial_articles_carousel_position_key
on public.editorial_articles (carousel_position)
where carousel_position is not null;

insert into public.editorial_tags (name, slug, description)
values
    ('News', 'news', 'General Cabeus Explorer news and intelligence.'),
    ('Space Investment Forum', 'space-investment-forum', 'Reporting and updates from the Space Investment Forum.'),
    ('Space Industrialist Week', 'space-industrialist-week', 'Reporting and updates from Space Industrialist Week.'),
    ('Cabeus Games', 'cabeus-games', 'Reporting and updates from the Cabeus Games.')
on conflict do nothing;

insert into public.editorial_article_tags (article_id, tag_id)
select article.id, news_tag.id
from public.editorial_articles article
cross join public.editorial_tags news_tag
where news_tag.slug = 'news'
  and not exists (
      select 1
      from public.editorial_article_tags article_tag
      join public.editorial_tags tag on tag.id = article_tag.tag_id
      where article_tag.article_id = article.id
        and tag.slug in (
            'news',
            'space-investment-forum',
            'space-industrialist-week',
            'cabeus-games'
        )
  )
on conflict do nothing;

comment on column public.editorial_articles.carousel_position is
    'Optional fixed homepage carousel slot. Null means the article is not placed in the carousel.';

create or replace function public.set_editorial_article_carousel_position(
    p_article_id uuid,
    p_position smallint
)
returns void
language plpgsql
security invoker
set search_path = public, app_private, pg_temp
as $$
begin
    if not app_private.has_any_role(array['editor', 'admin']) then
        raise exception 'editor or admin role required';
    end if;

    if p_position is not null and p_position not between 1 and 5 then
        raise exception 'carousel position must be between 1 and 5';
    end if;

    perform pg_advisory_xact_lock(hashtext('editorial_article_carousel_position'));

    if p_position is not null then
        update public.editorial_articles
        set carousel_position = null,
            updated_by = auth.uid()
        where carousel_position = p_position
          and id <> p_article_id;
    end if;

    update public.editorial_articles
    set carousel_position = p_position,
        updated_by = auth.uid()
    where id = p_article_id;

    if not found then
        raise exception 'article not found';
    end if;
end;
$$;

revoke all on function public.set_editorial_article_carousel_position(uuid, smallint)
from public, anon;
grant execute on function public.set_editorial_article_carousel_position(uuid, smallint)
to authenticated;
