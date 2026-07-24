-- Task 121: record the editor's disposition of the July 24 USAspending queue.
do $$
declare
    approver_id uuid;
    v_reviewed_at timestamptz := '2026-07-24 13:19:46+00'::timestamptz;
    changed_count integer;
begin
    select users.id
    into approver_id
    from auth.users users
    join public.member_role_assignments assignment
      on assignment.user_id = users.id
     and assignment.role_id in ('editor', 'admin')
     and (assignment.expires_at is null or assignment.expires_at > v_reviewed_at)
    where lower(users.email) = 'jake@potomacdb.com'
    order by assignment.granted_at desc
    limit 1;

    if approver_id is null then
        raise exception 'Contract award reviewer jake@potomacdb.com is not an active editor or admin';
    end if;

    update public.contract_awards
    set publication_status = 'archived',
        is_space_or_lunar_relevant = false,
        relevance_scope = 'space',
        relevance_statement = 'Editorial review found no direct space or lunar relevance; Gateway referred to an NIH workforce program.',
        confidence_label = 'official',
        reviewed_by = approver_id,
        reviewed_at = v_reviewed_at,
        updated_by = approver_id
    where external_source_key in (
        '75N98026P01038',
        '75N98026P01039',
        '75N98026P01040',
        '75N98026P01041',
        '75N98026P01042',
        '75N98026P01043'
    )
      and ingestion_run_id = 'ad233f1b-f1cc-44f3-865e-f07b517e7324';

    get diagnostics changed_count = row_count;
    if changed_count <> 6 then
        raise exception 'Expected 6 false-positive awards to archive, found %', changed_count;
    end if;

    insert into public.contract_award_review_decisions (
        contract_award_id,
        decision,
        review_note,
        reviewer_user_id,
        created_at
    )
    select
        award.id,
        'unpublished',
        'No direct space or lunar relevance. The matched Gateway term belongs to an NIH workforce program.',
        approver_id,
        v_reviewed_at
    from public.contract_awards award
    where award.external_source_key in (
        '75N98026P01038',
        '75N98026P01039',
        '75N98026P01040',
        '75N98026P01041',
        '75N98026P01042',
        '75N98026P01043'
    )
      and not exists (
          select 1
          from public.contract_award_review_decisions decision
          where decision.contract_award_id = award.id
            and decision.created_at = v_reviewed_at
      );

    update public.contract_awards
    set publication_status = 'published',
        is_space_or_lunar_relevant = true,
        relevance_scope = 'lunar',
        relevance_statement = case external_source_key
            when '80NSSC26F0067' then 'NASA procurement for suit ancillary hardware supporting Artemis III operations.'
            when '80NSSC26FA573' then 'NASA procurement for analysis workstations supporting Moon-base and Human Landing System site availability.'
        end,
        confidence_label = 'official',
        reviewed_by = approver_id,
        reviewed_at = v_reviewed_at,
        updated_by = approver_id
    where external_source_key in ('80NSSC26F0067', '80NSSC26FA573')
      and ingestion_run_id = 'ad233f1b-f1cc-44f3-865e-f07b517e7324';

    get diagnostics changed_count = row_count;
    if changed_count <> 2 then
        raise exception 'Expected 2 directly lunar awards to publish, found %', changed_count;
    end if;

    insert into public.contract_award_review_decisions (
        contract_award_id,
        decision,
        review_note,
        reviewer_user_id,
        created_at
    )
    select
        award.id,
        'approved',
        'Official NASA award with direct lunar program relevance and a primary USAspending citation.',
        approver_id,
        v_reviewed_at
    from public.contract_awards award
    where award.external_source_key in ('80NSSC26F0067', '80NSSC26FA573')
      and not exists (
          select 1
          from public.contract_award_review_decisions decision
          where decision.contract_award_id = award.id
            and decision.created_at = v_reviewed_at
      );
end
$$;
