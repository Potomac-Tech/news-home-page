insert into public.app_roles (id, description, created_at)
select
    'explorer',
    'Approved free Explorer with access to Explorer-gated content and tools.',
    created_at
from public.app_roles
where id = 'member'
on conflict (id) do update
set description = excluded.description;

insert into public.app_roles (id, description, created_at)
select
    'meridian',
    'User covered by an organization-level Meridian entitlement.',
    created_at
from public.app_roles
where id = 'command_user'
on conflict (id) do update
set description = excluded.description;

do $$
declare
    function_record record;
    definition text;
begin
    for function_record in
        select function_proc.oid
        from pg_proc function_proc
        join pg_namespace function_schema
          on function_schema.oid = function_proc.pronamespace
        where function_proc.prokind = 'f'
          and function_schema.nspname in ('app_private', 'private')
          and function_proc.proname in (
              'can_access_lunar_tracking_tier',
              'can_access_member_forum_tier',
              'can_read_intelligence_search',
              'can_read_lunar_calculator',
              'can_read_lunar_company_profile',
              'can_read_lunar_market_intel',
              'can_read_tracker_tier',
              'can_use_alert_rules',
              'can_use_command_rfqs',
              'can_use_developer_platform',
              'can_use_member_chat',
              'can_use_rfqs',
              'can_use_saved_work',
              'resolve_nexus_profile_role'
          )
    loop
        definition := pg_get_functiondef(function_record.oid);
        definition := replace(definition, 'command_user', 'meridian');
        definition := regexp_replace(
            definition,
            '(array\[[[:space:]]*)''member''',
            E'\\1''explorer''',
            'g'
        );
        definition := regexp_replace(
            definition,
            '(,[[:space:]]*)''member''([[:space:]]*,)',
            E'\\1''explorer''\\2',
            'g'
        );
        definition := regexp_replace(
            definition,
            '(role_id[[:space:]]*=[[:space:]]*)''member''',
            E'\\1''explorer''',
            'g'
        );
        definition := regexp_replace(
            definition,
            '(role_id[[:space:]]+in[[:space:]]*\([[:space:]]*)''member''',
            E'\\1''explorer''',
            'g'
        );
        execute definition;
    end loop;
end;
$$;

do $$
declare
    policy_record record;
    role_list text;
    using_expression text;
    check_expression text;
    statement text;
begin
    for policy_record in
        select *
        from pg_policies
        where (
            coalesce(qual, '') like '%''command_user''::text%'
            or coalesce(with_check, '') like '%''command_user''::text%'
            or coalesce(qual, '') like '%''member''::text%'
            or coalesce(with_check, '') like '%''member''::text%'
        )
    loop
        select string_agg(quote_ident(policy_role), ', ')
        into role_list
        from unnest(policy_record.roles) policy_role;

        using_expression := replace(
            replace(policy_record.qual, '''command_user''::text', '''meridian''::text'),
            '''member''::text',
            '''explorer''::text'
        );
        check_expression := replace(
            replace(policy_record.with_check, '''command_user''::text', '''meridian''::text'),
            '''member''::text',
            '''explorer''::text'
        );

        execute format(
            'drop policy %I on %I.%I',
            policy_record.policyname,
            policy_record.schemaname,
            policy_record.tablename
        );

        statement := format(
            'create policy %I on %I.%I as %s for %s to %s',
            policy_record.policyname,
            policy_record.schemaname,
            policy_record.tablename,
            case when policy_record.permissive = 'PERMISSIVE'
                then 'permissive'
                else 'restrictive'
            end,
            policy_record.cmd,
            role_list
        );
        if using_expression is not null then
            statement := statement || ' using (' || using_expression || ')';
        end if;
        if check_expression is not null then
            statement := statement || ' with check (' || check_expression || ')';
        end if;
        execute statement;
    end loop;
end;
$$;

update public.member_role_assignments
set role_id = case role_id
    when 'member' then 'explorer'
    when 'command_user' then 'meridian'
    else role_id
end
where role_id in ('member', 'command_user');

delete from public.app_roles
where id in ('member', 'command_user');

do $$
begin
    if exists (
        select 1
        from public.app_roles
        where id in ('member', 'command_user')
    ) then
        raise exception 'legacy app role rows remain';
    end if;

    if exists (
        select 1
        from public.member_role_assignments
        where role_id in ('member', 'command_user')
    ) then
        raise exception 'legacy app role assignments remain';
    end if;

    if exists (
        select 1
        from pg_policies
        where coalesce(qual, '') like '%''command_user''::text%'
           or coalesce(with_check, '') like '%''command_user''::text%'
           or coalesce(qual, '') like '%''member''::text%'
           or coalesce(with_check, '') like '%''member''::text%'
    ) then
        raise exception 'legacy app roles remain in RLS policies';
    end if;
end;
$$;
