drop policy if exists "lunar_economy_model_versions_select_paid"
on public.lunar_economy_model_versions;
create policy "lunar_economy_model_versions_select_paid"
on public.lunar_economy_model_versions
for select
to authenticated
using (
    app_private.has_any_role(array['scout', 'command_user'])
    and status = 'active'
    and valid_from <= current_date
    and (valid_to is null or valid_to >= current_date)
    and (published_at is null or published_at <= now())
);

drop policy if exists "lunar_economy_model_assumptions_select_paid"
on public.lunar_economy_model_assumptions;
create policy "lunar_economy_model_assumptions_select_paid"
on public.lunar_economy_model_assumptions
for select
to authenticated
using (
    app_private.has_any_role(array['scout', 'command_user'])
    and exists (
        select 1
        from public.lunar_economy_model_versions model_version
        where model_version.id =
            lunar_economy_model_assumptions.model_version_id
            and model_version.status = 'active'
            and model_version.valid_from <= current_date
            and (
                model_version.valid_to is null
                or model_version.valid_to >= current_date
            )
            and (
                model_version.published_at is null
                or model_version.published_at <= now()
            )
    )
);

drop policy if exists "lunar_economy_source_documents_select_paid"
on public.lunar_economy_source_documents;
create policy "lunar_economy_source_documents_select_paid"
on public.lunar_economy_source_documents
for select
to authenticated
using (
    app_private.has_any_role(array['scout', 'command_user'])
    and review_status = 'approved'
    and exists (
        select 1
        from public.lunar_economy_model_versions model_version
        where model_version.id =
            lunar_economy_source_documents.model_version_id
            and model_version.status = 'active'
            and model_version.valid_from <= current_date
            and (
                model_version.valid_to is null
                or model_version.valid_to >= current_date
            )
            and (
                model_version.published_at is null
                or model_version.published_at <= now()
            )
    )
);

drop policy if exists "lunar_economy_assumption_sources_select_paid"
on public.lunar_economy_assumption_sources;
create policy "lunar_economy_assumption_sources_select_paid"
on public.lunar_economy_assumption_sources
for select
to authenticated
using (
    app_private.has_any_role(array['scout', 'command_user'])
    and exists (
        select 1
        from public.lunar_economy_model_assumptions assumption
        join public.lunar_economy_source_documents source_document
            on source_document.id =
                lunar_economy_assumption_sources.source_document_id
        join public.lunar_economy_model_versions model_version
            on model_version.id = assumption.model_version_id
        where assumption.id =
            lunar_economy_assumption_sources.assumption_id
            and source_document.model_version_id = model_version.id
            and source_document.review_status = 'approved'
            and model_version.status = 'active'
            and model_version.valid_from <= current_date
            and (
                model_version.valid_to is null
                or model_version.valid_to >= current_date
            )
            and (
                model_version.published_at is null
                or model_version.published_at <= now()
            )
    )
);

drop policy if exists "lunar_economy_scenario_estimates_select_paid"
on public.lunar_economy_scenario_estimates;
create policy "lunar_economy_scenario_estimates_select_paid"
on public.lunar_economy_scenario_estimates
for select
to authenticated
using (
    app_private.has_any_role(array['scout', 'command_user'])
    and publication_status = 'published'
    and estimate_date <= current_date
    and exists (
        select 1
        from public.lunar_economy_model_versions model_version
        where model_version.id =
            lunar_economy_scenario_estimates.model_version_id
            and model_version.status = 'active'
            and model_version.valid_from <= current_date
            and (
                model_version.valid_to is null
                or model_version.valid_to >= current_date
            )
            and (
                model_version.published_at is null
                or model_version.published_at <= now()
            )
    )
);

drop policy if exists "lunar_economy_daily_outputs_select_paid"
on public.lunar_economy_daily_outputs;
create policy "lunar_economy_daily_outputs_select_paid"
on public.lunar_economy_daily_outputs
for select
to authenticated
using (
    app_private.has_any_role(array['scout', 'command_user'])
    and publication_status = 'published'
    and output_date <= current_date
    and exists (
        select 1
        from public.lunar_economy_model_versions model_version
        where model_version.id =
            lunar_economy_daily_outputs.model_version_id
            and model_version.status = 'active'
            and model_version.valid_from <= current_date
            and (
                model_version.valid_to is null
                or model_version.valid_to >= current_date
            )
            and (
                model_version.published_at is null
                or model_version.published_at <= now()
            )
    )
);
