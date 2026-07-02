# Legal, Trust, Account Lifecycle, And Consent Surfaces

Task 071 adds baseline public and member trust surfaces for the Potomac lunar
intelligence platform.

## Public Trust Pages

- `/legal/terms`: membership, paid access, acceptable use, content reliance, and
  paid-feature framing.
- `/legal/privacy`: account, workflow, billing, enterprise, and usage-data
  handling baseline.
- `/legal/cookies`: essential, preference, and analytics cookie categories.
- `/legal/accessibility`: accessibility commitment, testing baseline, and support
  path.
- `/legal/data-safety`: access control, uploads/community content, exports, APIs,
  webhooks, and incident contact paths.

## Account Lifecycle

`/account/delete` provides a deletion request flow with a mailto support action
and a checklist covering account email, Command organization context, Scout
billing cancellation, export review, and secret-safe support behavior.

The account center now links cookie preferences, account deletion, and data
safety alongside sign-in, member workspace, organization, pricing, application,
and Command paths.

## Consent Controls

`/legal/cookies` includes a client-side cookie preference control. Essential
cookies remain always on. Preference and analytics choices are stored in local
browser storage under `potomac-cookie-preferences`.

## Discoverability

The footer links all trust routes, and the sitemap includes legal and account
deletion pages. These pages are public so visitors and members can review the
baseline terms and controls before applying, paying, uploading, exporting, or
using community workflows.

## Remaining Production Work

These surfaces are baseline product pages, not legal counsel-reviewed production
policies. Before broad launch, counsel should review final copy, support
operations should define SLA/retention handling, and account deletion should be
connected to a verified backend workflow.
