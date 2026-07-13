create index if not exists contract_award_runs_source_idx on public.contract_award_ingestion_runs (source_registry_id);
create index if not exists contract_awards_reviewed_by_idx on public.contract_awards (reviewed_by) where reviewed_by is not null;
create index if not exists contract_awards_created_by_idx on public.contract_awards (created_by) where created_by is not null;
create index if not exists contract_awards_updated_by_idx on public.contract_awards (updated_by) where updated_by is not null;
create index if not exists contract_award_values_reviewed_by_idx on public.contract_award_values (reviewed_by) where reviewed_by is not null;
create index if not exists contract_award_citations_created_by_idx on public.contract_award_citations (created_by) where created_by is not null;
create index if not exists contract_award_source_checks_source_idx on public.contract_award_source_checks (source_registry_id);
create index if not exists contract_award_reviews_reviewer_idx on public.contract_award_review_decisions (reviewer_user_id);
create index if not exists contract_award_audit_actor_idx on public.contract_award_audit_log (actor_user_id) where actor_user_id is not null;

drop policy if exists "Members read entitled contract awards" on public.contract_awards;
drop policy if exists "Staff manage contract awards" on public.contract_awards;
create policy "Authenticated read entitled or staff contract awards" on public.contract_awards for select to authenticated
using (
    (publication_status = 'published' and is_space_or_lunar_relevant and (select app_private.can_read_tracker_tier(tier_visibility)))
    or (select app_private.has_any_role(array['editor','analyst','admin']))
);
create policy "Staff insert contract awards" on public.contract_awards for insert to authenticated
with check ((select app_private.has_any_role(array['editor','analyst','admin'])));
create policy "Staff update contract awards" on public.contract_awards for update to authenticated
using ((select app_private.has_any_role(array['editor','analyst','admin'])))
with check ((select app_private.has_any_role(array['editor','analyst','admin'])));
create policy "Staff delete contract awards" on public.contract_awards for delete to authenticated
using ((select app_private.has_any_role(array['editor','analyst','admin'])));

drop policy if exists "Members read entitled contract values" on public.contract_award_values;
drop policy if exists "Staff manage contract award values" on public.contract_award_values;
create policy "Authenticated read entitled or staff contract values" on public.contract_award_values for select to authenticated
using (
    (
        (select app_private.can_read_tracker_tier(value_visibility))
        and exists (
            select 1 from public.contract_awards award
            where award.id = contract_award_id and award.publication_status = 'published'
              and award.is_space_or_lunar_relevant and (select app_private.can_read_tracker_tier(award.tier_visibility))
        )
    ) or (select app_private.has_any_role(array['editor','analyst','admin']))
);
create policy "Staff insert contract award values" on public.contract_award_values for insert to authenticated
with check ((select app_private.has_any_role(array['editor','analyst','admin'])));
create policy "Staff update contract award values" on public.contract_award_values for update to authenticated
using ((select app_private.has_any_role(array['editor','analyst','admin'])))
with check ((select app_private.has_any_role(array['editor','analyst','admin'])));
create policy "Staff delete contract award values" on public.contract_award_values for delete to authenticated
using ((select app_private.has_any_role(array['editor','analyst','admin'])));

drop policy if exists "Members read citations for entitled contract awards" on public.contract_award_citations;
drop policy if exists "Staff manage contract award citations" on public.contract_award_citations;
create policy "Authenticated read entitled or staff contract citations" on public.contract_award_citations for select to authenticated
using (
    exists (
        select 1 from public.contract_awards award
        where award.id = contract_award_id and award.publication_status = 'published'
          and award.is_space_or_lunar_relevant and (select app_private.can_read_tracker_tier(award.tier_visibility))
    ) or (select app_private.has_any_role(array['editor','analyst','admin']))
);
create policy "Staff insert contract award citations" on public.contract_award_citations for insert to authenticated
with check ((select app_private.has_any_role(array['editor','analyst','admin'])));
create policy "Staff update contract award citations" on public.contract_award_citations for update to authenticated
using ((select app_private.has_any_role(array['editor','analyst','admin'])))
with check ((select app_private.has_any_role(array['editor','analyst','admin'])));
create policy "Staff delete contract award citations" on public.contract_award_citations for delete to authenticated
using ((select app_private.has_any_role(array['editor','analyst','admin'])));

create policy "Editors and admins insert contract award review decisions" on public.contract_award_review_decisions for insert to authenticated
with check (
    reviewer_user_id = (select auth.uid())
    and (select app_private.has_any_role(array['editor','admin']))
);

create or replace function public.review_contract_award(p_award_id uuid, p_decision text, p_note text default null)
returns public.contract_awards language plpgsql security invoker set search_path = public, pg_temp as $$
declare v_award public.contract_awards;
begin
    if not app_private.has_any_role(array['editor','admin']) then raise exception 'editor or admin role required'; end if;
    if p_decision not in ('approved','changes_requested','unpublished') then raise exception 'invalid review decision'; end if;
    if p_decision = 'approved' and not exists (
        select 1 from public.contract_award_citations citation
        join public.intelligence_data_sources source on source.id = citation.source_registry_id
        where citation.contract_award_id = p_award_id and citation.is_primary
          and source.license_status = 'approved' and source.analyst_review_state = 'approved'
          and source.publication_status = 'published'
    ) then raise exception 'approval requires a primary citation from an approved source'; end if;
    update public.contract_awards set
        publication_status = case p_decision when 'approved' then 'published' when 'changes_requested' then 'in_review' else 'archived' end,
        reviewed_by = auth.uid(), reviewed_at = now(), updated_by = auth.uid()
    where id = p_award_id returning * into v_award;
    if v_award.id is null then raise exception 'contract award not found'; end if;
    insert into public.contract_award_review_decisions (contract_award_id, decision, review_note, reviewer_user_id)
    values (p_award_id, p_decision, nullif(trim(p_note), ''), auth.uid());
    return v_award;
end; $$;
revoke all on function public.review_contract_award(uuid,text,text) from public, anon;
grant execute on function public.review_contract_award(uuid,text,text) to authenticated;

