# Member Access Schema

Task 007 adds a local Supabase migration for Potomac's initial member, organization, role, and entitlement model.

Migration:

```text
supabase/migrations/20260623121852_member_access_schema.sql
```

## Tables

| Table | Purpose |
| --- | --- |
| `member_profiles` | One profile per Supabase Auth user, including pending/approved/rejected/suspended status. |
| `membership_applications` | Free Member applications with pending, approved, rejected, and withdrawn review states. |
| `organizations` | Organization records for Command prospects and active Command customers. |
| `organization_members` | Organization seats, members, and org-admin assignments. |
| `app_roles` | Normalized role catalog for pending applicants, Members, Scout users, Command users, org admins, editors, analysts, and admins. |
| `member_role_assignments` | User role grants, optionally scoped to an organization. |
| `entitlements` | User-level Scout and organization-level Command entitlements with status, timing, Stripe references, and audit metadata. |
| `access_audit_events` | Access and review history for membership, role, organization, and entitlement changes. |

## Access Model Coverage

- Pending applicants: `membership_applications.status = 'pending'` plus the `pending_applicant` role.
- Approved Members: `member_profiles.status = 'approved'` plus the `member` role.
- Scout users: user-scoped `entitlements.tier = 'scout'` plus the `scout` role.
- Command organizations: organization-scoped `entitlements.tier = 'command'` and active organization records.
- Organization admins: `organization_members.role = 'org_admin'` plus the `org_admin` role.
- Staff roles: `editor`, `analyst`, and `admin` role records are seeded for later policy work.

## Verification Limit

The migration was created with `npx supabase --workdir "C:\Users\JacobMatthews\Documents\Potomac Website" migration new member_access_schema`.

Remote application was not run in this automation session because authenticated Supabase MCP tools were not exposed, the Supabase CLI was not logged in for this workspace, and no database credentials were available. RLS is enabled defensively in the migration; detailed access policies are intentionally left for Task 008.
