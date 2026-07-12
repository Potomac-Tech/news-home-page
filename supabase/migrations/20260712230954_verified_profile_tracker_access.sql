create or replace function app_private.can_read_tracker_tier(required_tier text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
    select private.has_verified_complete_profile() and case required_tier
        when 'public' then true
        when 'member' then true
        when 'scout' then app_private.has_any_role(array['scout','command_user','editor','analyst','admin'])
        when 'command' then app_private.has_any_role(array['command_user','editor','analyst','admin'])
        else false end;
$$;
grant execute on function app_private.can_read_tracker_tier(text) to authenticated;
