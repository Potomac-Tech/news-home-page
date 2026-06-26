# Public Company Universe And Top-20 Ranking

Task 025 establishes the Supabase-backed source of truth for publicly traded
space-company rankings. It is scoped to the canonical Potomac Supabase project
ref `xlpkdoeldtlhearqajat`.

## Data Model

- `public.public_space_companies` stores the admin-maintained eligible company
  universe, including ticker, exchange, sector, lunar relevance, eligibility
  state, chosen ranking metric, metric value, metric date, and source fields.
- `public.public_space_company_ranking_runs` stores each dated ranking snapshot,
  including the metric, ranking date, source, publication status, generated
  timestamp, and published timestamp.
- `public.public_space_company_rankings` stores the ranked top-20 rows captured
  for each snapshot, with company/ticker/exchange snapshots so a published rank
  remains auditable even if the company record changes later.

## Ranking Logic

The `app_private.create_public_company_top20_ranking(...)` function selects up to
20 companies where:

- `status = 'active'`
- `ranking_eligible = true`
- `ranking_metric` matches the requested metric
- `ranking_metric_value` is present
- `ranking_metric_as_of_date` is present

Companies are ranked by `ranking_metric_value desc`, with `company_name asc` as a
stable tie-breaker. The function records the ranking date and snapshot source on
the run, and copies each company metric source onto the ranked rows.

## Access Control

All tables have RLS enabled and explicit grants. Anonymous and authenticated
clients can read only public columns for active eligible companies and published
ranking snapshots. Editors, analysts, and admins can maintain companies and
ranking snapshots through `/admin/companies`.

The ranking function lives in `app_private`, not the exposed `public` schema, and
checks normalized role assignments through `app_private.has_any_role(...)`.

## Operations

1. Staff add or update company records at `/admin/companies`.
2. Staff mark companies active and ranking eligible when source-backed metric
   data is complete.
3. Staff generate a ranking snapshot with a metric, date, and source.
4. Staff publish the snapshot after review.

Delayed stock quote ingestion and ticker display are intentionally deferred to
Task 026.
