alter table public.weekly_lunar_tracker_values
    add column if not exists editorial_public_disclosure boolean not null default false,
    add column if not exists disclosure_reviewed_by uuid references auth.users(id) on delete set null,
    add column if not exists disclosure_reviewed_at timestamptz;

create index if not exists weekly_tracker_values_disclosure_reviewer_idx on public.weekly_lunar_tracker_values (disclosure_reviewed_by) where disclosure_reviewed_by is not null;

create or replace function public.enforce_weekly_tracker_value_disclosure()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
    if new.value_state = 'analyst_estimate' and new.value_visibility not in ('scout','command') then
        raise exception 'analyst estimates require Scout or Command visibility';
    end if;
    if new.editorial_public_disclosure then
        if new.value_state not in ('exact_cited','cited_range') or new.value_visibility <> 'public'
           or new.disclosure_reviewed_by is null or new.disclosure_reviewed_at is null then
            raise exception 'public disclosure requires a reviewed exact cited value or cited range';
        end if;
        if not exists (select 1 from public.intelligence_data_sources source where source.id = new.source_registry_id and source.license_status = 'approved' and source.analyst_review_state = 'approved' and source.publication_status = 'published') then
            raise exception 'public value disclosure requires an approved source license';
        end if;
    end if;
    return new;
end; $$;
create trigger enforce_weekly_tracker_value_disclosure before insert or update on public.weekly_lunar_tracker_values
for each row execute function public.enforce_weekly_tracker_value_disclosure();

drop policy if exists "Public reads public tracker values" on public.weekly_lunar_tracker_values;
create policy "Public reads public tracker values" on public.weekly_lunar_tracker_values for select to anon
using (value_visibility = 'public' and (value_state in ('unknown','withheld') or (value_state in ('exact_cited','cited_range') and editorial_public_disclosure and exists (
    select 1 from public.intelligence_data_sources source where source.id = source_registry_id and source.license_status = 'approved' and source.analyst_review_state = 'approved' and source.publication_status = 'published'
))) and exists (select 1 from public.weekly_lunar_tracker_entries entry where entry.id = tracker_entry_id and entry.publication_status = 'published' and entry.visibility = 'public'));

drop policy if exists "Members read entitled tracker values" on public.weekly_lunar_tracker_values;
create policy "Members read entitled tracker values" on public.weekly_lunar_tracker_values for select to authenticated
using (exists (select 1 from public.weekly_lunar_tracker_entries entry where entry.id = tracker_entry_id and entry.publication_status = 'published' and app_private.can_read_tracker_tier(entry.visibility)) and (
    (value_state = 'analyst_estimate' and app_private.can_read_tracker_tier('scout'))
    or (value_state in ('exact_cited','cited_range') and app_private.can_read_tracker_tier(value_visibility) and exists (
        select 1 from public.intelligence_data_sources source where source.id = source_registry_id and source.license_status = 'approved' and source.analyst_review_state = 'approved' and source.publication_status = 'published'
    ) and (value_visibility <> 'public' or editorial_public_disclosure))
    or (value_state in ('unknown','withheld') and app_private.can_read_tracker_tier(value_visibility))
));

revoke all on function public.enforce_weekly_tracker_value_disclosure() from public, anon, authenticated;
