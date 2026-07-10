create or replace function public.get_resend_email_operations()
returns jsonb
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
    if not app_private.has_role('admin') then
        raise exception 'admin access is required';
    end if;

    return jsonb_build_object(
        'config', (
            select to_jsonb(config)
            from private.resend_free_plan_config config
            where id = true
        ),
        'usage', coalesce((
            select jsonb_agg(to_jsonb(usage) order by usage.period_kind)
            from private.resend_quota_usage usage
            where usage.period_start in (
                (now() at time zone 'utc')::date,
                date_trunc('month', now() at time zone 'utc')::date
            )
        ), '[]'::jsonb),
        'events', coalesce((
            select jsonb_agg(to_jsonb(event) order by event.created_at desc)
            from (
                select id, form_type, recipient, recipient_count, delivery_status,
                    retry_status, next_retry_at, provider_message_id, failure_reason, created_at
                from private.outbound_email_delivery_events
                order by created_at desc
                limit 40
            ) event
        ), '[]'::jsonb)
    );
end;
$$;

revoke all on function public.get_resend_email_operations() from public, anon;
grant execute on function public.get_resend_email_operations() to authenticated;
