create schema if not exists private;

create table if not exists private.email_verification_resend_rate_limits (
    email_hash text primary key check (email_hash ~ '^[a-f0-9]{64}$'),
    window_started_at timestamptz not null default now(),
    attempt_count integer not null default 0 check (attempt_count >= 0),
    last_requested_at timestamptz not null default now()
);

create table if not exists private.email_verification_resend_events (
    id uuid primary key default gen_random_uuid(),
    email_hash text not null check (email_hash ~ '^[a-f0-9]{64}$'),
    requested_at timestamptz not null default now(),
    completed_at timestamptz,
    outcome text not null check (outcome in ('pending', 'sent', 'failed', 'throttled')),
    failure_reason text,
    constraint email_verification_resend_events_failure_reason_length
        check (failure_reason is null or length(failure_reason) <= 300)
);

create index if not exists email_verification_resend_events_hash_requested_idx
on private.email_verification_resend_events (email_hash, requested_at desc);

alter table private.email_verification_resend_rate_limits enable row level security;
alter table private.email_verification_resend_events enable row level security;

revoke all on schema private from public;
revoke all on private.email_verification_resend_rate_limits from public;
revoke all on private.email_verification_resend_events from public;

create or replace function public.claim_email_verification_resend(
    p_email_hash text
)
returns table (
    event_id uuid,
    is_allowed boolean,
    retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_now timestamptz := now();
    v_rate_limit private.email_verification_resend_rate_limits%rowtype;
    v_event_id uuid;
    v_retry_after_seconds integer := 0;
begin
    if p_email_hash !~ '^[a-f0-9]{64}$' then
        raise exception 'invalid email hash';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_email_hash));

    select *
    into v_rate_limit
    from private.email_verification_resend_rate_limits
    where email_hash = p_email_hash
    for update;

    if not found then
        insert into private.email_verification_resend_rate_limits (
            email_hash,
            window_started_at,
            attempt_count,
            last_requested_at
        ) values (
            p_email_hash,
            v_now,
            1,
            v_now
        );
    elsif v_rate_limit.last_requested_at > v_now - interval '1 minute' then
        v_retry_after_seconds := greatest(
            1,
            ceil(extract(epoch from (
                v_rate_limit.last_requested_at + interval '1 minute' - v_now
            )))::integer
        );

        insert into private.email_verification_resend_events (
            email_hash,
            outcome,
            failure_reason
        ) values (
            p_email_hash,
            'throttled',
            'per-minute resend limit'
        )
        returning id into v_event_id;

        return query select v_event_id, false, v_retry_after_seconds;
        return;
    elsif v_rate_limit.window_started_at <= v_now - interval '1 hour' then
        update private.email_verification_resend_rate_limits
        set window_started_at = v_now,
            attempt_count = 1,
            last_requested_at = v_now
        where email_hash = p_email_hash;
    elsif v_rate_limit.attempt_count >= 5 then
        v_retry_after_seconds := greatest(
            1,
            ceil(extract(epoch from (
                v_rate_limit.window_started_at + interval '1 hour' - v_now
            )))::integer
        );

        insert into private.email_verification_resend_events (
            email_hash,
            outcome,
            failure_reason
        ) values (
            p_email_hash,
            'throttled',
            'hourly resend limit'
        )
        returning id into v_event_id;

        return query select v_event_id, false, v_retry_after_seconds;
        return;
    else
        update private.email_verification_resend_rate_limits
        set attempt_count = v_rate_limit.attempt_count + 1,
            last_requested_at = v_now
        where email_hash = p_email_hash;
    end if;

    insert into private.email_verification_resend_events (
        email_hash,
        outcome
    ) values (
        p_email_hash,
        'pending'
    )
    returning id into v_event_id;

    return query select v_event_id, true, 0;
end;
$$;

create or replace function public.complete_email_verification_resend(
    p_event_id uuid,
    p_email_hash text,
    p_outcome text,
    p_failure_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if p_email_hash !~ '^[a-f0-9]{64}$' then
        raise exception 'invalid email hash';
    end if;

    if p_outcome not in ('sent', 'failed') then
        raise exception 'invalid resend outcome';
    end if;

    update private.email_verification_resend_events
    set outcome = p_outcome,
        completed_at = now(),
        failure_reason = case
            when p_outcome = 'failed' then left(coalesce(p_failure_reason, 'Supabase Auth resend failed'), 300)
            else null
        end
    where id = p_event_id
      and email_hash = p_email_hash
      and outcome = 'pending';

    if not found then
        raise exception 'verification resend event not found';
    end if;
end;
$$;

revoke all on function public.claim_email_verification_resend(text) from public;
revoke all on function public.complete_email_verification_resend(uuid, text, text, text) from public;
grant execute on function public.claim_email_verification_resend(text) to anon, authenticated;
grant execute on function public.complete_email_verification_resend(uuid, text, text, text) to anon, authenticated;
