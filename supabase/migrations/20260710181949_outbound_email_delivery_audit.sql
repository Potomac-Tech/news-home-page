create table if not exists private.outbound_email_delivery_events (
    id uuid primary key default gen_random_uuid(),
    command_interest_request_id uuid references public.command_interest_requests(id)
        on delete set null,
    form_type text not null,
    provider text not null default 'resend',
    provider_message_id text,
    sender text not null,
    recipient text not null,
    recipient_count integer not null default 1,
    reply_to text,
    delivery_status text not null default 'queued',
    retry_status text not null default 'not_requested',
    quota_bucket text not null default 'operational',
    failure_reason text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint outbound_email_delivery_form_type_check check (
        form_type in ('meridian_interest', 'pathfinder_inquiry', 'source_inquiry', 'udri_fallback', 'member_alert', 'operational_inquiry')
    ),
    constraint outbound_email_delivery_recipient_count_check check (recipient_count > 0),
    constraint outbound_email_delivery_status_check check (
        delivery_status in ('queued', 'sent', 'failed', 'configuration_missing', 'held')
    ),
    constraint outbound_email_delivery_retry_status_check check (
        retry_status in ('not_requested', 'retry_pending', 'retry_exhausted')
    )
);

create index if not exists outbound_email_delivery_events_status_created_idx
on private.outbound_email_delivery_events (delivery_status, created_at desc);

create index if not exists outbound_email_delivery_events_interest_idx
on private.outbound_email_delivery_events (command_interest_request_id, created_at desc)
where command_interest_request_id is not null;

alter table private.outbound_email_delivery_events enable row level security;

revoke all on table private.outbound_email_delivery_events from public, anon, authenticated;
grant all on table private.outbound_email_delivery_events to service_role;
