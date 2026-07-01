# Public Company Delayed Quote Workflow

Task 026 adds curated/delayed quote records for public space-company ticker
display. It is scoped to the canonical Potomac Supabase project ref
`xlpkdoeldtlhearqajat`.

## Data Model

`public.public_space_company_quotes` stores display-ready quote records linked to
`public.public_space_companies`. Each quote includes:

- company, ticker, and exchange snapshots
- quote timestamp
- source name and optional source URL
- source retrieval timestamp
- delay in minutes
- currency, last price, price change, and percent change
- display state for public/member ticker surfaces

## Access Control

The quote table has explicit grants and RLS enabled. Public and authenticated
clients can read only displayable quote rows with quote timestamps that are not
in the future. Editors, analysts, and admins can add and update quote rows from
`/admin/companies`.

## Display Surfaces

The shared `loadPublicTickerItems(...)` loader reads the latest displayable
quote per company, deduplicates by company, and returns ticker rows for:

- the public Next.js homepage briefing ticker
- the protected member workspace ticker card

When Supabase public configuration or quote rows are unavailable, the UI falls
back to non-price placeholder rows instead of inventing market data.
