# Stripe Scout Entitlement Webhook

Task 012 adds webhook-based Scout entitlement activation.

## Route

```text
POST /api/stripe/webhook
```

The route verifies the Stripe signature with `STRIPE_WEBHOOK_SECRET`, records the event id in `stripe_webhook_events`, and ignores duplicate event ids.

## Handled Events

| Event | Behavior |
| --- | --- |
| `checkout.session.completed` | Activates a user-scoped Scout entitlement and grants the `scout` role when the Checkout Session metadata has `tier = scout`. |
| `customer.subscription.updated` | Keeps active/trialing Scout subscriptions active; marks other Scout subscription states pending or revoked. |
| `customer.subscription.deleted` | Revokes the Scout entitlement for the subscription. |
| `invoice.payment_failed` | Marks the Scout entitlement pending and records an audit event. |

## Required Metadata

Checkout and subscription metadata should include:

```text
user_id=<supabase auth user id>
tier=scout
annual_price_usd=25000
```

The checkout route created in Task 011 sets this metadata.

## Environment Variables

```text
STRIPE_SECRET_KEY=sk_live_or_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
```

`SUPABASE_SECRET_KEY` is used only by the server-side webhook service client. It must never be exposed to browser code.

## Verification Limit

The webhook route builds and includes idempotency handling, entitlement updates, role grants, payment-failure handling, and audit-event writes. Live webhook delivery was not exercised in this run because Stripe secrets, a Supabase service secret, and an applied remote schema were unavailable.
