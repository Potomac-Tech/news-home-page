# Nexus Dashboard Card

Task 039 adds a Nexus access card to `/member`.

## Behavior

- Reads Supabase Auth claims for the signed-in user.
- Checks normalized `member_role_assignments` for active `scout`,
  `command_user`, staff, or member roles.
- Checks active user-scoped `entitlements` when available.
- Shows a role/entitlement status label in the member workspace.
- Shows a safe placeholder deep link to
  `https://nexus-explore.potomacdb.com` for Scout, Command, and staff roles.

The link is only a placeholder. It does not append a Supabase session, JWT, SSO
assertion, or one-time token. Production SSO should be implemented in a future
task with explicit token exchange, audit logging, and organization-aware access
checks.
