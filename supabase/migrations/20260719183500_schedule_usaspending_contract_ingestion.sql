create or replace function private.invoke_production_tracker_ingestion(p_job text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_url text;
    v_secret text;
    v_request_id bigint;
begin
    if p_job not in ('launches', 'space-weather', 'contract-awards') then
        raise exception 'unsupported tracker ingestion job';
    end if;

    select decrypted_secret into v_url
    from vault.decrypted_secrets
    where name = 'production_tracker_ingestion_url';

    select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'production_tracker_ingestion_secret';

    if v_url is null or v_secret is null then
        return null;
    end if;

    select net.http_post(
        url := v_url,
        headers := jsonb_build_object(
            'authorization', 'Bearer ' || v_secret,
            'content-type', 'application/json'
        ),
        body := jsonb_build_object('job', p_job),
        timeout_milliseconds := 55000
    ) into v_request_id;

    return v_request_id;
end;
$$;

revoke all on function private.invoke_production_tracker_ingestion(text) from public;
grant execute on function private.invoke_production_tracker_ingestion(text) to service_role;

do $$
declare
    v_job_id bigint;
begin
    select jobid into v_job_id
    from cron.job
    where jobname = 'ingest-usaspending-contract-awards';

    if v_job_id is not null then
        perform cron.unschedule(v_job_id);
    end if;

    perform cron.schedule(
        'ingest-usaspending-contract-awards',
        '23 6 * * *',
        $job$select private.invoke_production_tracker_ingestion('contract-awards');$job$
    );
end;
$$;
