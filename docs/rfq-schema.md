# RFQ Schema

Task 050 adds the database model and access rules for Scout and Command RFQ
workflows.

## Scope

The migration `20260630180219_rfq_schema_rls_moderation.sql` adds:

- `rfq_posts`
- `rfq_invited_organizations`
- `rfq_resource_links`
- `rfq_responses`
- `rfq_response_resource_links`
- `rfq_status_events`
- `rfq_reports`
- `rfq_moderation_actions`
- `rfq_audit_events`

It also adds RFQ visibility, RFQ status, response status, report status, and
moderation action enum types.

## Access Model

RFQs are limited to Scout, Command, and authorized staff accounts through
normalized role assignments. The helper functions live in `app_private` and do
not depend on user-editable metadata:

- `app_private.can_use_rfqs(...)` grants Scout/Command RFQ access.
- `app_private.can_use_command_rfqs(...)` gates Command-only RFQs.
- `app_private.can_moderate_rfqs(...)` grants moderation to moderator,
  analyst, and admin roles.
- `app_private.can_manage_rfq_post(...)` checks creator, organization admin,
  and moderator/admin control.
- `app_private.can_access_rfq_post(...)` checks visibility, status, invited
  organization access, and moderation access.
- `app_private.can_respond_to_rfq(...)` checks response eligibility.
- `app_private.can_access_rfq_response(...)` limits proposal access to the
  responder, RFQ owner, organization admins, and moderators.

## Safety Coverage

The model supports:

- RFQ posts with organization attribution, categories, due dates, status, and
  visibility controls
- Invited-organization RFQs for scoped opportunities
- External links or Supabase Storage paths for RFQ and response attachments
- Response submissions with draft, submitted, review, accepted, withdrawn, and
  moderation states
- Status-change history
- Member reports and moderator action records
- Retained audit events
- Explicit authenticated/service grants and RLS on every exposed table

## Verification Limit

Live RLS tests require the migration applied to the Potomac Supabase project and
seeded Scout, Command, organization admin, moderator, analyst, and admin users.
Without those, local verification is limited to build, static search, migration
inspection, and local Supabase CLI connectivity checks.
