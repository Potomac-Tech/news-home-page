# Lunar Procurement and Regulatory Intelligence Schema

Task 057 added the first database model for lunar opportunity and policy-risk
intelligence.

## Migration

`supabase/migrations/20260701041100_lunar_procurement_regulatory_intelligence.sql`

## Tables

- `lunar_intel_agencies` stores agencies and public bodies such as NASA, NOAA,
  FCC, FAA, ESA, and other procurement or regulatory owners.
- `lunar_procurements` stores solicitations, awards, RFIs, sources sought,
  BAAs, SBIR/STTR opportunities, OTAs, grants, prizes, and contract vehicles.
- `lunar_procurement_awards` stores award recipients, award values, periods,
  SBIR/STTR phase labels, and lunar scope notes.
- `lunar_regulatory_records` stores filings, rulemakings, licenses, permits,
  advisories, policies, guidance, notices, comment periods, and compliance
  notes.
- `lunar_policy_milestones` stores policy dates, effective dates, review
  milestones, compliance notes, and risk notes.
- `lunar_intel_source_citations` stores source URLs, publisher metadata,
  retrieved timestamps, field support, review status, license notes, and
  confidence labels.

## Access Model

The schema follows the existing normalized member role model:

- `public` rows are readable publicly after publication.
- `member` rows are readable by approved Explorer members and higher.
- `scout` rows are readable by Scout, Command, and staff roles.
- `command` rows are readable by Command and staff roles.
- Editors, analysts, and admins can manage records.

Every table in the public schema has Row Level Security enabled. The migration
also adds explicit Data API grants for `anon` and `authenticated` read columns,
matching the 2026 Supabase change that new public tables may require explicit
grants before `supabase-js` can read them.

## Coverage

The schema supports:

- procurements and awards
- SBIR/STTR items and phases
- regulatory filings and comment periods
- policy milestones
- compliance guidance and risk notes
- agencies and jurisdictions
- due dates and effective dates
- source URLs and source citation tables
- confidence labels and analyst review state
- freshness and last-source timestamps

## Verification Notes

Static checks confirmed the migration includes the required procurement,
award, regulatory, policy, agency, citation, freshness, confidence, review,
grant, RLS, and policy structures.

Live migration application and RLS behavior still need a reachable local or
remote Supabase database with the canonical `xlpkdoeldtlhearqajat` project
credentials and seeded Scout/Command/staff test users.
