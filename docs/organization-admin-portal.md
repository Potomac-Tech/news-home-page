# Organization Admin Portal

Task 014 adds a scoped organization workspace at `/organization` in the Next.js migration scaffold.

## What It Does

- Requires a signed-in Supabase Auth user.
- Allows access only when the user has an active `org_admin` organization membership or an active organization-scoped `org_admin` role assignment.
- Lists each permitted organization with status, slug, billing contact, seat limit, contract reference, and last update date.
- Shows active seat usage by counting active `organization_members` rows against `organizations.seat_limit`.
- Shows member rows with profile-backed names, emails, titles, organization role, status, and join date.
- Shows organization entitlements with tier, status, source, start/end dates, and external or Stripe references.

## Authorization Model

The page uses `next-app/lib/auth/org-admin.ts`, which checks Supabase Auth claims and then queries:

- `member_role_assignments` for active `org_admin` role assignments with `organization_id`.
- `organization_members` for active `org_admin` memberships.

The resulting organization IDs are used as the only query scope. Row-level security from Task 008 still enforces the final database boundary for organizations, members, profiles, entitlements, and audit events.

## Current Limitations

- The portal is read-only. Seat invitations, removals, and billing contact edits should be added with explicit server actions once email invitation and audit semantics are defined.
- Live verification requires the Supabase migrations to be applied to project `xlpkdoeldtlhearqajat` and a seeded org-admin account.
- Billing display currently uses `organizations.primary_billing_email`; richer billing contacts can be added later if the schema expands.

## Verification

- `npm run build:next`
- `npm run build`

Live database reads were not exercised during implementation because Supabase keys were not available and local migrations were not applied to a reachable database.
