# Member Alert Evaluation Operations

## Runtime

- Supabase Cron invokes `private.invoke_member_alert_evaluator()` every 15 minutes.
- The function reads the production endpoint and bearer token from Supabase Vault, then uses `pg_net` to call `/api/internal/alerts/evaluate`.
- The API requires `ALERT_EVALUATOR_SECRET` and a server-only `SUPABASE_SECRET_KEY`. Neither value may use a `NEXT_PUBLIC_` prefix.
- The evaluator covers watched companies, lunar missions, procurements, regulatory records, datasets, events, marketplace requests and offers, and user- or organization-scoped Command intelligence allocations.

## Delivery Behavior

- Deterministic deduplication prevents the same source update from creating duplicate feed entries.
- In-app notices appear in the Alerts Center and update its unread count.
- Routine email is grouped into one digest per member and delivery window. The default window is daily at 13:00 UTC, with up to 20 items per digest.
- Urgent alerts can send immediately only while the configured immediate reserve and alert budget remain. Otherwise they join the next digest without affecting the in-app notice.
- Email delivery uses the existing Resend Free quota and rate governor. Held, low-budget, per-member-cap, or failed sends remain queued for a later digest; individual delivery retries stop after five attempts.
- Notification preferences can disable a channel or object category. Quiet hours defer email until the member's local quiet period ends.
- Every evaluator run is recorded in `member_alert_evaluation_runs`. Each channel attempt is visible in `member_alert_delivery_events`; provider-level audit remains in `private.outbound_email_delivery_events`.

Admins manage digest cadence, UTC send hour, daily alert email cap, per-member cap, immediate reserve, priority threshold, low-budget buffer, and maximum digest size at `/admin/email`.

## Preference Management

Every alert email links to `/member/saved-work#notification-preferences`. Members can disable email globally or by object category and can set local quiet hours. This preference page is the unsubscribe path for operational intelligence alerts; transactional account email is managed separately.

## Required Secrets

1. Store `SUPABASE_SECRET_KEY` and `ALERT_EVALUATOR_SECRET` as Cloudflare server-side secrets.
2. Store the endpoint URL in Supabase Vault as `member_alert_evaluator_url`.
3. Store the matching bearer token in Supabase Vault as `member_alert_evaluator_secret`.
4. Keep `RESEND_API_KEY` and `RESEND_FROM_EMAIL` server-side.

## Verification

Run the endpoint manually with the bearer token, confirm a completed row in `member_alert_evaluation_runs`, and inspect `cron.job_run_details` plus `net._http_response` when diagnosing scheduler failures. Seeded alert rules may be used in a non-production project; do not send test alerts to real members without approval.
