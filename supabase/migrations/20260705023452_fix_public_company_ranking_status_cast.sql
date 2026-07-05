create or replace function app_private.create_public_company_top20_ranking(
    target_metric public.public_company_ranking_metric,
    target_ranking_date date,
    source_name text,
    source_url text default null,
    notes text default null,
    publish_snapshot boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, app_private, pg_temp
as $$
declare
    ranking_run_id uuid;
    ranked_count integer;
begin
    if (select auth.role()) <> 'service_role'
        and not app_private.has_any_role(
            array['editor', 'analyst', 'admin']
        )
    then
        raise exception 'Insufficient permission to create company ranking.';
    end if;

    if target_metric is null then
        raise exception 'Ranking metric is required.';
    end if;

    if target_ranking_date is null then
        raise exception 'Ranking date is required.';
    end if;

    if source_name is null or length(trim(source_name)) = 0 then
        raise exception 'Ranking source name is required.';
    end if;

    insert into public.public_space_company_ranking_runs (
        ranking_metric,
        ranking_date,
        source_name,
        source_url,
        publication_status,
        notes,
        generated_by,
        published_at
    )
    values (
        target_metric,
        target_ranking_date,
        trim(source_name),
        nullif(trim(coalesce(source_url, '')), ''),
        (
            case
                when publish_snapshot then 'published'
                else 'draft'
            end
        )::public.public_company_ranking_status,
        nullif(trim(coalesce(notes, '')), ''),
        auth.uid(),
        case when publish_snapshot then now() else null end
    )
    returning id into ranking_run_id;

    insert into public.public_space_company_rankings (
        ranking_run_id,
        company_id,
        rank_number,
        ranking_metric_value,
        metric_as_of_date,
        company_name_snapshot,
        ticker_symbol_snapshot,
        exchange_code_snapshot,
        company_metric_source_name,
        company_metric_source_url
    )
    select
        ranking_run_id,
        ranked.company_id,
        ranked.rank_number,
        ranked.ranking_metric_value,
        ranked.metric_as_of_date,
        ranked.company_name_snapshot,
        ranked.ticker_symbol_snapshot,
        ranked.exchange_code_snapshot,
        ranked.company_metric_source_name,
        ranked.company_metric_source_url
    from (
        select
            company.id as company_id,
            (row_number() over (
                order by
                    company.ranking_metric_value desc,
                    company.company_name asc
            ))::integer as rank_number,
            company.ranking_metric_value,
            company.ranking_metric_as_of_date as metric_as_of_date,
            company.company_name as company_name_snapshot,
            company.ticker_symbol as ticker_symbol_snapshot,
            company.exchange_code as exchange_code_snapshot,
            company.ranking_source_name as company_metric_source_name,
            company.ranking_source_url as company_metric_source_url
        from public.public_space_companies company
        where company.status = 'active'
            and company.ranking_eligible
            and company.ranking_metric = target_metric
            and company.ranking_metric_value is not null
            and company.ranking_metric_as_of_date is not null
        order by
            company.ranking_metric_value desc,
            company.company_name asc
        limit 20
    ) ranked;

    get diagnostics ranked_count = row_count;

    if ranked_count = 0 then
        raise exception
            'No eligible companies with complete metric data were found.';
    end if;

    return ranking_run_id;
end;
$$;

grant execute on function
    app_private.create_public_company_top20_ranking(
        public.public_company_ranking_metric,
        date,
        text,
        text,
        text,
        boolean
    )
to authenticated, service_role;
