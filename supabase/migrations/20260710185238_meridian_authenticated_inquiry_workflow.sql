alter table public.command_interest_requests
    add column if not exists requester_user_id uuid references auth.users(id) on delete set null,
    add column if not exists verified_auth_email text,
    add column if not exists requested_product_label text not null default 'Meridian',
    add column if not exists source_cta text,
    add column if not exists source_content text,
    add column if not exists return_url text,
    add column if not exists attribution jsonb not null default '{}'::jsonb,
    add column if not exists communication_preference text;

create index if not exists command_interest_requester_created_idx
on public.command_interest_requests (requester_user_id, created_at desc)
where requester_user_id is not null;

create table if not exists private.meridian_email_domain_rules (
    domain text primary key,
    decision text not null check (decision in ('deny', 'allow')),
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null,
    note text
);

insert into private.meridian_email_domain_rules (domain, decision, note)
values
    ('gmail.com', 'deny', 'consumer domain'), ('googlemail.com', 'deny', 'consumer domain'),
    ('yahoo.com', 'deny', 'consumer domain'), ('outlook.com', 'deny', 'consumer domain'),
    ('hotmail.com', 'deny', 'consumer domain'), ('live.com', 'deny', 'consumer domain'),
    ('msn.com', 'deny', 'consumer domain'), ('icloud.com', 'deny', 'consumer domain'),
    ('me.com', 'deny', 'consumer domain'), ('aol.com', 'deny', 'consumer domain'),
    ('proton.me', 'deny', 'consumer domain'), ('protonmail.com', 'deny', 'consumer domain'),
    ('pm.me', 'deny', 'consumer domain'), ('fastmail.com', 'deny', 'consumer domain'),
    ('hey.com', 'deny', 'consumer domain')
on conflict (domain) do nothing;

create table if not exists private.meridian_email_validation_audit (
    id uuid primary key default gen_random_uuid(),
    requester_user_id uuid not null references auth.users(id) on delete cascade,
    verified_auth_email text not null,
    business_email text not null,
    domain text not null,
    decision text not null check (decision in ('accepted', 'blocked', 'override')),
    rule_decision text,
    created_at timestamptz not null default now()
);

alter table private.meridian_email_domain_rules enable row level security;
alter table private.meridian_email_validation_audit enable row level security;
revoke all on table private.meridian_email_domain_rules, private.meridian_email_validation_audit from public, anon, authenticated;
grant all on table private.meridian_email_domain_rules, private.meridian_email_validation_audit to service_role;

create or replace function public.submit_meridian_interest(
    p_contact_name text,
    p_business_email text,
    p_organization_name text,
    p_title text,
    p_estimated_seats integer,
    p_use_case text,
    p_source_cta text,
    p_source_content text,
    p_return_url text,
    p_attribution jsonb,
    p_communication_preference text
)
returns uuid
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_auth_email text;
    v_domain text;
    v_rule text;
    v_interest_id uuid;
begin
    if v_user_id is null then
        raise exception 'sign in is required';
    end if;

    select email into v_auth_email from auth.users
    where id = v_user_id and email_confirmed_at is not null;
    if v_auth_email is null then
        raise exception 'verified email is required';
    end if;

    if not exists (select 1 from public.member_profile_completions where user_id = v_user_id) then
        raise exception 'completed profile is required';
    end if;

    v_domain := lower(split_part(trim(p_business_email), '@', 2));
    if trim(p_contact_name) = '' or trim(p_organization_name) = '' or v_domain = '' then
        raise exception 'required Meridian contact fields are missing';
    end if;

    select decision into v_rule from private.meridian_email_domain_rules where domain = v_domain;
    insert into private.meridian_email_validation_audit (
        requester_user_id, verified_auth_email, business_email, domain, decision, rule_decision
    ) values (
        v_user_id, v_auth_email, lower(trim(p_business_email)), v_domain,
        case when v_rule = 'deny' then 'blocked' else 'accepted' end, v_rule
    );
    if v_rule = 'deny' then
        raise exception 'business or organization email is required';
    end if;

    insert into public.command_interest_requests (
        contact_name, contact_email, organization_name, title, estimated_seats, use_case, status,
        requester_user_id, verified_auth_email, requested_product_label, source_cta, source_content,
        return_url, attribution, communication_preference
    ) values (
        trim(p_contact_name), lower(trim(p_business_email)), trim(p_organization_name), nullif(trim(p_title), ''),
        case when p_estimated_seats > 0 then p_estimated_seats else null end, nullif(trim(p_use_case), ''), 'new',
        v_user_id, v_auth_email, 'Meridian', nullif(trim(p_source_cta), ''), nullif(trim(p_source_content), ''),
        case when p_return_url like '/%' and p_return_url not like '//%' then p_return_url else '/command' end,
        coalesce(p_attribution, '{}'::jsonb), nullif(trim(p_communication_preference), '')
    ) returning id into v_interest_id;

    return v_interest_id;
end;
$$;

create or replace function public.create_meridian_delivery_event(
    p_interest_id uuid,
    p_sender text,
    p_recipient text,
    p_reply_to text
)
returns uuid
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare v_event_id uuid;
begin
    if not exists (
        select 1 from public.command_interest_requests
        where id = p_interest_id and requester_user_id = auth.uid()
    ) then raise exception 'Meridian inquiry ownership is required'; end if;

    insert into private.outbound_email_delivery_events (
        command_interest_request_id, form_type, provider, sender, recipient, recipient_count, reply_to,
        delivery_status, retry_status, quota_bucket, priority, idempotency_key
    ) values (
        p_interest_id, 'meridian_interest', 'resend', p_sender, p_recipient, 1, p_reply_to,
        'queued', 'not_requested', 'operational', 'operational', 'meridian-interest:' || p_interest_id::text
    ) on conflict (idempotency_key) where idempotency_key is not null
    do update set updated_at = private.outbound_email_delivery_events.updated_at
    returning id into v_event_id;
    return v_event_id;
end;
$$;

create or replace function public.claim_meridian_delivery_quota(p_event_id uuid)
returns table (allowed boolean, hold_reason text, retry_at timestamptz)
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare v_rate record;
begin
    if not exists (
        select 1 from private.outbound_email_delivery_events event
        join public.command_interest_requests interest on interest.id = event.command_interest_request_id
        where event.id = p_event_id and interest.requester_user_id = auth.uid()
    ) then raise exception 'Meridian delivery ownership is required'; end if;
    select * into v_rate from private.claim_resend_send_rate();
    if not v_rate.allowed then return query select false, 'rate_limit_exceeded', v_rate.retry_at; return; end if;
    return query select * from private.claim_resend_free_quota(p_event_id, 1, true);
end;
$$;

create or replace function public.complete_meridian_delivery(
    p_event_id uuid,
    p_delivery_status text,
    p_provider_message_id text,
    p_failure_reason text,
    p_provider_headers jsonb,
    p_next_retry_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare v_sent boolean := p_delivery_status = 'sent';
begin
    if not exists (
        select 1 from private.outbound_email_delivery_events event
        join public.command_interest_requests interest on interest.id = event.command_interest_request_id
        where event.id = p_event_id and interest.requester_user_id = auth.uid()
    ) then raise exception 'Meridian delivery ownership is required'; end if;
    if p_delivery_status not in ('sent', 'failed', 'held', 'configuration_missing') then
        raise exception 'invalid Meridian delivery status';
    end if;
    update private.outbound_email_delivery_events set
        provider_message_id = p_provider_message_id,
        delivery_status = p_delivery_status,
        retry_status = case when p_delivery_status = 'held' then 'retry_pending' else 'not_requested' end,
        failure_reason = p_failure_reason,
        provider_headers = coalesce(p_provider_headers, '{}'::jsonb),
        next_retry_at = p_next_retry_at,
        updated_at = now()
    where id = p_event_id;
    perform private.complete_resend_free_quota(1, v_sent);
end;
$$;

revoke all on function public.submit_meridian_interest(text, text, text, text, integer, text, text, text, text, jsonb, text) from public, anon;
revoke all on function public.create_meridian_delivery_event(uuid, text, text, text) from public, anon;
revoke all on function public.claim_meridian_delivery_quota(uuid) from public, anon;
revoke all on function public.complete_meridian_delivery(uuid, text, text, text, jsonb, timestamptz) from public, anon;
grant execute on function public.submit_meridian_interest(text, text, text, text, integer, text, text, text, text, jsonb, text) to authenticated;
grant execute on function public.create_meridian_delivery_event(uuid, text, text, text) to authenticated;
grant execute on function public.claim_meridian_delivery_quota(uuid) to authenticated;
grant execute on function public.complete_meridian_delivery(uuid, text, text, text, jsonb, timestamptz) to authenticated;
