# Resend Free Email Operations

The application sends operational email through the server-only Resend adapter in `lib/email/resend.ts`. It uses `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `RESEND_TO_EMAIL`; none may use a `NEXT_PUBLIC_` prefix.

- The approved sender and default delivery inbox are `info@potomacdb.com`.
- Meridian, Pathfinder, Source, UDRI fallback, alerts, and operational forms may use their documented `RESEND_*_TO_EMAIL` override. Without one, they deliver to the default inbox.
- Production must retain the Resend Free plan. Do not enable paid overage, pay-as-you-go, dedicated IPs, paid add-ons, marketing broadcasts, or paid automations without a CEO-approved configuration change.
- The quota governor reserves capacity atomically before each send. Routine alerts are limited to 90/day and 2,700/month; high-priority operational forms can use the reserved capacity up to the 100/day and 3,000/month hard caps. Inbound receiving remains disabled because received messages count toward the provider quota.
- Admins review the live quota counters and held queue at `/admin/email`. A held entry is queued for operational follow-up; it is never represented publicly as a sent email.
- Before release, verify `potomacdb.com` and `info@potomacdb.com` in Resend, check DNS, confirm Cloudflare runtime secrets, and review the private `outbound_email_delivery_events` audit table.
- When provider delivery fails or configuration is missing, the saved lead remains accurate and the public form reports a pending/configuration state rather than claiming success.
