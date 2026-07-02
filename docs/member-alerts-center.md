# Member Alerts Center

Task 067 adds the alerts and notification foundation for watched lunar
intelligence.

## Schema

`supabase/migrations/20260702101257_alerts_center_notifications_freshness.sql`
adds:

- `member_alert_tier_limits` for Explorer, Scout, Command, and staff rule and
  delivery limits.
- `member_alert_rules` for watched-object, saved-search, stale-freshness,
  platform, and Command intelligence alert rules.
- `member_alert_feed_items` for unread badges, feed notices, source freshness,
  stale timestamps, and routed alert summaries.
- `member_alert_delivery_events` for in-app and email delivery audit state,
  attempts, scheduled/sent timestamps, provider IDs, and failure notes.

All public-schema tables have RLS enabled. Tier limits are public-readable.
Alert rules are Scout, Command, and staff managed. Feed and delivery rows are
owner-scoped, with organization-admin and staff review support through private
authorization helpers.

## UI

`/alerts` now renders a member alerts center with:

- unread, urgent, stale, and rule-count badges;
- tier-aware limit cards for Explorer, Scout, and Command;
- Scout/Command alert-rule creation and archive controls;
- Explorer read-only alert feed behavior;
- stale-data labels based on `stale_at`;
- delivery audit rows for in-app and email hooks;
- fallback notices when Supabase tables are unavailable.

## Remaining Runtime Work

The schema is ready for a scheduled job or Edge Function to evaluate active
rules, write feed items, and enqueue email deliveries. Live delivery behavior
still requires an email provider, applied remote migrations, and seeded member
test accounts.
