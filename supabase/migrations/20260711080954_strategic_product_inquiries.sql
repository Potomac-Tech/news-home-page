create table if not exists public.strategic_product_inquiries (
    id uuid primary key default gen_random_uuid(),
    product text not null check (product in ('pathfinder', 'source')),
    contact_name text not null check (length(trim(contact_name)) between 2 and 160),
    contact_email text not null check (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    organization_name text not null check (length(trim(organization_name)) between 2 and 200),
    role_title text,
    product_interest text not null check (length(trim(product_interest)) between 2 and 240),
    message text not null check (length(trim(message)) between 20 and 4000),
    source_cta text,
    attribution jsonb not null default '{}'::jsonb check (jsonb_typeof(attribution) = 'object'),
    communication_preference text not null
        check (communication_preference = 'product_follow_up_approved'),
    review_status text not null default 'new'
        check (review_status in ('new', 'reviewing', 'qualified', 'closed', 'spam')),
    notification_status text not null default 'queued'
        check (notification_status in ('queued', 'sent', 'held', 'failed', 'configuration_missing')),
    requester_user_id uuid references auth.users(id) on delete set null,
    delivery_token_hash text not null,
    reviewed_by uuid references auth.users(id) on delete set null,
    reviewed_at timestamptz,
    review_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists strategic_inquiries_review_created_idx
on public.strategic_product_inquiries (review_status, created_at desc);
create index if not exists strategic_inquiries_product_created_idx
on public.strategic_product_inquiries (product, created_at desc);

drop trigger if exists set_strategic_product_inquiries_updated_at
on public.strategic_product_inquiries;
create trigger set_strategic_product_inquiries_updated_at
before update on public.strategic_product_inquiries
for each row execute function public.set_updated_at();

alter table public.strategic_product_inquiries enable row level security;

drop policy if exists "Inquiry staff can review strategic leads"
on public.strategic_product_inquiries;
create policy "Inquiry staff can review strategic leads"
on public.strategic_product_inquiries
for all
to authenticated
using (
    exists (
        select 1 from public.member_role_assignments assignment
        where assignment.user_id = (select auth.uid())
          and assignment.role_id in ('editor', 'analyst', 'admin')
          and (assignment.expires_at is null or assignment.expires_at > now())
    )
)
with check (
    exists (
        select 1 from public.member_role_assignments assignment
        where assignment.user_id = (select auth.uid())
          and assignment.role_id in ('editor', 'analyst', 'admin')
          and (assignment.expires_at is null or assignment.expires_at > now())
    )
);

create table if not exists private.strategic_inquiry_rate_limits (
    email_hash text not null,
    window_started_at timestamptz not null,
    submission_count integer not null default 1 check (submission_count between 1 and 3),
    primary key (email_hash, window_started_at)
);
alter table private.strategic_inquiry_rate_limits enable row level security;
revoke all on table private.strategic_inquiry_rate_limits from public, anon, authenticated;
grant all on table private.strategic_inquiry_rate_limits to service_role;

alter table private.outbound_email_delivery_events
    add column if not exists strategic_inquiry_id uuid
        references public.strategic_product_inquiries(id) on delete set null;

create index if not exists outbound_email_strategic_inquiry_idx
on private.outbound_email_delivery_events (strategic_inquiry_id, created_at desc)
where strategic_inquiry_id is not null;

create or replace function public.submit_strategic_product_inquiry(
    p_product text,
    p_contact_name text,
    p_contact_email text,
    p_organization_name text,
    p_role_title text,
    p_product_interest text,
    p_message text,
    p_source_cta text,
    p_attribution jsonb,
    p_communication_preference text,
    p_honeypot text,
    p_sender text,
    p_recipient text
)
returns jsonb
language plpgsql
security definer
set search_path = private, public, extensions, pg_temp
as $$
declare
    v_email text := lower(trim(p_contact_email));
    v_email_hash text;
    v_window timestamptz := date_trunc('hour', now());
    v_count integer;
    v_token text := gen_random_uuid()::text;
    v_inquiry_id uuid;
    v_event_id uuid;
begin
    if p_product not in ('pathfinder', 'source') then raise exception 'invalid product'; end if;
    if coalesce(trim(p_honeypot), '') <> '' then raise exception 'submission rejected'; end if;
    if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'valid email required'; end if;
    if length(trim(p_contact_name)) < 2 or length(trim(p_organization_name)) < 2 then
        raise exception 'required contact fields missing';
    end if;
    if length(trim(p_message)) < 20 or length(trim(p_message)) > 4000 then
        raise exception 'message must be between 20 and 4000 characters';
    end if;
    if p_communication_preference <> 'product_follow_up_approved' then
        raise exception 'communication consent required';
    end if;
    if lower(trim(p_sender)) <> 'info@potomacdb.com' or lower(trim(p_recipient)) <> 'info@potomacdb.com' then
        raise exception 'approved inquiry routing required';
    end if;

    v_email_hash := encode(digest(v_email, 'sha256'), 'hex');
    insert into private.strategic_inquiry_rate_limits (email_hash, window_started_at)
    values (v_email_hash, v_window)
    on conflict (email_hash, window_started_at) do update
      set submission_count = private.strategic_inquiry_rate_limits.submission_count + 1
      where private.strategic_inquiry_rate_limits.submission_count < 3
    returning submission_count into v_count;
    if v_count is null then raise exception 'inquiry rate limit exceeded'; end if;

    insert into public.strategic_product_inquiries (
        product, contact_name, contact_email, organization_name, role_title,
        product_interest, message, source_cta, attribution, communication_preference,
        requester_user_id, delivery_token_hash
    ) values (
        p_product, trim(p_contact_name), v_email, trim(p_organization_name), nullif(trim(p_role_title), ''),
        trim(p_product_interest), trim(p_message), nullif(trim(p_source_cta), ''),
        coalesce(p_attribution, '{}'::jsonb), p_communication_preference,
        auth.uid(), encode(digest(v_token, 'sha256'), 'hex')
    ) returning id into v_inquiry_id;

    insert into private.outbound_email_delivery_events (
        strategic_inquiry_id, form_type, provider, sender, recipient, recipient_count,
        reply_to, delivery_status, retry_status, quota_bucket, priority, idempotency_key
    ) values (
        v_inquiry_id, p_product || '_inquiry', 'resend', lower(trim(p_sender)),
        lower(trim(p_recipient)), 1, v_email, 'queued', 'not_requested',
        'operational', 'operational', p_product || '-inquiry:' || v_inquiry_id::text
    ) returning id into v_event_id;

    return jsonb_build_object(
        'inquiry_id', v_inquiry_id,
        'delivery_event_id', v_event_id,
        'delivery_token', v_token
    );
end;
$$;

create or replace function public.claim_strategic_inquiry_delivery(
    p_inquiry_id uuid,
    p_event_id uuid,
    p_delivery_token text
)
returns table (allowed boolean, hold_reason text, retry_at timestamptz)
language plpgsql
security definer
set search_path = private, public, extensions, pg_temp
as $$
declare v_rate record;
begin
    if not exists (
        select 1 from public.strategic_product_inquiries inquiry
        join private.outbound_email_delivery_events event
          on event.strategic_inquiry_id = inquiry.id
        where inquiry.id = p_inquiry_id and event.id = p_event_id
          and inquiry.delivery_token_hash = encode(digest(p_delivery_token, 'sha256'), 'hex')
    ) then raise exception 'invalid strategic inquiry delivery token'; end if;
    select * into v_rate from private.claim_resend_send_rate();
    if not v_rate.allowed then
        return query select false, 'rate_limit_exceeded', v_rate.retry_at;
        return;
    end if;
    return query select * from private.claim_resend_free_quota(p_event_id, 1, true);
end;
$$;

create or replace function public.complete_strategic_inquiry_delivery(
    p_inquiry_id uuid,
    p_event_id uuid,
    p_delivery_token text,
    p_delivery_status text,
    p_provider_message_id text,
    p_failure_reason text,
    p_provider_headers jsonb,
    p_next_retry_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = private, public, extensions, pg_temp
as $$
declare v_sent boolean := p_delivery_status = 'sent';
begin
    if p_delivery_status not in ('sent', 'failed', 'held', 'configuration_missing') then
        raise exception 'invalid strategic inquiry delivery status';
    end if;
    if not exists (
        select 1 from public.strategic_product_inquiries inquiry
        join private.outbound_email_delivery_events event
          on event.strategic_inquiry_id = inquiry.id
        where inquiry.id = p_inquiry_id and event.id = p_event_id
          and inquiry.delivery_token_hash = encode(digest(p_delivery_token, 'sha256'), 'hex')
    ) then raise exception 'invalid strategic inquiry delivery token'; end if;

    update private.outbound_email_delivery_events set
        provider_message_id = p_provider_message_id,
        delivery_status = p_delivery_status,
        retry_status = case when p_delivery_status = 'held' then 'retry_pending' else 'not_requested' end,
        failure_reason = p_failure_reason,
        provider_headers = coalesce(p_provider_headers, '{}'::jsonb),
        next_retry_at = p_next_retry_at,
        updated_at = now()
    where id = p_event_id and strategic_inquiry_id = p_inquiry_id;

    update public.strategic_product_inquiries
    set notification_status = p_delivery_status, updated_at = now()
    where id = p_inquiry_id;
    perform private.complete_resend_free_quota(1, v_sent);
end;
$$;

revoke all on table public.strategic_product_inquiries from public, anon, authenticated;
grant select, update on table public.strategic_product_inquiries to authenticated;
revoke all on function public.submit_strategic_product_inquiry(text, text, text, text, text, text, text, text, jsonb, text, text, text, text) from public;
revoke all on function public.claim_strategic_inquiry_delivery(uuid, uuid, text) from public;
revoke all on function public.complete_strategic_inquiry_delivery(uuid, uuid, text, text, text, text, jsonb, timestamptz) from public;
grant execute on function public.submit_strategic_product_inquiry(text, text, text, text, text, text, text, text, jsonb, text, text, text, text) to anon, authenticated;
grant execute on function public.claim_strategic_inquiry_delivery(uuid, uuid, text) to anon, authenticated;
grant execute on function public.complete_strategic_inquiry_delivery(uuid, uuid, text, text, text, text, jsonb, timestamptz) to anon, authenticated;
