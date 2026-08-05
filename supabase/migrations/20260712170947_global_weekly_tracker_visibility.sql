alter table public.weekly_lunar_tracker_entries
    drop constraint if exists weekly_tracker_published_review;
alter table public.weekly_lunar_tracker_entries
    add constraint weekly_tracker_published_review check (
        publication_status <> 'published'
        or (primary_source_id is not null and last_reviewed_at is not null and reviewed_by is not null)
    );

drop policy if exists "Members read entitled lunar tracker entries" on public.weekly_lunar_tracker_entries;
create policy "Members read entitled lunar tracker entries" on public.weekly_lunar_tracker_entries for select to authenticated
using (publication_status = 'published' and app_private.can_read_tracker_tier(visibility) and exists (
    select 1 from public.intelligence_data_sources source where source.id = primary_source_id
      and source.license_status = 'approved' and source.analyst_review_state = 'approved' and source.publication_status = 'published'
));

drop policy if exists "Members read citations for entitled tracker entries" on public.weekly_lunar_tracker_sources;
create policy "Members read citations for entitled tracker entries" on public.weekly_lunar_tracker_sources for select to authenticated
using (exists (
    select 1 from public.weekly_lunar_tracker_entries entry
    where entry.id = tracker_entry_id and entry.publication_status = 'published'
      and app_private.can_read_tracker_tier(entry.visibility)
));
