# Stripe Scout Checkout

Task 011 adds the Scout checkout integration scaffold.

## Pricing

Scout membership is self-serve at:

```text
$25,000 per user per year
```

Stripe should be configured with:

- Product: `Potomac Scout`
- Price type: recurring subscription
- Billing period: yearly
- Currency: USD
- Unit amount: `2500000` cents

Store the resulting Stripe Price ID in:

```text
STRIPE_SCOUT_PRICE_ID=price_xxx
```

## Environment Variables

Add these to `next-app/.env.local`:

```text
STRIPE_SECRET_KEY=sk_live_or_test_xxx
STRIPE_SCOUT_PRICE_ID=price_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

`STRIPE_SECRET_KEY` is server-only and must not be exposed through a `NEXT_PUBLIC_` variable.

## Route

```text
POST /api/stripe/scout-checkout
```

The route:

- Requires a signed-in Supabase user.
- Requires `member_profiles.status = 'approved'`.
- Refuses checkout if an active Scout entitlement already exists.
- Creates a Stripe Checkout Session with `mode = 'subscription'`.
- Adds `user_id`, `tier = 'scout'`, and `annual_price_usd = '25000'` metadata to the session and subscription.

Successful payment does not activate access in this task. Entitlement activation belongs to Task 012 and should be handled by a verified Stripe webhook.
