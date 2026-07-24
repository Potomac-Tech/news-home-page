create or replace function public.enqueue_launch_library_request(p_url text)
returns bigint
language plpgsql
security definer
set search_path = public, net, pg_temp
as $$
begin
    if p_url !~ '^https://ll\.thespacedevs\.com/2\.3\.0/launches/upcoming/\?' then
        raise exception 'Launch Library URL is not permitted';
    end if;

    return net.http_get(
        url := p_url,
        headers := jsonb_build_object(
            'Accept', 'application/json',
            'User-Agent', 'CabeusExplorer/1.0 info@potomacdb.com'
        ),
        timeout_milliseconds := 20000
    );
end;
$$;

create or replace function public.read_launch_library_response(p_request_id bigint)
returns table(status_code integer, content text, error_msg text)
language sql
security definer
set search_path = public, net, pg_temp
as $$
    select response.status_code, response.content, response.error_msg
    from net._http_response response
    where response.id = p_request_id;
$$;

revoke all on function public.enqueue_launch_library_request(text) from public, anon, authenticated;
revoke all on function public.read_launch_library_response(bigint) from public, anon, authenticated;
grant execute on function public.enqueue_launch_library_request(text) to service_role;
grant execute on function public.read_launch_library_response(bigint) to service_role;

comment on function public.enqueue_launch_library_request(text) is
    'Queues the approved Launch Library 2 endpoint through Supabase pg_net when the application egress is rate limited.';
comment on function public.read_launch_library_response(bigint) is
    'Returns a queued Launch Library 2 response to the service-role ingestion worker.';
