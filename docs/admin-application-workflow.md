# Admin Application Workflow

Task 010 adds the first admin review surface for free Member applications.

## Route

```text
/admin/applications
```

The route is dynamic and protected by `requireAdmin()`, which checks Supabase Auth claims and the `admin` role in `member_role_assignments`.

## Workflow

Admins can:

- List pending records from `membership_applications`.
- Approve an application.
- Reject an application with a required decision note.
- Record the reviewer and review timestamp.
- Insert an `access_audit_events` record for the decision.

For applications linked to a Supabase Auth user, approval also upserts `member_profiles` with `status = 'approved'` and grants the `member` role. Applications submitted without a linked Auth user can be approved as application records, but access is not granted until identity linking is available.

## Verification Limit

The route and server actions build successfully. Live review actions could not be exercised in this run because the Supabase publishable key was unavailable and the local schema migration was not applied to a reachable database.
