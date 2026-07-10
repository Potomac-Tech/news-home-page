# Resend Free Email Operations

The application sends operational email through the server-only Resend adapter in `lib/email/resend.ts`. It uses `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `RESEND_TO_EMAIL`; none may use a `NEXT_PUBLIC_` prefix.

- The approved sender and default delivery inbox are `info@potomacdb.com`.
- Meridian, Pathfinder, Source, UDRI fallback, alerts, and operational forms may use their documented `RESEND_*_TO_EMAIL` override. Without one, they deliver to the default inbox.
- Production must retain the Resend Free plan. Do not enable paid overage, pay-as-you-go, dedicated IPs, paid add-ons, marketing broadcasts, or paid automations without a CEO-approved configuration change.
- Before release, verify `potomacdb.com` and `info@potomacdb.com` in Resend, check DNS, confirm Cloudflare runtime secrets, and review the private `outbound_email_delivery_events` audit table.
- When provider delivery fails or configuration is missing, the saved lead remains accurate and the public form reports a pending/configuration state rather than claiming success.
