# Nexus Dashboard Card

Task 039 introduced a Nexus access card on `/member`. Task 117 replaces the
placeholder with the production member handoff.

## Behavior

- Reads Supabase Auth claims for the signed-in user.
- Checks normalized `member_role_assignments` for active `scout`,
  `command_user`, staff, or member roles.
- Checks active user-scoped `entitlements` when available.
- Shows a role/entitlement status label in the member workspace.
- Shows the protected production handoff to
  `https://nexus-explore.potomacdb.com/0auth` for approved Explorer, Scout,
  Meridian, and staff accounts.
- Both applications use Supabase project `xlpkdoeldtlhearqajat`, so the same
  `auth.users.id` identifies a member in both products.
- The server generates a one-time Supabase magic-link handoff for the currently
  authenticated, verified member. No service key or reusable session token is
  exposed to the client application.
- Membership maps to Nexus roles as follows: Explorer to `base_user`, Scout to
  `premium_user`, and Meridian/Command to `superior_user`. Nexus `admin` values
  are preserved.
- Nexus checks for an active normalized member role in addition to reading the
  mapped profile role. A direct Nexus sign-up without approved Cabeus membership
  remains blocked.

The application never appends a service credential or reusable session token to
the Nexus URL. Supabase processes the short-lived verification link and creates
the destination-origin session after verifying the fixed redirect target.
