-- Keep unpublished editorial media behind application authorization checks.
update storage.buckets
set public = false
where id = 'editorial-media';

drop policy if exists "editorial_media_storage_select" on storage.objects;
create policy "editorial_media_storage_select"
on storage.objects for select
to anon, authenticated
using (
    bucket_id = 'editorial-media'
    and (
        app_private.has_any_role(array['editor', 'admin'])
        or exists (
            select 1
            from public.editorial_media_assets asset
            join public.editorial_articles article on article.id = asset.article_id
            where asset.storage_bucket = storage.objects.bucket_id
              and asset.storage_object_path = storage.objects.name
              and article.status = 'published'
              and article.published_at <= now()
        )
    )
);

do $$
declare
    asset record;
    application_url text;
begin
    for asset in
        select id, public_url
        from public.editorial_media_assets
        where hosting_provider = 'supabase'
    loop
        application_url := '/api/editorial-media/' || asset.id::text;

        update public.editorial_articles
        set hero_image_url = application_url
        where hero_image_url = asset.public_url;

        update public.editorial_article_bodies
        set body_markdown = replace(body_markdown, asset.public_url, application_url)
        where body_markdown like '%' || asset.public_url || '%';

        update public.editorial_media_assets
        set public_url = application_url,
            source_url = case
                when source_url is null or source_url = asset.public_url then application_url
                else source_url
            end
        where id = asset.id;
    end loop;
end;
$$;

-- Email delivery state and shared quota are server-managed operations.
revoke all on function public.create_meridian_delivery_event(uuid, text, text, text)
from public, anon, authenticated;
revoke all on function public.claim_meridian_delivery_quota(uuid)
from public, anon, authenticated;
revoke all on function public.complete_meridian_delivery(uuid, text, text, text, jsonb, timestamptz)
from public, anon, authenticated;

create or replace function public.create_meridian_delivery_event_server(
    p_interest_id uuid,
    p_requester_user_id uuid,
    p_sender text,
    p_recipient text,
    p_reply_to text
)
returns uuid
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
    v_event_id uuid;
begin
    if p_requester_user_id is null or not exists (
        select 1 from public.command_interest_requests
        where id = p_interest_id and requester_user_id = p_requester_user_id
    ) then
        raise exception 'Cabeus Council inquiry ownership is required';
    end if;

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

create or replace function public.claim_meridian_delivery_quota_server(
    p_event_id uuid,
    p_requester_user_id uuid
)
returns table (allowed boolean, hold_reason text, retry_at timestamptz)
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
declare
    v_rate record;
begin
    if p_requester_user_id is null or not exists (
        select 1
        from private.outbound_email_delivery_events event
        join public.command_interest_requests interest on interest.id = event.command_interest_request_id
        where event.id = p_event_id and interest.requester_user_id = p_requester_user_id
    ) then
        raise exception 'Cabeus Council delivery ownership is required';
    end if;

    select * into v_rate from private.claim_resend_send_rate();
    if not v_rate.allowed then
        return query select false, 'rate_limit_exceeded', v_rate.retry_at;
        return;
    end if;
    return query select * from private.claim_resend_free_quota(p_event_id, 1, true);
end;
$$;

create or replace function public.complete_meridian_delivery_server(
    p_event_id uuid,
    p_requester_user_id uuid,
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
declare
    v_sent boolean := p_delivery_status = 'sent';
begin
    if p_requester_user_id is null or not exists (
        select 1
        from private.outbound_email_delivery_events event
        join public.command_interest_requests interest on interest.id = event.command_interest_request_id
        where event.id = p_event_id and interest.requester_user_id = p_requester_user_id
    ) then
        raise exception 'Cabeus Council delivery ownership is required';
    end if;
    if p_delivery_status not in ('sent', 'failed', 'held', 'configuration_missing') then
        raise exception 'invalid Cabeus Council delivery status';
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

revoke all on function public.create_meridian_delivery_event_server(uuid, uuid, text, text, text)
from public, anon, authenticated;
revoke all on function public.claim_meridian_delivery_quota_server(uuid, uuid)
from public, anon, authenticated;
revoke all on function public.complete_meridian_delivery_server(uuid, uuid, text, text, text, jsonb, timestamptz)
from public, anon, authenticated;

grant execute on function public.create_meridian_delivery_event_server(uuid, uuid, text, text, text)
to service_role;
grant execute on function public.claim_meridian_delivery_quota_server(uuid, uuid)
to service_role;
grant execute on function public.complete_meridian_delivery_server(uuid, uuid, text, text, text, jsonb, timestamptz)
to service_role;
