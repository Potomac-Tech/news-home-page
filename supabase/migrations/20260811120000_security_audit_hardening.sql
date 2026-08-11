-- Remove a legacy unauthenticated insert path that bypassed the verified
-- Cabeus Council interest workflow. Staff retain their existing review access,
-- while the SECURITY DEFINER submission function remains the only write path.
drop policy if exists "command_interest_insert_public"
on public.command_interest_requests;

revoke all on table public.command_interest_requests from anon;
revoke all on table public.command_interest_requests from authenticated;
grant select, update, delete on table public.command_interest_requests to authenticated;
grant all on table public.command_interest_requests to service_role;

-- These ingestion tables are written exclusively by trusted server jobs.
revoke all on table public.tracker_source_snapshots from anon, authenticated;
grant all on table public.tracker_source_snapshots to service_role;

-- Every custom object used by these privileged functions is schema-qualified,
-- so an empty search path prevents object-shadowing without changing behavior.
alter function public.get_resend_email_operations()
    set search_path = '';
alter function public.record_member_engagement(text, text, text, text, jsonb)
    set search_path = '';
alter function public.refresh_my_custom_intelligence_cards()
    set search_path = '';
alter function public.set_member_personalization_enabled(boolean)
    set search_path = '';
alter function public.set_meridian_email_domain_rule(text, text, text)
    set search_path = '';
alter function public.submit_meridian_interest(text, text, text, text, integer, text, text, text, text, jsonb, text)
    set search_path = '';
