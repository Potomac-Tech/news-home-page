create or replace function private.invoke_developer_worker()
returns bigint
language plpgsql
security definer
set search_path = private, vault, net, public, pg_temp
as $$
declare
    worker_url text;
    worker_secret text;
    request_id bigint;
begin
    select decrypted_secret into worker_url
    from vault.decrypted_secrets where name = 'developer_worker_url';
    select decrypted_secret into worker_secret
    from vault.decrypted_secrets where name = 'developer_worker_secret';
    if worker_url is null or worker_secret is null then return null; end if;

    select net.http_post(
        url := worker_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || worker_secret
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 55000
    ) into request_id;
    return request_id;
end;
$$;

revoke all on function private.invoke_developer_worker()
from public, anon, authenticated;

do $$
declare job_id bigint;
begin
    select jobid into job_id from cron.job where jobname = 'process-developer-jobs';
    if job_id is not null then perform cron.unschedule(job_id); end if;
    perform cron.schedule(
        'process-developer-jobs',
        '*/5 * * * *',
        'select private.invoke_developer_worker();'
    );
end $$;
