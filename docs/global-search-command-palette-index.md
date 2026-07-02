# Global Search and Command Palette Index

Task 063 adds the database model for global search, command-palette navigation,
and admin-pinned intelligence results.

## Scope

The migration
`supabase/migrations/20260702000232_global_search_command_palette_index.sql`
creates four public-schema tables:

- `intelligence_search_records`: normalized result rows for articles, events,
  companies, lunar missions, datasets, data requests, data offers, jobs,
  procurements, regulatory records, methodology sources, dashboard modules,
  calculators, RFQs, forums, and member profiles.
- `intelligence_search_sources`: citations and source evidence attached to a
  search result.
- `intelligence_command_entries`: keyboard command-palette entries for routes,
  records, actions, admin actions, and external links.
- `intelligence_search_synonyms`: analyst-managed synonyms for expanding search
  terms such as CLPS, SBIR, STTR, RFI, lander, dataset, and FCC.

The index is intentionally denormalized. Each product module can publish a
search row after its source object has passed the source module's own workflow
and RLS gates. The search table then controls cross-terminal discovery without
requiring every UI search query to join every feature table.

## Access Model

Search and command records have a `visibility_tier` of `public`, `explorer`,
`scout`, `command`, or `staff`.

RLS uses normalized role assignments through
`app_private.can_read_intelligence_search()`:

- `public`: visible to anonymous and authenticated users.
- `explorer`: visible to Explorer/member, Scout, Command, and staff roles.
- `scout`: visible to Scout, Command, and staff roles.
- `command`: visible to Command and staff roles.
- `staff`: visible to editor, analyst, and admin roles.

Staff can manage search records, citations, command entries, synonyms, pinned
results, and ranking metadata through
`app_private.can_manage_intelligence_search()`.

## Data API and RLS Notes

The migration follows the current Supabase public-schema Data API model:

- Every new table has RLS enabled.
- `anon` and `authenticated` get explicit column-scoped `select` grants.
- `authenticated` gets insert/update/delete grants, with RLS limiting those
  writes to staff roles.
- `service_role` receives full table grants for server-side indexing jobs.

This explicit grant pattern is required for projects using Supabase's 2026 Data
API default-privilege changes.

## Seeded Records

The migration seeds dashboard-module results and command entries for the main
lunar terminal routes:

- Terminal
- News
- Mission tracker
- Procurement
- Regulatory watch
- Company directory
- Dataset catalog
- Data marketplace
- Job alerts
- Calculators
- Economy methodology sources

These records give Task 064 a usable command-palette/search baseline before live
indexing jobs are added.

## Future Indexing Workflow

Future module jobs should upsert into `intelligence_search_records` when source
objects are published or materially changed. The recommended source mapping is:

- `editorial_articles` -> `article`
- `event_calendar_events` -> `event`
- `lunar_companies` -> `company`
- `lunar_missions` and related mission tables -> `lunar_mission`
- `dataset_catalog_entries` -> `dataset`
- `data_market_data_requests` -> `data_request`
- `data_market_data_offers` -> `data_offer`
- `space_sector_job_alerts` -> `job`
- `lunar_procurements` -> `procurement`
- `lunar_regulatory_records` -> `regulatory_record`
- lunar economy methodology source tables -> `methodology_source`
- terminal module config -> `dashboard_module`

Source citations should be copied or summarized into
`intelligence_search_sources` only when the underlying module permits the user
to see that source.

## Verification

Static checks confirmed the required table, enum, full-text vector, GIN index,
admin-pinned, source citation, synonym, command entry, explicit grant, and RLS
policy structures are present. Local and remote SQL execution limitations are
recorded in the task list.
