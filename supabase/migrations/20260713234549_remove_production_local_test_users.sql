-- The local QA seed was previously applied to the production migration history.
-- Remove only its deterministic identities and organization after verifying the
-- seed-specific email/domain and contract marker, so an unrelated row can never
-- be deleted merely because it reuses a UUID.
delete from auth.users
where (id, email) in (
    ('00000000-0000-4000-8000-000000000001'::uuid, 'explorer.test@potomac.local'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'scout.test@potomac.local'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'command.test@potomac.local'),
    ('00000000-0000-4000-8000-000000000004'::uuid, 'staff.test@potomac.local')
);

delete from public.organizations
where id = '00000000-0000-4000-8000-000000000101'::uuid
  and slug = 'potomac-command-test'
  and command_contract_reference = 'LOCAL-TEST-COMMAND';
