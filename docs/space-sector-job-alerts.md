# Space Sector Job Alerts

Task 040 adds the first job-alert layer for the member workspace.

## Scope

The initial module focuses on NASA and large space-company career sources that
matter to lunar and adjacent space-sector monitoring:

- NASA Careers / USAJOBS
- SpaceX Careers
- Blue Origin Careers
- Lockheed Martin Space Careers

These are curated alert records, not a scraper. Each record stores the employer,
role focus, location scope, source URL, observed posting date, source retrieval
timestamp, and freshness status. Staff can later replace the seed records with
specific jobs or connect a reviewed ingestion workflow.

## Data Model

`supabase/migrations/20260629220305_job_alerts_schema.sql` creates:

- `public.space_sector_job_alerts`
- `public.job_alert_employer_kind`
- `public.job_alert_freshness_status`
- `public.job_alert_publication_status`

The table is exposed only to authenticated users for published, non-closed
alerts. Staff roles (`editor`, `analyst`, `admin`) can manage the records. The
policies use normalized `member_role_assignments` through
`app_private.has_any_role`, not user-editable metadata.

## Dashboard

`/member` now renders a "NASA & Space Hiring" card showing:

- employer
- role focus
- location
- source link
- posting date
- freshness label and note

When Supabase public configuration is unavailable, the card uses safe fallback
records from official careers pages so local builds and no-env previews still
show the intended dashboard shape.

## Verification Notes

Live reads require the Potomac Supabase project `xlpkdoeldtlhearqajat`, applied
migrations, and a signed-in member. Local no-env previews use fallback records.
