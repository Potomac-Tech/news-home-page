-- Privileged public-schema functions are server-only unless a later migration
-- explicitly grants a narrower caller role. Revoking PUBLIC is essential because
-- PostgreSQL grants function execution to PUBLIC by default.
revoke execute on function public.accept_project_invite(uuid) from public, anon, authenticated;
revoke execute on function public.check_email_exists(text) from public, anon, authenticated;
revoke execute on function public.claim_email_verification_resend(text) from public, anon, authenticated;
revoke execute on function public.claim_strategic_inquiry_delivery(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.complete_email_verification_resend(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.complete_strategic_inquiry_delivery(uuid, uuid, text, text, text, text, jsonb, timestamptz) from public, anon, authenticated;
revoke execute on function public.decline_project_invite(uuid) from public, anon, authenticated;
revoke execute on function public.get_homepage_launch_summary(date) from public, anon, authenticated;
revoke execute on function public.get_public_profile_fields(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.invite_to_project(uuid, uuid[]) from public, anon, authenticated;
revoke execute on function public.is_admin(uuid) from public, anon, authenticated;
revoke execute on function public.join_project(uuid) from public, anon, authenticated;
revoke execute on function public.log_security_event(uuid, text, text, inet, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.review_weekly_lunar_tracker_entry(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.set_member_chat_last_message_at() from public, anon, authenticated;
revoke execute on function public.set_member_forum_topic_last_post_at() from public, anon, authenticated;
revoke execute on function public.submit_strategic_product_inquiry(text, text, text, text, text, text, text, text, jsonb, text, text, text, text) from public, anon, authenticated;

grant execute on function public.accept_project_invite(uuid) to service_role;
grant execute on function public.check_email_exists(text) to service_role;
grant execute on function public.claim_email_verification_resend(text) to service_role;
grant execute on function public.claim_strategic_inquiry_delivery(uuid, uuid, text) to service_role;
grant execute on function public.complete_email_verification_resend(uuid, text, text, text) to service_role;
grant execute on function public.complete_strategic_inquiry_delivery(uuid, uuid, text, text, text, text, jsonb, timestamptz) to service_role;
grant execute on function public.decline_project_invite(uuid) to service_role;
grant execute on function public.get_homepage_launch_summary(date) to service_role;
grant execute on function public.get_public_profile_fields(uuid, uuid) to service_role;
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.invite_to_project(uuid, uuid[]) to service_role;
grant execute on function public.is_admin(uuid) to service_role;
grant execute on function public.join_project(uuid) to service_role;
grant execute on function public.log_security_event(uuid, text, text, inet, text, text, jsonb) to service_role;
grant execute on function public.review_weekly_lunar_tracker_entry(uuid, text, text) to service_role;
grant execute on function public.set_member_chat_last_message_at() to service_role;
grant execute on function public.set_member_forum_topic_last_post_at() to service_role;
grant execute on function public.submit_strategic_product_inquiry(text, text, text, text, text, text, text, text, jsonb, text, text, text, text) to service_role;

-- Defense in depth for the legacy project workflow: even a privileged caller
-- cannot add a user unless that user already has a pending invitation.
create or replace function public.join_project(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := auth.uid();
begin
    if v_uid is null then
        raise exception 'authentication required';
    end if;

    update public.projects
    set invited_user_ids = array_remove(invited_user_ids, v_uid),
        user_ids = array_append(user_ids, v_uid)
    where id = p_project_id
      and invited_user_ids @> array[v_uid]
      and not (user_ids @> array[v_uid]);

    if not found then
        raise exception 'valid project invitation required';
    end if;
end;
$$;

revoke execute on function public.join_project(uuid) from public, anon, authenticated;
grant execute on function public.join_project(uuid) to service_role;

-- Prevent newly created public-schema functions owned by postgres from silently
-- inheriting the same broad execution grants.
alter default privileges for role postgres in schema public
    revoke execute on functions from public, anon, authenticated;
