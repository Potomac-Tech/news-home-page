# Lunar Mission Object Tracking Schema

Task 055 adds the database foundation for lunar mission tracking.

## Scope

The migration `20260630231101_lunar_mission_object_tracking.sql` models:

- lunar mission operators
- lunar missions
- spacecraft, landers, rovers, payloads, instruments, and lunar satellites
- launch windows and launch status
- landing sites and coordinates
- payload and instrument details
- mission/object status history
- source citations with review status, license notes, freshness, confidence,
  and supported-field metadata

## Access Model

Rows carry `publication_status` and `visibility_tier` fields. Public rows can be
published for anonymous teaser/catalog access. Explorer, Scout, and Command rows
use the existing normalized role assignments through
`app_private.can_access_lunar_tracking_tier(...)`.

The migration does not use user-editable metadata for authorization.

## RLS and Grants

RLS is enabled on every new public table. Column-level select grants expose only
the intended read fields to `anon` and `authenticated`; staff insert/update/delete
access is gated through editor, analyst, and admin roles. `service_role` receives
full table access for controlled backend jobs.

Because Supabase changed default Data/GraphQL exposure behavior for new public
tables in 2026, a production rollout should also confirm the project's Data API
schema settings before relying on client reads.

## Verification Limit

Static checks can confirm the migration structure, grants, policies, and helper
function references. Live RLS behavior requires an applied schema in project
`xlpkdoeldtlhearqajat`, Potomac Supabase credentials, and seeded public,
Explorer, Scout, Command, and staff test users.
