# Command Interest Workflow

Task 013 adds a manual Command sales/admin workflow.

## Public Route

```text
/command
```

The form stores Command interest requests in `command_interest_requests` with `status = 'new'`.

Captured fields:

- Contact name
- Contact email
- Organization
- Title
- Estimated seats
- Mission need

## Admin Route

```text
/admin/command
```

Admins can:

- Review Command interest requests.
- Update sales status.
- Record sales/admin notes.
- Manually grant organization-level Command access after offline approval.

Manual grant creates:

- An active `organizations` row.
- An active organization-scoped `entitlements` row with `tier = 'command'`.
- A linked `access_audit_events` record.
- Backreferences on the original `command_interest_requests` row.

## Verification Limit

The schema, public route, admin route, and server actions build successfully. Live database inserts and manual grants could not be exercised because the Supabase publishable/service keys were unavailable and the schema migration was not applied to a reachable database.
