create or replace function public.get_homepage_launch_summary(p_week_start date)
returns table (reviewed_count bigint, lunar_cislunar_count bigint, source_freshness_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
    select count(*)::bigint,
        count(*) filter (where entry.is_lunar_or_cislunar)::bigint,
        max(entry.source_checked_at)
    from public.weekly_lunar_tracker_entries entry
    join public.intelligence_data_sources source on source.id = entry.primary_source_id
    where entry.week_start_local = p_week_start
      and entry.publication_status = 'published'
      and source.license_status = 'approved'
      and source.analyst_review_state = 'approved'
      and source.publication_status = 'published';
$$;
revoke all on function public.get_homepage_launch_summary(date) from public;
grant execute on function public.get_homepage_launch_summary(date) to anon, authenticated;
