# Explorer, Scout, and Command Tier Packaging

Task 052 defines the product tier model and access-control notes for the
Potomac lunar industry terminal.

## Tier Names

| Product tier | Legacy/internal mapping | Commercial model | Primary buyer |
| --- | --- | --- | --- |
| Explorer | `member` role and `membership_tier = 'member'` | Free after manual approval | Individual readers and community members |
| Scout | `scout` role and `membership_tier = 'scout'` | Self-serve annual Stripe subscription at `$25,000/user/year` | Professional users and small teams |
| Command | `command_user` role and `membership_tier = 'command'` | Organization-level manual sales/admin approval | Enterprises, agencies, and institutional teams |

The user-facing noun remains "member" for approved people across all tiers.
"Explorer" is the free approved base tier, not a replacement for the member
identity term in RBAC, community copy, or support language.

## Approval and Billing Model

Explorer:

- Public visitors apply through the free member application flow.
- Admin approval grants `member_profiles.status = 'approved'` and the `member`
  role.
- Explorer has no Stripe entitlement and no self-serve payment step.

Scout:

- Approved members can start self-serve Stripe Checkout.
- The annual price is `$25,000` per user per year.
- Successful payment activates a user-scoped `entitlements.tier = 'scout'`
  record and the `scout` role.
- Failed, canceled, or deleted subscriptions should move the entitlement out of
  active status and revoke the effective Scout gate.

Command:

- Prospects use the Command interest workflow.
- Staff review, sell, approve, and provision Command manually.
- Access is organization-scoped through an active organization, active
  organization membership, organization-scoped Command entitlement, and
  `command_user` role assignment for covered users.
- Organization admins manage seats and billing-contact context through the
  organization portal.

## Included Features

| Capability | Public | Explorer | Scout | Command |
| --- | --- | --- | --- | --- |
| Public article teaser, citations, metadata, sitemap coverage | Yes | Yes | Yes | Yes |
| Full gated article bodies | No | Yes | Yes | Yes |
| Member chat | No | Yes | Yes | Yes |
| Moderated member forums | No | Yes | Yes | Yes |
| Event details where marked member-gated | Teaser only | Yes | Yes | Yes |
| Lunar datasets with public/demo release states | Public subset | Explorer subset | Scout subset | Command subset |
| Data marketplace | No | Upgrade gate | Yes | Yes |
| Economy dashboard and paid downloads | No | Upgrade gate | Yes | Yes |
| Experimental test data uploads/comparisons | No | Upgrade gate | Yes | Yes |
| RFQ posting, browsing, and responses | No | Upgrade gate | Yes | Yes |
| Watchlists, saved searches, advanced alerts | No | Future upgrade gate | Planned | Planned |
| CSV/PDF exports, API access, webhooks | No | No | Planned | Planned with higher limits |
| Command-exclusive intelligence allocation | No | No | No | Yes |
| Command perks and analyst/service delivery tracking | No | No | No | Yes |

## Initial Limits

Explorer:

- Free approved account.
- No paid exports, API keys, webhooks, RFQs, marketplace transactions, or paid
  dashboard downloads.
- Community access is subject to moderation, reporting, blocking, and future
  export-control guardrails.

Scout:

- One paid seat per active user-scoped annual subscription.
- RFQs and marketplace access are individual-seat gated unless later expanded
  through an organization feature.
- Paid exports, API keys, webhooks, watchlists, saved searches, and alerts
  should enforce per-user usage limits when implemented.

Command:

- Seat access is organization-scoped and manually provisioned.
- Organization admins can view organization members, seats, billing contact
  context, and active entitlements.
- Command-only data products may include exclusivity windows, allocation limits,
  service obligations, sponsorship benefits, and analyst support commitments.

## Upgrade Paths

Public to Explorer:

- Use `/apply`.
- Application remains pending until admin approval.
- Approval grants Explorer access but does not grant paid features.

Explorer to Scout:

- Use the Scout checkout entry point from the member workspace or pricing page.
- Stripe Checkout must run server-side and only for eligible approved members.
- The Stripe webhook is the source of truth for activating Scout entitlement.

Explorer or Scout to Command:

- Use `/command`.
- Staff handle sales qualification, organization creation, seat assignment, and
  organization-level entitlement activation manually.
- Command access should not be self-serve until a separate enterprise billing
  workflow is explicitly designed.

Command seat changes:

- Organization admins and staff manage membership through the organization/admin
  workflows.
- Seat changes must preserve audit history and avoid user-editable metadata.

## Access-Control Notes

- Do not authorize from `user_metadata` or other user-editable metadata.
- Use normalized tables: `member_profiles`, `member_role_assignments`,
  `organizations`, `organization_members`, and `entitlements`.
- Public tables exposed through Supabase APIs need explicit grants plus RLS.
- Explorer gates should accept the active `member`, `scout`, and
  `command_user` roles.
- Scout gates should accept active `scout` and `command_user` roles.
- Command gates should accept active `command_user` roles and, where needed,
  active organization membership/organization admin checks.
- Staff gates should remain explicit by function and role. Common staff roles
  are `editor`, `analyst`, `moderator`, and `admin`.
- Service-role operations may perform provisioning and webhook updates, but
  browser clients must never receive service-role or secret keys.

## Legacy Member Terminology

Use "member" when referring to people with approved access, regardless of tier:

- "members can chat"
- "member workspace"
- "member profile"
- "member role assignments"

Use tier names when describing package, price, entitlement, and gates:

- "Explorer access is free after approval"
- "Scout is `$25,000/user/year`"
- "Command is organization-level"
- "Scout and Command users can access RFQs"

Existing database enum values and roles may keep `member` as the Explorer
mapping. Renaming those values is unnecessary and would create avoidable
migration risk.
