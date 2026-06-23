# Member Application Flow

Task 009 adds the public free Member application surface.

## Route

```text
/apply
```

The form captures:

- Full name
- Email
- Organization
- Title
- Intended use

## Behavior

`next-app/app/apply/ApplicationForm.tsx` inserts into `membership_applications` with `status = 'pending'`. If a visitor is already authenticated, the form also attaches the Supabase user id from Auth claims. Otherwise the application is submitted as a public pending application.

The form does not write to `member_profiles`, `member_role_assignments`, or `entitlements`, so submission does not grant member access. Approval remains a separate admin workflow.

## Verification Limit

The route and form build successfully. Live insert verification was not possible in this run because the Supabase publishable key was unavailable and the local schema migration was not applied to a reachable database.
