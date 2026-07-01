# Data Marketplace Extraction Schema

Task 034 adds the database foundation for the Scout+ data marketplace and its
automated extraction history. It is scoped to the canonical Potomac Supabase
project ref `xlpkdoeldtlhearqajat`.

## Data Model

- `public.data_market_data_requests`: source-backed requests for lunar or
  space-sector datasets, including mission/location/instrument context,
  requested formats, confidence labels and scores, analyst review state,
  extraction rationale, tier gates, and publication state.
- `public.data_market_data_offers`: source-backed dataset offers with provider,
  availability, coverage window, delivery mode, mission/location/instrument
  metadata, confidence labels and scores, analyst review state, extraction
  rationale, tier gates, and publication state.
- `public.data_market_source_documents`: reviewed source records with citations,
  publisher, URL, license notes, confidence labels, retrieval dates, and
  extraction-run linkage, plus Scout/Command tier visibility.
- `public.data_market_request_sources` and
  `public.data_market_offer_sources`: citation/evidence joins that connect each
  request or offer to one or more source documents with relationship type,
  page reference, confidence label, and rationale.
- `public.data_market_extraction_runs`: automated extraction job history with
  pipeline/model metadata, source URL, run status, counts, confidence label,
  rationale, errors, and timestamps.
- `public.data_market_audit_logs`: append-only audit-style records for
  extraction, review, publication, correction, and moderation history.

## Access Control

All tables have RLS enabled. The migration explicitly revokes anonymous access
and grants authenticated/service access subject to RLS.

Scout and Command users can read approved, published request/offer listings and
approved source evidence at their tier. Command-only listings require the
`command_user` role. Editors, analysts, and admins can read operational records;
analysts and admins can manage extraction, source, listing, citation, and audit
records. Authorization uses normalized `member_role_assignments` through
`app_private.has_any_role(...)`, not user-editable metadata.

## Task Boundary

This task creates the schema and access-control foundation only. Task 035 should
add the automated extraction pipeline placeholder that writes draft or published
records into these tables with confidence labels, citations, rationales, and
audit traces.
