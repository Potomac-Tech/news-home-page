create or replace function private.invoke_alpha_vantage_stock_refresh(p_batch integer)
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
    if p_batch not in (0, 1) then
        raise exception 'unsupported Alpha Vantage batch';
    end if;

    select decrypted_secret into v_url
    from vault.decrypted_secrets
    where name = 'alpha_vantage_ingestion_url';

    select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'alpha_vantage_ingestion_secret';

    if v_url is null or v_secret is null then
        return null;
    end if;

    select net.http_post(
        url := v_url,
        headers := jsonb_build_object(
            'x-ingestion-secret', v_secret,
            'content-type', 'application/json'
        ),
        body := jsonb_build_object('batch', p_batch),
        timeout_milliseconds := 55000
    ) into v_request_id;

    return v_request_id;
end;
$$;

revoke all on function private.invoke_alpha_vantage_stock_refresh(integer) from public;
grant execute on function private.invoke_alpha_vantage_stock_refresh(integer) to service_role;
