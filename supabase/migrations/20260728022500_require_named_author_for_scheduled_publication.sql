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
      and scheduled_for <= now()
      and primary_author_id is not null;

    get diagnostics published_count = row_count;
    return published_count;
end;
$$;

revoke all on function public.publish_due_editorial_articles() from public;
grant execute on function public.publish_due_editorial_articles() to postgres;
