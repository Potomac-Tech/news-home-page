# Member Access RLS

Task 008 adds local RLS policy coverage for the member access schema.

Migration:

```text
supabase/migrations/20260623122205_member_access_rls_policies.sql
```

## Policy Helpers

Authorization helpers live in the private `app_private` schema:

- `app_private.has_role(role_id)`
- `app_private.has_any_role(role_ids)`
- `app_private.is_org_member(organization_id)`
- `app_private.is_org_admin(organization_id)`

These functions are `security definer` functions but are not created in the exposed `public` schema.

## Access Coverage

| Access group | Coverage |
| --- | --- |
| Public visitors | Can insert pending membership applications and read the public role catalog. |
| Pending applicants | Can read their own authenticated application records. |
| Members | Can read their own profile, role assignments, and user-scoped entitlements. |
| Scout users | Read access is represented through active user-scoped Scout entitlements and Scout role assignments. |
| Command users | Can read organization-scoped records through active organization membership. |
| Organization admins | Can read/manage organization membership within their organization and read organization entitlements/audit events. |
| Editors | Can read member/application context needed for editorial workflows. |
| Analysts | Can read member, organization, entitlement, and audit context needed for intelligence workflows. |
| Admins | Can manage profiles, applications, organizations, roles, entitlements, and audit records. |

## Verification Limit

The migration was added locally and checked with static searches for helper functions, grants, policies, and role names. Local or remote SQL execution was not possible in this run because no local Supabase database was running and authenticated Supabase MCP/CLI database access was unavailable.
