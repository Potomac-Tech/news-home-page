# Lunar Mission Tracker Modules

Task 056 added public and member-facing mission tracker modules for the lunar
terminal.

## Surfaces

- `/launches` shows source-backed lunar launch-window modules with mission
  status, vehicle/site context, freshness, confidence, filters, and detail-page
  links.
- `/spacecraft` shows spacecraft, lander, rover, payload-adjacent, and lunar
  satellite modules with object status, phase, freshness, confidence, filters,
  and detail-page links.
- `/missions/[slug]` provides a mission detail page with launch windows,
  mission objects, payloads/instruments, citations, source freshness, quality,
  and tier labels.
- `/member/missions` is the signed-in member tracker entry point. It uses the
  normalized member roles to unlock Explorer, Scout, Command, and staff detail
  levels when the Potomac Supabase environment is configured.

## Data Access

The tracker reads from the Task 055 tables:

- `lunar_missions`
- `lunar_mission_objects`
- `lunar_launch_windows`
- `lunar_landing_sites`
- `lunar_payloads`
- `lunar_mission_status_events`
- `lunar_mission_source_citations`

The UI uses `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` only after validating the canonical
project ref `xlpkdoeldtlhearqajat`. It continues to reject any other Supabase
project URL through the shared config guard.

## Tier Behavior

- Public pages show public tracker records, public source context, mission
  summaries, and locked-detail prompts.
- Explorer members can read member-level object and status context.
- Scout members can read Scout-level payload and object details.
- Command users and staff are treated as the highest read tier for tracker
  detail pages.

When Supabase credentials are unavailable, public tracker routes render local
fallback records so the route, layout, filter, and detail-page behavior can be
verified without live database access. The protected member route renders a
clear no-config gate instead of using fallback member data.

## Verification Notes

`npm run build:next` passed and registered `/launches`, `/spacecraft`,
`/missions/[slug]`, and `/member/missions`.

`npm run build` passed for the existing Vite site.

`git diff --check` passed with the recurring LF-to-CRLF warnings on touched
files.

Local route smoke checks against `http://127.0.0.1:3025` returned `200` for:

- `/launches`
- `/spacecraft`
- `/missions/artemis-ii`
- `/member/missions`

The checks confirmed the expected tracker headings, fallback mission records,
detail sections, source sections, and the member no-config Supabase gate.

`npm run lint` could not run because the repository still has no ESLint
configuration file.

Live Supabase tracker reads and role-gated detail unlocking were not exercised
because no Potomac Supabase publishable key, applied reachable schema, or seeded
Explorer/Scout/Command/staff test users were available in this session.
