# Lunar Procurement and Regulatory Hub UI

Task 058 adds working hub and detail pages for lunar procurement and
regulatory intelligence.

## Routes

- `/procurement` lists lunar solicitations, awards, SBIR/STTR items, due dates,
  source posture, confidence labels, and upgrade prompts.
- `/procurement/[slug]` renders opportunity detail, lunar relevance, eligibility,
  value, due dates, citations, and the watchlist attachment point.
- `/regulatory` lists filings, comment periods, policy-risk records, agencies,
  source posture, confidence labels, and upgrade prompts.
- `/regulatory/[slug]` renders regulatory detail, compliance guidance, risk
  notes, policy milestones, citations, and the watchlist attachment point.
- `/member/procurement` gives signed-in members a combined procurement and
  regulatory workspace with Scout/Command access messaging.

## Data Flow

The UI reads the Task 057 tables when the canonical Potomac Supabase public
configuration is available:

- `lunar_procurements`
- `lunar_regulatory_records`
- `lunar_policy_milestones`
- `lunar_intel_agencies`
- `lunar_intel_source_citations`

The loader validates access through normalized role assignments, not
user-editable metadata. Scout, Command, analyst, editor, and admin users request
paid records; anonymous and Explorer users get public records only. Row Level
Security still decides which rows are returned.

When Supabase is not configured or returns no readable rows, the pages render
clearly marked fallback records so routing, filters, citations, gates, and
watchlist hooks remain testable.

## Search, Filters, and Watchlists

The public hubs support query-string search and quick filters:

- procurement: open, due dates, SBIR/STTR, awards
- regulatory: open, comment periods, policy risk, due dates

Watchlist controls are intentionally UI hooks for now. Task 065 is responsible
for the saved-work schema, ownership model, and notification preferences.

## Verification Notes

Live Scout/Command reads require the canonical Supabase project
`xlpkdoeldtlhearqajat`, the Task 057 migration applied to a reachable database,
and seeded Scout/Command/staff users. Without those credentials, verification
covers the fallback route behavior and build safety.
