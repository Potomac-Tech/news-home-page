create table if not exists private.resend_send_rate_windows (
    window_started_at timestamptz primary key,
    send_count integer not null default 0 check (send_count >= 0)
);

alter table private.resend_send_rate_windows enable row level security;
revoke all on table private.resend_send_rate_windows from public, anon, authenticated;
grant all on table private.resend_send_rate_windows to service_role;

create or replace function private.claim_resend_send_rate()
returns table (allowed boolean, retry_at timestamptz)
language plpgsql
set search_path = private, public, pg_temp
as $$
declare
    v_config private.resend_free_plan_config%rowtype;
    v_window timestamptz := date_trunc('second', now());
    v_count integer;
begin
    perform pg_advisory_xact_lock(hashtextextended('resend-free-rate:' || v_window::text, 0));
    select * into v_config from private.resend_free_plan_config where id = true;

    if not found or v_config.plan <> 'free' then
        return query select false, null::timestamptz;
        return;
    end if;

    insert into private.resend_send_rate_windows (window_started_at)
    values (v_window)
    on conflict do nothing;

    select send_count into v_count
    from private.resend_send_rate_windows
    where window_started_at = v_window
    for update;

    if v_count >= v_config.max_sends_per_second then
        return query select false, v_window + interval '1 second';
        return;
    end if;

    update private.resend_send_rate_windows
    set send_count = send_count + 1
    where window_started_at = v_window;

    delete from private.resend_send_rate_windows
    where window_started_at < date_trunc('second', now()) - interval '2 minutes';

    return query select true, null::timestamptz;
end;
$$;

revoke all on function private.claim_resend_send_rate() from public, anon, authenticated;
grant execute on function private.claim_resend_send_rate() to service_role;
