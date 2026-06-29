# Space Weather Dashboard

Task 041 adds the first source-backed space-weather dashboard module for
members.

## Scope

The initial sources are curated snapshots from official space-weather products:

- NOAA SWPC current conditions
- NOAA SWPC Planetary K-index
- NOAA SWPC Real-Time Solar Wind
- NASA CCMC DONKI

The module does not scrape live feeds yet. It stores reviewed source snapshots
with timestamps, metrics, freshness state, and attribution so a later ingestion
job can update the same table.

## Data Model

`supabase/migrations/20260629220633_space_weather_sources.sql` creates:

- `public.space_weather_source_snapshots`
- `public.space_weather_freshness_status`
- `public.space_weather_publication_status`

Each snapshot includes source agency, source product, source URL, source updated
time, retrieval time, stale-after threshold, freshness state, risk label, status
summary, and JSON key metrics.

Published snapshots are readable by authenticated members. Staff roles
(`editor`, `analyst`, `admin`) can manage the records through RLS policies using
normalized role assignments.

## Dashboard

`/member` now includes a "Source Conditions" card. It shows:

- source product and agency
- current/watching/stale/unavailable label
- source update time in UTC
- compact key metrics
- source link attribution
- concise status summary

When Supabase public configuration is unavailable, the card uses safe fallback
records from the official NOAA and NASA source pages.

## Verification Notes

Live reads require the Potomac Supabase project `xlpkdoeldtlhearqajat`, applied
migrations, and a signed-in member. Local no-env previews use fallback records.
