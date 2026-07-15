# Resend Free Email Operations

The application sends operational email through the server-only Resend adapter in `lib/email/resend.ts`. It uses `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `RESEND_TO_EMAIL`; none may use a `NEXT_PUBLIC_` prefix.

- The approved sender and default delivery inbox are `info@potomacdb.com`.
- Meridian, Pathfinder, Source, UDRI fallback, alerts, and operational forms may use their documented `RESEND_*_TO_EMAIL` override. Without one, they deliver to the default inbox.
- Production must retain the Resend Free plan. Do not enable paid overage, pay-as-you-go, dedicated IPs, paid add-ons, marketing broadcasts, or paid automations without a CEO-approved configuration change.
- The quota governor reserves capacity atomically before each send. Routine alerts are limited to 90/day and 2,700/month; high-priority operational forms can use the reserved capacity up to the 100/day and 3,000/month hard caps. Inbound receiving remains disabled because received messages count toward the provider quota.
- Admins review the live quota counters and held queue at `/admin/email`. A held entry is queued for operational follow-up; it is never represented publicly as a sent email.
- Before release, verify `potomacdb.com` and `info@potomacdb.com` in Resend, check DNS, confirm Cloudflare runtime secrets, and review the private `outbound_email_delivery_events` audit table.
- When provider delivery fails or configuration is missing, the saved lead remains accurate and the public form reports a pending/configuration state rather than claiming success.

## Daily and monthly resets

Review `/admin/email` before the UTC daily reset and on the first UTC day of each month. Compare the quota ledger with Resend usage, investigate discrepancies, and leave held routine alerts queued until the applicable reset. Operational inquiries retain the reserved 10 daily and 300 monthly messages.

## Manual resend

An administrator may retry a held or failed entry from the email operations queue only after confirming available quota and correcting the recorded failure. Reuse the existing event and idempotency key, record the new provider message ID or failure, and never create a second lead to retry delivery.

## Upgrade escalation

Escalate a plan review only when sustained legitimate demand cannot be handled through digests, priority reserves, and next-reset delivery. A CEO-approved change must update the quota policy, runtime guards, cost controls, tests, and this runbook before any paid plan, overage, or add-on is enabled.

## Capped delivery behavior

Public inquiries are persisted before email is attempted. At a cap, the UI reports delayed follow-up, the queue records a retry time, and administrators receive an in-app operational signal. Member intelligence remains available in app; routine email alerts are combined into digests or deferred until reset.

## Live release verification

1. Confirm `potomacdb.com` and the `info@potomacdb.com` sender show `verified` in Resend.
2. Confirm Resend Free is active, inbound receiving is disabled, and only one sending domain is configured.
3. Confirm Cloudflare lists `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_TO_EMAIL`, `RESEND_PLAN`, `RESEND_INBOUND_RECEIVING`, and `RESEND_SENDING_DOMAIN_COUNT` as encrypted secrets. Never print secret values.
4. Submit one authorized production inquiry and confirm its lead, quota event, Resend provider message ID, Reply-To, and delivery status in `/admin/email` and Resend logs.
5. Run `npm run test:email-operations`; retain `.tmp/email-operations-audit.json` with the release evidence.
