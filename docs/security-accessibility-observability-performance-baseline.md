# Security, Accessibility, Analytics, Observability, And Performance Baseline

Task 072 adds a production-readiness baseline for Potomac public and member
surfaces.

## Security Headers

`next.config.mjs` now applies global headers:

- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`
- `X-DNS-Prefetch-Control`
- `Content-Security-Policy-Report-Only`

The CSP is report-only because the current Next runtime and Stripe/Supabase
integration still need compatibility review before enforcing a blocking policy.

## Rate-Limit Baseline

`lib/platform/baseline.ts` defines initial limits for:

- public forms per IP per hour
- authenticated writes per user per minute
- API requests per key per minute
- webhook deliveries per subscription per minute
- export jobs per user per day

Production enforcement should happen at the edge, API route, or database level
depending on the workflow. Public application and Cabeus Council interest forms should
be IP and email limited. Authenticated writes should be user and organization
limited. Developer API calls should use API-key quotas and usage logs from Task
070.

## Input Validation And CSRF/Session Protections

Current server actions and API routes should continue using typed allowlists,
length checks, enum checks, route checks, and server-side entitlement checks.
Supabase session refresh remains centralized in `middleware.ts`.

Follow-on hardening should add:

- shared validation helpers for form and API payloads
- CSRF tokens for high-risk state-changing forms when same-site cookie behavior
  is not enough
- idempotency keys for billing, export, webhook, RFQ, and marketplace writes
- stricter upload validation before broad file or community-content launch

## Accessibility Baseline

The baseline module lists requirements for keyboard access, focus states,
semantic structure, form labels/errors, mobile and desktop overflow checks, and
contrast review. Production verification should include automated accessibility
checks plus manual review of:

- login and account paths
- article gating
- Scout checkout and developer portal
- alerts and saved work
- chat, forums, RFQs, and marketplace workflows
- admin review workflows

## Analytics And Observability Hooks

`trackAnalyticsEvent(...)` dispatches a browser event named `potomac:analytics`.
This keeps analytics opt-in and vendor-neutral until a production analytics
provider is selected.

`logPlatformEvent(...)` emits structured console logs for local and server-side
development. Production observability should route these events to a managed log
or tracing sink and redact secrets, gated article bodies, API keys, webhook
secrets, and private member messages.

## Performance Budgets

The baseline budgets are:

- First Contentful Paint: 1800 ms
- Largest Contentful Paint: 2500 ms
- Cumulative Layout Shift: 0.1
- Interaction to Next Paint: 200 ms
- Initial JavaScript: 250 KB
- Route data payload: 100 KB

These are target budgets for page and workflow reviews. They are not currently
enforced in CI.

## Operational States

Shared operational state copy covers:

- ready
- loading
- empty
- error
- stale
- offline
- locked

New modules should explicitly render these states instead of failing blank,
especially when Supabase credentials, remote migrations, paid entitlements,
source freshness, or network access are unavailable.

## Remaining Production Work

This task establishes headers, constants, hooks, and documentation. Remaining
work includes CI enforcement, automated accessibility tests, API rate-limit
middleware, CSP reporting endpoints, provider-backed analytics, managed
observability, and measured Core Web Vitals reporting.
