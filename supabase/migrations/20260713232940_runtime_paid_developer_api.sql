create extension if not exists pgcrypto with schema extensions;
create extension if not exists supabase_vault with schema vault;

alter table public.developer_webhook_subscriptions
add column if not exists signing_secret_vault_id uuid;

alter table public.developer_webhook_delivery_events
add column if not exists idempotency_key text;

create unique index if not exists developer_webhook_delivery_idempotency_key
on public.developer_webhook_delivery_events (idempotency_key)
where idempotency_key is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'developer-exports',
    'developer-exports',
    false,
    52428800,
    array['text/csv', 'application/pdf', 'application/json']
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.claim_developer_api_request(
    p_key_hash text,
    p_endpoint_key text,
    p_request_id text
)
returns table (
    allowed boolean,
    error_code text,
    http_status integer,
    usage_id uuid,
    api_key_id uuid,
    owner_user_id uuid,
    organization_id uuid,
    access_tier text,
    quota_limit integer,
    quota_used integer,
    quota_remaining integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    selected_key public.developer_api_keys%rowtype;
    selected_endpoint public.developer_endpoint_catalog%rowtype;
    selected_limit integer;
    used_units integer;
    new_usage_id uuid;
    tier_rank integer;
    minimum_rank integer;
begin
    if coalesce(trim(p_key_hash), '') = '' then
        return query select false, 'missing_api_key', 401, null::uuid, null::uuid,
            null::uuid, null::uuid, null::text, 0, 0, 0;
        return;
    end if;

    select * into selected_key
    from public.developer_api_keys
    where key_hash = p_key_hash
      and status = 'active'
      and (expires_at is null or expires_at > now())
    for update;

    if not found then
        return query select false, 'invalid_api_key', 401, null::uuid, null::uuid,
            null::uuid, null::uuid, null::text, 0, 0, 0;
        return;
    end if;

    select * into selected_endpoint
    from public.developer_endpoint_catalog
    where endpoint_key = p_endpoint_key and status = 'active';

    if not found then
        return query select false, 'unknown_endpoint', 404, null::uuid,
            selected_key.id, selected_key.owner_user_id,
            selected_key.organization_id, selected_key.tier, 0, 0, 0;
        return;
    end if;

    if cardinality(selected_key.allowed_endpoint_keys) > 0
       and not (p_endpoint_key = any(selected_key.allowed_endpoint_keys)) then
        return query select false, 'scope_not_allowed', 403, null::uuid,
            selected_key.id, selected_key.owner_user_id,
            selected_key.organization_id, selected_key.tier, 0, 0, 0;
        return;
    end if;

    tier_rank := case selected_key.tier when 'staff' then 3 when 'command' then 2 else 1 end;
    minimum_rank := case selected_endpoint.minimum_tier when 'staff' then 3 when 'command' then 2 else 1 end;
    if tier_rank < minimum_rank then
        return query select false, 'tier_not_entitled', 403, null::uuid,
            selected_key.id, selected_key.owner_user_id,
            selected_key.organization_id, selected_key.tier, 0, 0, 0;
        return;
    end if;

    select coalesce(
        selected_key.monthly_quota_override,
        limits.monthly_api_quota
    ) into selected_limit
    from public.developer_tier_limits limits
    where limits.tier = selected_key.tier;

    select coalesce(sum(log.quota_units), 0)::integer into used_units
    from public.developer_api_usage_logs log
    where log.api_key_id = selected_key.id
      and log.occurred_at >= date_trunc('month', now())
      and log.event_kind = 'api_request';

    if used_units + selected_endpoint.quota_weight > selected_limit then
        insert into public.developer_api_usage_logs (
            owner_user_id, organization_id, api_key_id, endpoint_key,
            request_id, status_code, quota_units, error_code
        ) values (
            selected_key.owner_user_id, selected_key.organization_id,
            selected_key.id, p_endpoint_key, p_request_id, 429, 0,
            'monthly_quota_exceeded'
        );
        return query select false, 'monthly_quota_exceeded', 429, null::uuid,
            selected_key.id, selected_key.owner_user_id,
            selected_key.organization_id, selected_key.tier,
            selected_limit, used_units, greatest(selected_limit - used_units, 0);
        return;
    end if;

    insert into public.developer_api_usage_logs (
        owner_user_id, organization_id, api_key_id, endpoint_key,
        request_id, quota_units
    ) values (
        selected_key.owner_user_id, selected_key.organization_id,
        selected_key.id, p_endpoint_key, p_request_id,
        selected_endpoint.quota_weight
    ) returning id into new_usage_id;

    update public.developer_api_keys
    set last_used_at = now(), updated_at = now()
    where id = selected_key.id;

    return query select true, null::text, 200, new_usage_id,
        selected_key.id, selected_key.owner_user_id,
        selected_key.organization_id, selected_key.tier,
        selected_limit, used_units + selected_endpoint.quota_weight,
        greatest(selected_limit - used_units - selected_endpoint.quota_weight, 0);
end;
$$;

create or replace function public.complete_developer_api_request(
    p_usage_id uuid,
    p_status_code integer,
    p_response_ms integer,
    p_response_bytes integer default null,
    p_error_code text default null
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
    update public.developer_api_usage_logs
    set status_code = p_status_code,
        response_ms = greatest(p_response_ms, 0),
        response_bytes = greatest(p_response_bytes, 0),
        error_code = p_error_code
    where id = p_usage_id;
$$;

create or replace function public.create_developer_webhook_secret(
    p_subscription_id uuid,
    p_secret text
)
returns uuid
language plpgsql
security definer
set search_path = public, vault, pg_temp
as $$
declare
    secret_id uuid;
begin
    if length(p_secret) < 32 then
        raise exception 'Webhook signing secret must contain at least 32 characters.';
    end if;
    if not exists (
        select 1 from public.developer_webhook_subscriptions
        where id = p_subscription_id
    ) then
        raise exception 'Webhook subscription not found.';
    end if;
    secret_id := vault.create_secret(
        p_secret,
        'developer_webhook_' || p_subscription_id::text,
        'Cabeus Explorer webhook signing secret'
    );
    update public.developer_webhook_subscriptions
    set signing_secret_vault_id = secret_id,
        signing_secret_hash = encode(extensions.digest(p_secret, 'sha256'), 'hex')
    where id = p_subscription_id;
    return secret_id;
end;
$$;

create or replace function public.claim_developer_webhook_deliveries(p_limit integer default 20)
returns table (
    delivery_id uuid,
    subscription_id uuid,
    endpoint_url text,
    signing_secret text,
    event_kind text,
    payload jsonb,
    attempt_count integer
)
language plpgsql
security definer
set search_path = public, vault, pg_temp
as $$
begin
    return query
    with claimed as (
        select delivery.id
        from public.developer_webhook_delivery_events delivery
        join public.developer_webhook_subscriptions subscription
          on subscription.id = delivery.subscription_id
        where delivery.delivery_status = 'queued'
          and coalesce(delivery.next_attempt_at, delivery.created_at) <= now()
          and subscription.status = 'active'
          and subscription.signing_secret_vault_id is not null
        order by coalesce(delivery.next_attempt_at, delivery.created_at)
        for update of delivery skip locked
        limit greatest(least(p_limit, 100), 1)
    ), updated as (
        update public.developer_webhook_delivery_events delivery
        set delivery_status = 'sent',
            attempt_count = delivery.attempt_count + 1
        from claimed
        where delivery.id = claimed.id
        returning delivery.*
    )
    select updated.id, subscription.id, subscription.endpoint_url,
        secret.decrypted_secret,
        updated.event_kind::text,
        coalesce(updated.metadata -> 'payload', '{}'::jsonb),
        updated.attempt_count
    from updated
    join public.developer_webhook_subscriptions subscription
      on subscription.id = updated.subscription_id
    join vault.decrypted_secrets secret
      on secret.id = subscription.signing_secret_vault_id;
end;
$$;

create or replace function public.finish_developer_webhook_delivery(
    p_delivery_id uuid,
    p_success boolean,
    p_status_code integer,
    p_response_ms integer,
    p_error text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    delivery public.developer_webhook_delivery_events%rowtype;
begin
    select * into delivery
    from public.developer_webhook_delivery_events
    where id = p_delivery_id for update;
    if not found then return; end if;

    if p_success then
        update public.developer_webhook_delivery_events
        set delivery_status = 'sent', sent_at = now(),
            response_status_code = p_status_code,
            response_ms = greatest(p_response_ms, 0), last_error = null
        where id = p_delivery_id;
        update public.developer_webhook_subscriptions
        set last_delivery_at = now(), failure_count = 0
        where id = delivery.subscription_id;
    elsif delivery.attempt_count >= 8 then
        update public.developer_webhook_delivery_events
        set delivery_status = 'failed', response_status_code = p_status_code,
            response_ms = greatest(p_response_ms, 0), last_error = left(p_error, 1000)
        where id = p_delivery_id;
        update public.developer_webhook_subscriptions
        set failure_count = failure_count + 1
        where id = delivery.subscription_id;
    else
        update public.developer_webhook_delivery_events
        set delivery_status = 'queued', response_status_code = p_status_code,
            response_ms = greatest(p_response_ms, 0), last_error = left(p_error, 1000),
            next_attempt_at = now() + make_interval(secs => least(21600, power(2, delivery.attempt_count)::integer * 30))
        where id = p_delivery_id;
        update public.developer_webhook_subscriptions
        set failure_count = failure_count + 1
        where id = delivery.subscription_id;
    end if;
end;
$$;

revoke all on function public.claim_developer_api_request(text, text, text) from public, anon, authenticated;
revoke all on function public.complete_developer_api_request(uuid, integer, integer, integer, text) from public, anon, authenticated;
revoke all on function public.create_developer_webhook_secret(uuid, text) from public, anon, authenticated;
revoke all on function public.claim_developer_webhook_deliveries(integer) from public, anon, authenticated;
revoke all on function public.finish_developer_webhook_delivery(uuid, boolean, integer, integer, text) from public, anon, authenticated;

grant execute on function public.claim_developer_api_request(text, text, text) to service_role;
grant execute on function public.complete_developer_api_request(uuid, integer, integer, integer, text) to service_role;
grant execute on function public.create_developer_webhook_secret(uuid, text) to service_role;
grant execute on function public.claim_developer_webhook_deliveries(integer) to service_role;
grant execute on function public.finish_developer_webhook_delivery(uuid, boolean, integer, integer, text) to service_role;
