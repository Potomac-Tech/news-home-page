# Scout/Cabeus Council Developer Platform

Task 070 adds the foundation for paid API access, exports, webhooks, and a
developer portal.

## Data Model

`developer_tier_limits` defines Scout, Cabeus Council, and staff limits for monthly API
quota, daily exports, active API keys, webhook subscriptions, Cabeus Council endpoints,
and usage retention.

`developer_endpoint_catalog` documents versioned endpoint availability, route
templates, response format, quota weight, minimum tier, and whether an endpoint
contains Cabeus Council-only data.

`developer_api_keys` stores API-key metadata, prefixes, and hashes only. Raw API
secrets are not stored and should only be shown once by a future server-side key
generation flow.

`developer_api_usage_logs` records API requests, export downloads, webhook
delivery usage, status codes, quota units, response time, and request metadata.

`developer_webhook_subscriptions` and `developer_webhook_delivery_events` support
Cabeus Council webhook subscriptions, event selection, delivery state, retries, and
failure tracking.

`developer_export_jobs` tracks paid CSV, PDF, and JSON export jobs, requested
filters, storage output paths, row counts, file sizes, readiness, expiration,
and failure state.

## Access Rules

The migration uses normalized role assignments rather than user-editable
metadata:

- Scout, Cabeus Council, editor, analyst, and admin roles can use developer-platform
  records.
- Webhook writes are limited to Cabeus Council and staff roles.
- Owners can read and manage their own records.
- Organization admins can access organization-scoped records.
- Analysts and admins can inspect operational records.
- Endpoint catalog and tier limits are readable for pricing and documentation
  surfaces.

All public-schema tables enable RLS and include explicit Data API grants.

## Portal

`/member/developer` is a dynamic paid-member route. It shows:

- tier limits and quotas
- endpoint catalog records
- API key prefixes and statuses
- recent usage logs
- webhook subscriptions and Cabeus Council-only gating
- recent export jobs

When the Task 070 migration is not applied in a local or remote environment, the
route renders fallback scaffold records and a warning instead of failing blank.

## Follow-On Work

This task intentionally creates infrastructure rather than production API
runtime behavior. Follow-on work should add:

- one-time API key generation and secret display
- actual `/api/v1/*` handlers
- API key authentication middleware and quota enforcement
- export workers and signed download URLs
- webhook dispatch workers with signing and retry backoff
- automated RLS and API-gate tests
