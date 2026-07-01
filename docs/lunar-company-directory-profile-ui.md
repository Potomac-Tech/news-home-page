# Lunar Company Directory, Profile, and Comparison UI

Task 060 turns the company terminal route into a working lunar company
intelligence surface.

## Routes

- `/companies` lists searchable lunar company profiles with sector, program,
  freshness, quality, source-mode, and access-status labels.
- `/companies/[slug]` renders profile detail pages with company summary, lunar
  relevance, facilities, leadership, contracts, financial metrics, news links,
  relationships, comparison attributes, and source citations.
- The member workspace links to `/companies`, and the terminal module map marks
  Companies as live.

## Data Source

`next-app/app/_data/lunarCompanies.ts` loads from the Task 059 Supabase tables
when the canonical Potomac Supabase public configuration is available. Without
that configuration, it renders safe fallback records for Intuitive Machines,
Astrobotic, and Firefly Aerospace so the terminal UI remains testable.

The loader reads:

- `lunar_companies`
- `lunar_company_facilities`
- `lunar_company_leadership`
- `lunar_company_contracts`
- `lunar_company_financials`
- `lunar_company_news_links`
- `lunar_company_relationships`
- `lunar_company_comparison_attributes`
- `lunar_company_source_citations`

## Access Behavior

The UI uses normalized role checks through the existing lunar market access
helper:

- public visitors see public profile teasers and source posture
- Explorer members can see member-tier company context
- Scout members can see Scout-visible contracts, financial metrics, comparison
  attributes, and watchlist hooks
- Command members can see Command-visible details where RLS allows

The UI does not grant access itself. Supabase RLS and explicit Data API grants
remain the source of truth.

## Controls

- Search covers company name, type, sectors, programs, summary, relevance, and
  headquarters.
- Filters cover public companies, landers, launch, CLPS, and profiles with
  financial metric rows.
- The comparison table summarizes the first visible profile set and hides
  tier-gated comparison attributes from lower tiers.
- Watchlist copy identifies where saved-work controls will attach after the
  watchlist schema lands.

## Verification Notes

Local verification should cover `/companies`, a profile such as
`/companies/intuitive-machines`, search/filter query strings, the comparison
table, source/freshness labels, upgrade prompts, and mobile rendering.

Live Supabase reads and role-gated detail unlocking still require the Task 059
migration applied to project `xlpkdoeldtlhearqajat`, a publishable key, and
seeded Explorer, Scout, Command, and staff test users.
