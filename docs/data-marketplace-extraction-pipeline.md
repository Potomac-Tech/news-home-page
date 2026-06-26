# Data Marketplace Extraction Pipeline Placeholder

Task 035 adds a local placeholder pipeline for turning source-backed extraction
notes into data-market request and offer records. It is scoped to the canonical
Potomac Supabase project ref `xlpkdoeldtlhearqajat`.

## Command

```bash
npm run extract:data-marketplace -- --input scripts/data-marketplace-sample-input.json
```

The command is dry-run by default and prints the planned extraction run, source
document, request records, offer records, confidence labels, citations, and
payloads without writing to Supabase.

To write records, pass `--apply`. The script requires
`SUPABASE_SERVICE_ROLE_KEY` and either `SUPABASE_URL` or
`NEXT_PUBLIC_SUPABASE_URL`. It refuses to run unless the URL is exactly
`https://xlpkdoeldtlhearqajat.supabase.co`.

Use `--publish` only when the input has already been reviewed. Without
`--publish`, generated requests and offers remain draft records with queued
review state.

## Records Written In Apply Mode

- `data_market_extraction_runs`: one completed placeholder run with source,
  model, count, confidence, and rationale metadata.
- `data_market_source_documents`: one reviewed or queued source document with
  citation, license, tier, and confidence fields.
- `data_market_data_requests`: extracted request candidates with mission,
  location, instrument, data type, requested format, confidence label, score,
  rationale, and tier gate.
- `data_market_data_offers`: extracted offer candidates with provider,
  availability, coverage, mission, location, instrument, confidence label,
  score, rationale, and tier gate.
- `data_market_request_sources` and `data_market_offer_sources`: citation joins
  connecting each generated listing to the source document.
- `data_market_audit_logs`: audit events for extracted requests, extracted
  offers, and run completion.

## Task Boundary

This is a placeholder pipeline structure, not a production extractor. Future
work should replace the sample input with real source ingestion, add analyst
review workflow, add scheduled execution or an Edge Function, and connect the
published records to the Scout+ marketplace UI.
