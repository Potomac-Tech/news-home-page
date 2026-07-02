do $$
declare
    test_password text := 'PotomacTest123!';
    staff_user_id uuid := '00000000-0000-4000-8000-000000000004'::uuid;
    command_org_id uuid := '00000000-0000-4000-8000-000000000101'::uuid;
begin
    insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        is_super_admin,
        is_sso_user,
        is_anonymous
    )
    values
        (
            '00000000-0000-0000-0000-000000000000'::uuid,
            '00000000-0000-4000-8000-000000000001'::uuid,
            'authenticated',
            'authenticated',
            'explorer.test@potomac.local',
            extensions.crypt(test_password, extensions.gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Explorer Test User"}'::jsonb,
            now(),
            now(),
            false,
            false,
            false
        ),
        (
            '00000000-0000-0000-0000-000000000000'::uuid,
            '00000000-0000-4000-8000-000000000002'::uuid,
            'authenticated',
            'authenticated',
            'scout.test@potomac.local',
            extensions.crypt(test_password, extensions.gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Scout Test User"}'::jsonb,
            now(),
            now(),
            false,
            false,
            false
        ),
        (
            '00000000-0000-0000-0000-000000000000'::uuid,
            '00000000-0000-4000-8000-000000000003'::uuid,
            'authenticated',
            'authenticated',
            'command.test@potomac.local',
            extensions.crypt(test_password, extensions.gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Command Test User"}'::jsonb,
            now(),
            now(),
            false,
            false,
            false
        ),
        (
            '00000000-0000-0000-0000-000000000000'::uuid,
            staff_user_id,
            'authenticated',
            'authenticated',
            'staff.test@potomac.local',
            extensions.crypt(test_password, extensions.gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Staff Test User"}'::jsonb,
            now(),
            now(),
            false,
            false,
            false
        )
    on conflict (id) do update set
        email = excluded.email,
        encrypted_password = excluded.encrypted_password,
        email_confirmed_at = excluded.email_confirmed_at,
        raw_app_meta_data = excluded.raw_app_meta_data,
        raw_user_meta_data = excluded.raw_user_meta_data,
        updated_at = now(),
        is_sso_user = false,
        is_anonymous = false;

    insert into auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    )
    select
        user_row.id,
        user_row.id,
        user_row.id::text,
        jsonb_build_object(
            'sub',
            user_row.id::text,
            'email',
            user_row.email,
            'email_verified',
            true
        ),
        'email',
        now(),
        now(),
        now()
    from auth.users user_row
    where user_row.id in (
        '00000000-0000-4000-8000-000000000001'::uuid,
        '00000000-0000-4000-8000-000000000002'::uuid,
        '00000000-0000-4000-8000-000000000003'::uuid,
        staff_user_id
    )
    on conflict (provider_id, provider) do update set
        identity_data = excluded.identity_data,
        updated_at = now();

    insert into public.organizations (
        id,
        name,
        slug,
        status,
        primary_billing_email,
        seat_limit,
        command_contract_reference
    )
    values (
        command_org_id,
        'Potomac Command Test Organization',
        'potomac-command-test',
        'active',
        'command.test@potomac.local',
        5,
        'LOCAL-TEST-COMMAND'
    )
    on conflict (id) do update set
        name = excluded.name,
        slug = excluded.slug,
        status = excluded.status,
        primary_billing_email = excluded.primary_billing_email,
        seat_limit = excluded.seat_limit,
        command_contract_reference = excluded.command_contract_reference,
        updated_at = now();

    insert into public.member_profiles (
        user_id,
        email,
        full_name,
        company,
        title,
        status,
        base_tier,
        approved_at,
        approved_by,
        decision_note
    )
    values
        (
            '00000000-0000-4000-8000-000000000001'::uuid,
            'explorer.test@potomac.local',
            'Explorer Test User',
            'Potomac Local QA',
            'Explorer test account',
            'approved',
            'member',
            now(),
            staff_user_id,
            'Local seeded Explorer verification account.'
        ),
        (
            '00000000-0000-4000-8000-000000000002'::uuid,
            'scout.test@potomac.local',
            'Scout Test User',
            'Potomac Local QA',
            'Scout test account',
            'approved',
            'scout',
            now(),
            staff_user_id,
            'Local seeded Scout verification account.'
        ),
        (
            '00000000-0000-4000-8000-000000000003'::uuid,
            'command.test@potomac.local',
            'Command Test User',
            'Potomac Command Test Organization',
            'Command test account',
            'approved',
            'command',
            now(),
            staff_user_id,
            'Local seeded Command verification account.'
        ),
        (
            staff_user_id,
            'staff.test@potomac.local',
            'Staff Test User',
            'Potomac Local QA',
            'Staff test account',
            'approved',
            'member',
            now(),
            staff_user_id,
            'Local seeded staff verification account.'
        )
    on conflict (user_id) do update set
        email = excluded.email,
        full_name = excluded.full_name,
        company = excluded.company,
        title = excluded.title,
        status = excluded.status,
        base_tier = excluded.base_tier,
        approved_at = excluded.approved_at,
        approved_by = excluded.approved_by,
        decision_note = excluded.decision_note,
        updated_at = now();

    insert into public.organization_members (
        organization_id,
        user_id,
        role,
        status,
        invited_by,
        joined_at
    )
    values (
        command_org_id,
        '00000000-0000-4000-8000-000000000003'::uuid,
        'org_admin',
        'active',
        staff_user_id,
        now()
    )
    on conflict (organization_id, user_id) do update set
        role = excluded.role,
        status = excluded.status,
        invited_by = excluded.invited_by,
        joined_at = excluded.joined_at,
        updated_at = now();

    delete from public.member_role_assignments
    where metadata ->> 'seed' = 'local_test_users'
        or user_id in (
            '00000000-0000-4000-8000-000000000001'::uuid,
            '00000000-0000-4000-8000-000000000002'::uuid,
            '00000000-0000-4000-8000-000000000003'::uuid,
            staff_user_id
        );

    insert into public.member_role_assignments (
        user_id,
        role_id,
        organization_id,
        granted_by,
        metadata
    )
    values
        (
            '00000000-0000-4000-8000-000000000001'::uuid,
            'member',
            null,
            staff_user_id,
            '{"seed":"local_test_users","persona":"explorer"}'::jsonb
        ),
        (
            '00000000-0000-4000-8000-000000000002'::uuid,
            'member',
            null,
            staff_user_id,
            '{"seed":"local_test_users","persona":"scout"}'::jsonb
        ),
        (
            '00000000-0000-4000-8000-000000000002'::uuid,
            'scout',
            null,
            staff_user_id,
            '{"seed":"local_test_users","persona":"scout"}'::jsonb
        ),
        (
            '00000000-0000-4000-8000-000000000003'::uuid,
            'member',
            command_org_id,
            staff_user_id,
            '{"seed":"local_test_users","persona":"command"}'::jsonb
        ),
        (
            '00000000-0000-4000-8000-000000000003'::uuid,
            'command_user',
            command_org_id,
            staff_user_id,
            '{"seed":"local_test_users","persona":"command"}'::jsonb
        ),
        (
            '00000000-0000-4000-8000-000000000003'::uuid,
            'org_admin',
            command_org_id,
            staff_user_id,
            '{"seed":"local_test_users","persona":"command"}'::jsonb
        ),
        (
            staff_user_id,
            'member',
            null,
            staff_user_id,
            '{"seed":"local_test_users","persona":"staff"}'::jsonb
        ),
        (
            staff_user_id,
            'editor',
            null,
            staff_user_id,
            '{"seed":"local_test_users","persona":"staff"}'::jsonb
        ),
        (
            staff_user_id,
            'analyst',
            null,
            staff_user_id,
            '{"seed":"local_test_users","persona":"staff"}'::jsonb
        ),
        (
            staff_user_id,
            'admin',
            null,
            staff_user_id,
            '{"seed":"local_test_users","persona":"staff"}'::jsonb
        )
    ;

    delete from public.entitlements
    where metadata ->> 'seed' = 'local_test_users'
        or external_reference in ('LOCAL-TEST-SCOUT', 'LOCAL-TEST-COMMAND');

    insert into public.entitlements (
        user_id,
        organization_id,
        tier,
        status,
        source,
        starts_at,
        granted_by,
        external_reference,
        metadata
    )
    values
        (
            '00000000-0000-4000-8000-000000000002'::uuid,
            null,
            'scout',
            'active',
            'local_seed',
            now(),
            staff_user_id,
            'LOCAL-TEST-SCOUT',
            '{"seed":"local_test_users","persona":"scout"}'::jsonb
        ),
        (
            null,
            command_org_id,
            'command',
            'active',
            'local_seed',
            now(),
            staff_user_id,
            'LOCAL-TEST-COMMAND',
            '{"seed":"local_test_users","persona":"command"}'::jsonb
        )
    on conflict do nothing;

    delete from public.access_audit_events
    where metadata ->> 'seed' = 'local_test_users';

    insert into public.access_audit_events (
        actor_user_id,
        target_user_id,
        organization_id,
        event_type,
        event_summary,
        metadata
    )
    values
        (
            staff_user_id,
            '00000000-0000-4000-8000-000000000001'::uuid,
            null,
            'local_test_user.seeded',
            'Seeded local Explorer test user.',
            '{"seed":"local_test_users"}'::jsonb
        ),
        (
            staff_user_id,
            '00000000-0000-4000-8000-000000000002'::uuid,
            null,
            'local_test_user.seeded',
            'Seeded local Scout test user.',
            '{"seed":"local_test_users"}'::jsonb
        ),
        (
            staff_user_id,
            '00000000-0000-4000-8000-000000000003'::uuid,
            command_org_id,
            'local_test_user.seeded',
            'Seeded local Command test user.',
            '{"seed":"local_test_users"}'::jsonb
        ),
        (
            staff_user_id,
            staff_user_id,
            null,
            'local_test_user.seeded',
            'Seeded local staff test user.',
            '{"seed":"local_test_users"}'::jsonb
        );
end $$;
