# Data Source Registry Trust Layer

Task 068 adds the source trust layer for Potomac's lunar intelligence terminal.

## Purpose

The registry gives analysts one place to track whether a source can be used, how fresh it is, how it should be cited, and how much confidence downstream modules should place in it.

## Schema

The migration `20260702150512_data_source_registry_trust_layer.sql` adds:

- `intelligence_data_sources`: canonical source record with owner, URL, terms URL, license review, refresh frequency, parser/job metadata, health, freshness, citation requirements, quality score, confidence label, publication status, and analyst review state.
- `intelligence_source_citation_requirements`: per-source citation fields and guidance.
- `intelligence_source_parser_runs`: ingestion/parser job runs with status, timing, record counts, and error notes.
- `intelligence_source_health_checks`: freshness and endpoint/data health observations.
- `intelligence_source_quality_reviews`: analyst quality scoring history.
- `intelligence_source_registry_links`: links from a source to articles, events, companies, missions, datasets, procurements, regulatory records, methodology sources, calculators, RFQs, forums, and other indexed intelligence records.

All tables use explicit Supabase Data API grants and RLS. Access is limited to authenticated users with normalized `editor`, `analyst`, or `admin` roles through `app_private.can_manage_data_sources()`.

## Admin Workflow

The protected `/admin/sources` route lets staff:

- Create and edit source registry records.
- Track owner and source URL details.
- Record license and terms review state.
- Set refresh frequency, parser key, job name, and stale thresholds.
- Add health checks and freshness observations.
- Add citation requirements.
- Add parser-run evidence.
- Add quality reviews with confidence labels.
- Link sources to downstream intelligence records.

The workflow is intentionally staff-only. Public and member-facing modules should consume only reviewed source summaries, freshness labels, confidence labels, and citations exposed by their own feature-specific policies.

## Verification Notes

Live RLS verification still requires the pending historical migration chain to apply successfully and seeded staff/member test users. Until then, this task is verified through build/lint/static checks and local migration listing.
