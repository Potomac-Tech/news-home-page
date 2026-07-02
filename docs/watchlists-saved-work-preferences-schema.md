# Watchlists, Saved Work, And Preferences Schema

Task 065 adds the database foundation for Scout and Command personalization.

## Scope

The migration
`supabase/migrations/20260702050828_watchlists_saved_work_preferences.sql`
adds:

- `member_watchlists` for user and organization-scoped watchlist containers.
- `member_watchlist_items` for watched companies, missions, procurements,
  regulatory records, events, datasets, marketplace records, articles,
  methodology sources, calculators, RFQs, and forum threads.
- `member_saved_searches` for query, scope, filter, alert-frequency, and
  latest-run metadata.
- `member_reading_list_items` for saved article and intelligence records with
  read/archive state.
- `member_notification_preferences` for in-app and email delivery preferences
  by object category.
- `member_dashboard_preferences` for default filters, pinned modules, hidden
  modules, and terminal layout preferences.
- `member_saved_work_audit_events` for ownership-safe preference and saved-work
  audit history.

## Access Model

Saved-work writes are limited to Scout, Command, and staff roles through
`app_private.can_use_saved_work()`.

Rows are owner-scoped by `owner_user_id` and may optionally be
organization-scoped by `organization_id`. Owners can read and manage their own
rows. Organization admins can manage organization-scoped rows. Analysts and
admins can inspect rows for support, abuse review, and audit workflows.

The model intentionally uses normalized role assignments and organization
membership helpers. It does not authorize from user-editable metadata.

## Data API And RLS Notes

All new public-schema tables have RLS enabled and explicit grants for
authenticated users. The migration follows the current Supabase Data API model:
tables are not assumed to be automatically exposed, and RLS remains the row
visibility boundary once table access is granted.

The schema indexes foreign keys and common filtered access paths, including
active watchlist items, alertable saved searches, owner reading-list state, and
organization-scoped preferences.

## Task 066 UI Contract

The UI should let Scout and Command members:

- Add/remove watched companies, missions, procurements, regulatory records,
  events, datasets, and marketplace records.
- Save and rename searches, choose alert frequency, and see unsupported-object
  states gracefully.
- Save/remove reading-list items and mark them read or archived.
- Configure notification preferences for in-app and email channels.
- Set dashboard defaults such as pinned modules and default filters.

Explorer users should see upgrade prompts rather than write controls.

## Verification

Static verification and build results are recorded in
`docs/potomac-news-intelligence-tasks.md`.
