-- Restore public and member search after the Command-to-Meridian tier rename.
create or replace function app_private.can_read_intelligence_search(
    target_tier public.intelligence_search_visibility_tier
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select target_tier = 'public'
        or (
            target_tier = 'explorer'
            and app_private.has_any_role(array[
                'explorer',
                'scout',
                'meridian',
                'editor',
                'analyst',
                'admin'
            ])
        )
        or (
            target_tier = 'scout'
            and app_private.has_any_role(array[
                'scout',
                'meridian',
                'editor',
                'analyst',
                'admin'
            ])
        )
        or (
            target_tier = 'meridian'
            and app_private.has_any_role(array[
                'meridian',
                'editor',
                'analyst',
                'admin'
            ])
        )
        or (
            target_tier = 'staff'
            and app_private.has_any_role(array['editor', 'analyst', 'admin'])
        );
$$;

revoke all on function app_private.can_read_intelligence_search(
    public.intelligence_search_visibility_tier
) from public;
grant execute on function app_private.can_read_intelligence_search(
    public.intelligence_search_visibility_tier
) to anon, authenticated;

do $$
begin
    if pg_get_functiondef(
        'app_private.can_read_intelligence_search(public.intelligence_search_visibility_tier)'::regprocedure
    ) like '%target_tier = ''command''%' then
        raise exception 'Search visibility still references the retired Command tier';
    end if;
end
$$;
