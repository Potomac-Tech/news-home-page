# Lunar Commodity Proxy Pricing Schema

Task 027 adds the schema foundation for lunar-resource commodity prices and
proxy assumptions. It is scoped to the canonical Potomac Supabase project ref
`xlpkdoeldtlhearqajat`.

## Tables

- `public.lunar_commodities`: commodity records with slug, symbol, category,
  unit name/symbol, lunar relevance, status, update cadence, confidence label,
  and display order.
- `public.lunar_commodity_proxy_models`: proxy formulas and assumptions for a
  commodity, including pricing method, formula markdown, structured assumptions,
  output units, effective dates, update cadence, and confidence label.
- `public.lunar_commodity_price_observations`: source-backed price or proxy
  observations with observed timestamp, price, currency, unit, source, retrieval
  timestamp, confidence label, display state, and optional proxy-model link.
- `public.lunar_commodity_source_citations`: ordered citations attached to a
  commodity, proxy model, or price observation, including publisher, URL,
  publication/retrieval dates, summaries, and license notes.

## Access Control

All tables have RLS enabled and explicit grants. Public/member reads are limited
to active commodities, active proxy models, displayable price observations, and
citations attached to public records. Editors, analysts, and admins can manage
the records through Supabase-backed staff tooling.

## Task Boundary

This task created the schema only. Task 028 adds the first 20
lunar-resource commodity ticker entries with citations and confidence labels in
`docs/lunar-commodity-ticker-seed.md`.
