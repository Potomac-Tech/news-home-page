do $$
declare
    v_job_id bigint;
begin
    select jobid into v_job_id
    from cron.job
    where jobname = 'ingest-launch-library-2';

    if v_job_id is not null then
        perform cron.unschedule(v_job_id);
    end if;

    perform cron.schedule(
        'ingest-launch-library-2',
        '17 * * * *',
        $job$select private.invoke_production_tracker_ingestion('launches');$job$
    );
end;
$$;
