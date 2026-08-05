# Operational Quality Controls

Task 109 turns the earlier production-readiness baseline into enforced runtime
and CI controls.

## Consent-Aware Telemetry

The browser records navigation, Core Web Vitals, and client errors only after a
visitor accepts analytics cookies. `POST /api/telemetry` independently requires
the consent header, validates and limits the payload, removes email-like values,
hashes the request fingerprint with the server-only `TELEMETRY_HASH_SECRET`, and
stores no raw IP address.

Events are stored in `public.operational_telemetry_events`. Members with the
`admin` or `analyst` role can read events; writes use the server service role.
The `cleanup-operational-telemetry` Supabase cron removes events older than 30
days every day at 04:17 UTC.

## Logs, Errors, And Traces

Cloudflare managed Worker logs and traces are enabled at one percent sampling in
`wrangler.jsonc`. The telemetry endpoint emits structured request outcomes, and
the global error boundary captures a redacted client error when consent exists.

Cloudflare counts persisted logs and trace spans against one shared
observability allowance. The `cabeus-observability-budget-guard` Worker checks
the target Worker's current UTC-day event count every five minutes and applies
the following cost guardrails through Cloudflare's script-settings API:

| Daily events | Logs | Traces | State |
| ---: | ---: | ---: | --- |
| 0-189,999 | 1% | 1% | Normal |
| 190,000-194,999 | 0.5% | 0.5% | Reduced |
| 195,000-198,999 | 0.1% | 0.1% | Critical |
| 199,000+ | Off | Off | Paused |

The reduction thresholds use each UTC day's event count. Reaching 199,000
creates a persistent monthly pause in the guard's private KV namespace; the
pause expires at the next UTC calendar-month boundary. The guard fails closed
by attempting to pause both signals if its usage query fails. Its own Cloudflare
observability is disabled so its checks do not consume the shared allowance.
The control token is stored only as the guard Worker's encrypted
`CLOUDFLARE_OBSERVABILITY_TOKEN` secret and has only Workers Observability Write
and Workers Scripts Edit access for the Cabeus account. `keep_vars` preserves
that dashboard-managed secret across later Wrangler deployments.

Cloudflare tracing and the shared event model are documented at
<https://developers.cloudflare.com/workers/observability/traces/>. The telemetry
query and script-settings endpoints are documented at
<https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/query/>
and
<https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/settings/methods/edit/>.

## CI Accessibility And Performance

The `Quality gates` GitHub Actions workflow builds and starts the production app,
then runs Playwright and axe checks at 390 px and 1280 px for:

- `/`
- `/news`
- `/request-access`
- `/member`
- `/admin/applications`

Serious or critical accessibility violations fail CI. The enforced budgets are
FCP at 1,800 ms, LCP at 2,500 ms, CLS at 0.1, initial JavaScript at 250 KB, route
HTML at 100 KB, and no horizontal overflow. The report is uploaded as the
`quality-audit` workflow artifact.

## API And Telemetry Rate Limits

Developer API keys are limited to 120 requests per rolling minute before the
existing monthly entitlement quota is claimed. Rejections are recorded in the
developer usage audit log. Telemetry fingerprints are limited to 60 accepted
events per minute, with short-lived counters kept in the private schema.

## Supabase Advisor Triage

The July 14, 2026 performance advisor run initially found seven foreign keys
without a leading covering index. Migration
`20260714025344_add_covering_fk_indexes.sql` fixed all seven; the advisor rerun
reports zero unindexed foreign keys.

The remaining performance notices are temporarily accepted for the prelaunch
dataset and must be reviewed against production query statistics after traffic
is available:

- 466 unused-index notices: expected before representative traffic; foreign-key,
  uniqueness, and authorization indexes are retained for correctness and future
  query plans.
- 86 `auth_rls_initplan` notices: existing policies should migrate repeated auth
  function calls to init-plan-friendly expressions in a dedicated RLS pass.
- 113 multiple-permissive-policy notices: many represent intentional staff plus
  member read paths; consolidate only with role-journey regression coverage.
- One Auth fixed-connection notice: revisit when the Supabase compute size or
  expected authentication concurrency changes.

The security advisor found no notice tied to the operational telemetry tables.
Existing project-wide security notices remain separate hardening work and are
not represented as resolved by Task 109.
