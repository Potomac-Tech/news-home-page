# RFQ UI

Task 051 adds the protected `/member/rfqs` workspace for Scout and Command RFQ
workflows.

## Scope

The route includes:

- RFQ list with selected-detail navigation
- RFQ detail view with status, visibility, due date, budget, and location
- RFQ post form with organization attribution, categories, dates, summary, and
  description
- RFQ response form for open opportunities
- Visible response list for authorized RFQ owners, responders, organization
  admins, and moderators under RLS
- Status update control for RFQ owners, organization admins, and moderators
- Report controls for RFQs and responses
- Member dashboard link to `/member/rfqs`

## Access Model

`next-app/lib/auth/rfq.ts` gates the route to active Scout, Command, moderator,
analyst, or admin role assignments. Signed-out users are redirected to login,
Explorer-only users see a paid-access gate, and all RFQ rows remain constrained
by the Task 050 Supabase RLS policies.

## Verification Limit

The no-config gate can be checked locally without credentials. Live RFQ posting,
browsing, responding, reporting, organization attribution, and moderation checks
require the RFQ migration applied to the Potomac Supabase project plus seeded
Scout, Command, organization admin, moderator, analyst, and admin users.
