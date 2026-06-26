# Lunar Economy Model Schema

Task 029 adds the database foundation for the daily lunar economy tracker. It is
scoped to the canonical Potomac Supabase project ref `xlpkdoeldtlhearqajat`.

## Data Model

- `public.lunar_economy_model_versions`: versioned methodology records with
  status, scope, currency, public visibility, validity dates, and published
  timestamps.
- `public.lunar_economy_model_assumptions`: named assumptions for a model
  version, including numeric or text values, units, source notes, rationale,
  confidence labels, and display ordering.
- `public.lunar_economy_source_documents`: reviewed source records tied to a
  model version, including publisher, URL, citation text, license notes, review
  state, confidence labels, and public visibility.
- `public.lunar_economy_assumption_sources`: join records that connect
  assumptions to the sources that support or constrain them.
- `public.lunar_economy_scenario_estimates`: dated estimates for conservative,
  baseline, upside, stress, or custom scenarios, with ranges, confidence scores,
  confidence labels, methodology notes, and publication status.
- `public.lunar_economy_daily_outputs`: daily published output rows for public
  widgets and future member dashboards, including headline value, range, source
  count, freshness timestamp, confidence score, and scenario key.

## Access Control

All tables have RLS enabled and explicit grants for Supabase Data API access.
Public and authenticated users can read only rows that are explicitly public,
published or approved, current, and attached to an active public model version.

Editors, analysts, and admins can read and manage the records through normalized
role assignments checked by `app_private.has_any_role(...)`. The schema does not
use user-editable metadata for authorization.

## Task Boundary

This task created the schema only. Task 030 seeds the Firefly benchmark
assumptions and sources in `docs/firefly-full-cost-benchmark.md` using the full
NASA-paid cost basis: approximately `$100M` original mission cost, `$10M` data
addendum, and approximately `$45M` in PRISM/payload costs.
