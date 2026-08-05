-- Task 120: approve the narrow launch inventory and remove unapproved placeholders.
do $$
declare
    approver_id uuid;
    approved_at timestamptz := '2026-07-24 01:47:52+00'::timestamptz;
    changed_count integer;
begin
    select users.id
    into approver_id
    from auth.users users
    join public.member_role_assignments assignment
      on assignment.user_id = users.id
     and assignment.role_id in ('editor', 'admin')
     and (assignment.expires_at is null or assignment.expires_at > approved_at)
    where lower(users.email) = 'jake@potomacdb.com'
    order by assignment.granted_at desc
    limit 1;

    if approver_id is null then
        raise exception 'Launch inventory approver jake@potomacdb.com is not an active editor or admin';
    end if;

    update public.editorial_articles
    set updated_by = approver_id,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
            'launch_inventory',
            jsonb_build_object(
                'selected', true,
                'content_owner', 'Jacob Matthews',
                'approved_by_email', 'jake@potomacdb.com',
                'approved_by_user_id', approver_id,
                'approved_at', approved_at,
                'reviewed_at', approved_at,
                'audience_tier', 'explorer',
                'confidence', 'source_attributed',
                'expiration_policy', 'evergreen_until_editorial_review'
            )
        )
    where slug in (
        'space-collar-workforce-lunar-economy',
        'clps-2-lunar-logistics-market',
        'crewed-lunar-rover-surface-mobility-market',
        'artemis-iii-crew-integration-schedule'
    )
      and status = 'published';

    get diagnostics changed_count = row_count;
    if changed_count <> 4 then
        raise exception 'Expected 4 approved editorial launch records, found %', changed_count;
    end if;

    if exists (
        select 1
        from public.editorial_articles article
        where article.slug in (
            'space-collar-workforce-lunar-economy',
            'clps-2-lunar-logistics-market',
            'crewed-lunar-rover-surface-mobility-market',
            'artemis-iii-crew-integration-schedule'
        )
          and not exists (
              select 1
              from public.editorial_article_citations citation
              where citation.article_id = article.id
                and citation.url is not null
          )
    ) then
        raise exception 'Every launch article must have a linked citation';
    end if;

    update public.dataset_catalog_entries
    set updated_by = approver_id,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
            'launch_inventory',
            jsonb_build_object(
                'selected', true,
                'content_owner', 'Jacob Matthews',
                'approved_by_email', 'jake@potomacdb.com',
                'approved_by_user_id', approver_id,
                'approved_at', approved_at,
                'reviewed_at', approved_at,
                'audience_tier', 'public',
                'confidence', 'high',
                'expiration_policy', 'review_when_source_or-license_changes'
            )
        )
    where slug in (
        'nasa-pds-lunar-orbital-data-explorer',
        'nasa-pds-lro-lroc-reduced-data-records',
        'usgs-unified-geologic-map-of-the-moon'
    )
      and publication_status = 'published';

    get diagnostics changed_count = row_count;
    if changed_count <> 3 then
        raise exception 'Expected 3 approved public launch datasets, found %', changed_count;
    end if;

    if exists (
        select 1
        from public.dataset_catalog_entries entry
        where entry.slug in (
            'nasa-pds-lunar-orbital-data-explorer',
            'nasa-pds-lro-lroc-reduced-data-records',
            'usgs-unified-geologic-map-of-the-moon'
        )
          and not exists (
              select 1
              from public.dataset_catalog_sources source
              where source.dataset_id = entry.id
                and source.is_public
                and source.source_url is not null
                and source.retrieved_at is not null
                and source.confidence_label = 'high'
          )
    ) then
        raise exception 'Every launch dataset must have a high-confidence public source';
    end if;

    update public.dataset_catalog_entries
    set publication_status = 'archived',
        updated_by = approver_id,
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
            'launch_inventory',
            jsonb_build_object(
                'selected', false,
                'content_owner', 'Jacob Matthews',
                'approved_by_email', 'jake@potomacdb.com',
                'approved_by_user_id', approver_id,
                'reviewed_at', approved_at,
                'reason', 'Proprietary or derived placeholder is not approved for launch'
            )
        )
    where dataset_kind <> 'public_science'
      and publication_status = 'published';

    get diagnostics changed_count = row_count;
    if changed_count <> 3 then
        raise exception 'Expected 3 proprietary placeholders to be archived, found %', changed_count;
    end if;
end
$$;
