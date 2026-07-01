# Lunar Company Profile and Comparison Schema

Task 059 adds the database foundation for lunar company profiles and comparison
workflows.

## Migration

`supabase/migrations/20260701140308_lunar_company_profiles_comparison_schema.sql`

## Tables

- `lunar_companies` stores profile metadata, sectors, lunar programs,
  headquarters, public financial summaries, staff-held licensed summaries,
  comparison summaries, freshness, confidence, quality score, and analyst
  review state.
- `lunar_company_facilities` stores lunar-relevant sites, locations,
  capabilities, and facility roles.
- `lunar_company_leadership` stores leadership names, titles, role areas,
  biographies, and public profile links.
- `lunar_company_contracts` stores contract and award references, customers,
  program names, contract roles, values, periods, and lunar scope notes.
- `lunar_company_financials` stores public-record or licensed financial
  metrics with period, unit, currency, license notes, and tier visibility for
  client-facing financial details.
- `lunar_company_news_links` connects company profiles to Potomac editorial
  articles or external news links.
- `lunar_company_relationships` stores customer, supplier, partner, investor,
  competitor, parent/subsidiary, prime/subcontractor, and mission relationships.
- `lunar_company_comparison_attributes` stores normalized comparison fields for
  table and ranking views.
- `lunar_company_source_citations` stores source URLs, publisher metadata,
  retrieved timestamps, supported fields, license notes, review status, and
  confidence labels for every profile sub-object.

## Access Model

Rows use `publication_status` and `visibility_tier` fields:

- `public` rows are readable publicly after publication.
- `member` rows are readable by approved Explorer members and higher.
- `scout` rows are readable by Scout, Command, and staff roles.
- `command` rows are readable by Command and staff roles.
- Editors, analysts, and admins can manage profile records.

Authorization uses the existing normalized role model through private helper
functions. The migration does not use user-editable metadata for access
decisions.

## RLS and Grants

Every new public table has Row Level Security enabled. The migration includes
explicit Data API read grants for `anon` and `authenticated`, authenticated
write grants for staff-gated workflows, and full `service_role` access for
trusted backend jobs. This matches the 2026 Supabase change that new public
tables may need explicit grants before `supabase-js` can read them.

## Coverage

The schema supports:

- company sectors and lunar programs
- contracts and award links
- facilities and capabilities
- leadership profiles
- public financial fields and licensed financial fields
- news links and editorial article links
- company-to-company and company-to-mission relationships
- source citations and license review notes
- comparison attributes, ranking values, freshness, confidence, and analyst
  review state

## Verification Notes

Static checks confirmed the migration includes required company, facility,
leadership, contract, financial, news, relationship, comparison, citation,
freshness, confidence, review, grant, RLS, and policy structures.

Live migration application and RLS behavior still need a reachable local or
remote Supabase database with canonical `xlpkdoeldtlhearqajat` credentials and
seeded public, Explorer, Scout, Command, and staff test users.
