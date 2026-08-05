insert into public.intelligence_data_sources (
    source_key, source_name, source_owner, owner_kind, primary_url, terms_url,
    license_name, license_status, license_reviewed_at, license_notes,
    refresh_frequency, parser_key, job_name, health_status, stale_after_hours,
    citation_required, citation_format, attribution_text, quality_score,
    confidence_label, analyst_review_state, publication_status, metadata
)
values
    ('launch-library-2', 'Launch Library 2 API', 'The Space Devs', 'nonprofit', 'https://ll.thespacedevs.com/', 'https://github.com/TheSpaceDevs/Tutorials/blob/main/LICENSE', 'Apache-2.0', 'approved', now(), 'API documentation identifies Launch Library 2 as Apache License 2.0. Reconfirm attribution and rate limits before production ingestion.', 'hourly', 'launch_library_2', 'weekly-lunar-launch-ingestion', 'healthy', 6, true, 'Name the source and link the underlying launch record when available.', 'The Space Devs / Launch Library 2', 90, 'high', 'approved', 'published', '{"job_owner":"Potomac Data Operations","use":"primary_schedule_ingestion","review_basis":"published_api_documentation"}'),
    ('nasa-launch-schedule', 'NASA Launch Schedule', 'National Aeronautics and Space Administration', 'government', 'https://www.nasa.gov/event-type/launch-schedule/', 'https://www.nasa.gov/nasa-brand-center/images-and-media/', 'U.S. Government public information; NASA media guidelines apply', 'approved', now(), 'Use factual schedule information and direct citations. NASA insignia, identifiers, and third-party media remain subject to NASA media guidelines.', 'daily', 'nasa_launch_schedule', 'weekly-lunar-source-validation', 'healthy', 24, true, 'Cite the NASA schedule or mission page with retrieval date.', 'NASA', 98, 'high', 'approved', 'published', '{"job_owner":"Potomac Data Operations","use":"official_agency_validation"}'),
    ('nasa-clps', 'NASA Commercial Lunar Payload Services', 'National Aeronautics and Space Administration', 'government', 'https://www.nasa.gov/clps/', 'https://www.nasa.gov/nasa-brand-center/images-and-media/', 'U.S. Government public information; NASA media guidelines apply', 'approved', now(), 'Official customer source for CLPS mission, payload, award, and milestone validation.', 'daily', 'nasa_clps', 'weekly-lunar-source-validation', 'healthy', 48, true, 'Cite the relevant NASA CLPS mission, task-order, or release page.', 'NASA CLPS', 98, 'high', 'approved', 'published', '{"job_owner":"Potomac Data Operations","use":"official_customer_validation"}'),
    ('space-force-news', 'U.S. Space Force News', 'United States Space Force', 'government', 'https://www.spaceforce.mil/News/', 'https://www.spaceforce.mil/Disclaimer/', 'U.S. Government public information; site disclaimer applies', 'approved', now(), 'Use official releases for launch, customer, range, and mission validation; verify third-party imagery separately.', 'daily', 'space_force_news', 'weekly-lunar-source-validation', 'healthy', 48, true, 'Cite the specific official release and publication date.', 'United States Space Force', 96, 'high', 'approved', 'published', '{"job_owner":"Potomac Data Operations","use":"official_customer_and_range_validation"}'),
    ('sam-gov-contract-awards', 'SAM.gov Contract Award Data', 'U.S. General Services Administration', 'government', 'https://sam.gov/fpds', 'https://sam.gov/about/terms-of-use', 'U.S. Government public procurement data; SAM.gov terms apply', 'approved', now(), 'FPDS contract award data is now accessed through SAM.gov. Preserve award identifiers and agency/awardee context.', 'daily', 'sam_gov_awards', 'lunar-value-evidence-ingestion', 'healthy', 48, true, 'Cite the award or opportunity record and preserve its identifier.', 'SAM.gov', 96, 'high', 'approved', 'published', '{"job_owner":"Potomac Data Operations","use":"official_contracting_records"}'),
    ('usaspending-awards-api', 'USAspending Awards API', 'U.S. Department of the Treasury', 'government', 'https://api.usaspending.gov/', 'https://www.usaspending.gov/about', 'Public federal spending data under the DATA Act', 'approved', now(), 'API documentation states public access to federal award data. Use V2 endpoints and retain award IDs.', 'daily', 'usaspending_v2', 'lunar-value-evidence-ingestion', 'healthy', 48, true, 'Cite the USAspending award profile or API record and retrieval date.', 'USAspending.gov', 95, 'high', 'approved', 'published', '{"job_owner":"Potomac Data Operations","use":"award_value_cross_check","api_version":"v2"}'),
    ('sec-edgar-company-filings', 'SEC EDGAR Company Filings and Data APIs', 'U.S. Securities and Exchange Commission', 'government', 'https://www.sec.gov/search-filings/edgar-application-programming-interfaces', 'https://www.sec.gov/about/developer-resources', 'Free public EDGAR data; SEC fair-access policy applies', 'approved', now(), 'Automated requests must use an identified user agent, stay within SEC fair-access limits, and avoid browser-side CORS assumptions.', 'realtime', 'sec_edgar_data', 'lunar-company-value-evidence-ingestion', 'healthy', 24, true, 'Cite the filing, accession number, form, filer, and filing date.', 'U.S. Securities and Exchange Commission EDGAR', 97, 'high', 'approved', 'published', '{"job_owner":"Potomac Data Operations","use":"company_disclosure_and_value_evidence","max_requests_per_second":10}'),
    ('spaceflight-now-schedule', 'Spaceflight Now Launch Schedule', 'Spaceflight Now', 'media', 'https://spaceflightnow.com/launch-schedule/', null, null, 'queued', null, 'Cross-check and citation-only source pending documented terms/license review. Do not use as a publishing primary source.', 'manual', null, 'weekly-lunar-manual-cross-check', 'unknown', 48, true, 'Link the specific schedule or report and identify Spaceflight Now.', 'Spaceflight Now', 75, 'medium', 'in_review', 'draft', '{"job_owner":"Potomac Editorial","use":"schedule_cross_check_only"}'),
    ('next-spaceflight-calendar', 'Next Spaceflight Launch Calendar', 'Next Spaceflight', 'commercial', 'https://nextspaceflight.com/calendar/', null, null, 'queued', null, 'Cross-check and citation-only source pending documented terms/license review. Do not automate or use as a publishing primary source.', 'manual', null, 'weekly-lunar-manual-cross-check', 'unknown', 48, true, 'Link the calendar entry and identify Next Spaceflight.', 'Next Spaceflight', 75, 'medium', 'in_review', 'draft', '{"job_owner":"Potomac Editorial","use":"schedule_cross_check_only"}'),
    ('intuitive-machines-official', 'Intuitive Machines Official News and Investor Relations', 'Intuitive Machines, Inc.', 'commercial', 'https://investors.intuitivemachines.com/news-releases', null, null, 'queued', null, 'Official operator/company source. Citation use is permitted operationally only after terms review; financial claims should be cross-checked with SEC filings.', 'manual', null, 'weekly-lunar-operator-validation', 'unknown', 168, true, 'Cite the specific company release and publication date.', 'Intuitive Machines', 85, 'high', 'in_review', 'draft', '{"job_owner":"Potomac Editorial","use":"official_operator_validation"}'),
    ('firefly-aerospace-official', 'Firefly Aerospace Official News', 'Firefly Aerospace', 'commercial', 'https://fireflyspace.com/news/', null, null, 'queued', null, 'Official operator source pending terms review. Use for mission statements and milestone cross-checks, not as sole value evidence.', 'manual', null, 'weekly-lunar-operator-validation', 'unknown', 168, true, 'Cite the specific Firefly Aerospace release and publication date.', 'Firefly Aerospace', 85, 'high', 'in_review', 'draft', '{"job_owner":"Potomac Editorial","use":"official_operator_validation"}'),
    ('astrobotic-official', 'Astrobotic Official Missions and News', 'Astrobotic Technology, Inc.', 'commercial', 'https://www.astrobotic.com/missions/', null, null, 'queued', null, 'Official operator source pending terms review. Use for mission and payload validation with an approved customer source.', 'manual', null, 'weekly-lunar-operator-validation', 'unknown', 168, true, 'Cite the specific Astrobotic mission or news page and retrieval date.', 'Astrobotic', 85, 'high', 'in_review', 'draft', '{"job_owner":"Potomac Editorial","use":"official_operator_validation"}')
on conflict do nothing;

create or replace function public.enforce_weekly_tracker_approved_sources()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_source_id uuid;
begin
    if tg_table_name = 'weekly_lunar_tracker_entries' then
        if new.publication_status <> 'published' then return new; end if;
        v_source_id := new.primary_source_id;
    elsif tg_table_name = 'weekly_lunar_tracker_sources' then
        if not exists (select 1 from public.weekly_lunar_tracker_entries e where e.id = new.tracker_entry_id and e.publication_status = 'published') then return new; end if;
        v_source_id := new.source_registry_id;
    else
        if not exists (select 1 from public.weekly_lunar_tracker_entries e where e.id = new.tracker_entry_id and e.publication_status = 'published') or new.source_registry_id is null then return new; end if;
        v_source_id := new.source_registry_id;
    end if;
    if not exists (
        select 1 from public.intelligence_data_sources source
        where source.id = v_source_id and source.license_status = 'approved'
          and source.analyst_review_state = 'approved' and source.publication_status = 'published'
    ) then raise exception 'published tracker content requires an approved source registry record'; end if;
    return new;
end; $$;

create trigger enforce_weekly_tracker_entry_source before insert or update on public.weekly_lunar_tracker_entries
for each row execute function public.enforce_weekly_tracker_approved_sources();
create trigger enforce_weekly_tracker_citation_source before insert or update on public.weekly_lunar_tracker_sources
for each row execute function public.enforce_weekly_tracker_approved_sources();
create trigger enforce_weekly_tracker_value_source before insert or update on public.weekly_lunar_tracker_values
for each row execute function public.enforce_weekly_tracker_approved_sources();

drop policy if exists "Public reads published lunar tracker entries" on public.weekly_lunar_tracker_entries;
create policy "Public reads published lunar tracker entries" on public.weekly_lunar_tracker_entries for select to anon
using (publication_status = 'published' and visibility = 'public' and is_lunar_or_cislunar and exists (
    select 1 from public.intelligence_data_sources source where source.id = primary_source_id
      and source.license_status = 'approved' and source.analyst_review_state = 'approved' and source.publication_status = 'published'
));

drop policy if exists "Members read entitled lunar tracker entries" on public.weekly_lunar_tracker_entries;
create policy "Members read entitled lunar tracker entries" on public.weekly_lunar_tracker_entries for select to authenticated
using (publication_status = 'published' and is_lunar_or_cislunar and app_private.can_read_tracker_tier(visibility) and exists (
    select 1 from public.intelligence_data_sources source where source.id = primary_source_id
      and source.license_status = 'approved' and source.analyst_review_state = 'approved' and source.publication_status = 'published'
));

revoke all on function public.enforce_weekly_tracker_approved_sources() from public, anon, authenticated;
