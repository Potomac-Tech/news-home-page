# Event Calendar Workflow

Task 021 adds a public/member event calendar for major lunar conferences,
summits, workshops, briefings, and roundtables.

## Data Model

- Public teaser fields live in `public.event_calendar_events`.
- Member-only logistics, registration context, source links, and preparation
  notes live in `public.event_calendar_event_details`.
- The detail table is intentionally separate so anonymous Data API clients can
  read published teaser rows without being able to request gated detail columns.
- Both tables have RLS enabled and explicit grants for the Supabase Data API.

## Access Model

- Anonymous and signed-in users can read published event teaser rows.
- Approved Member, Scout, and Command users can read details for Member-gated
  events.
- Scout and Command gates are represented for future paid event use.
- Editors and admins can create, edit, and publish event records.
- Analysts can read staff event records and gated details, but not edit them.

## App Surfaces

- Public calendar: `/events`
- Staff editor: `/admin/events`
- Homepage event teaser rail links to `/events`.

When Supabase public environment variables are absent, `/events` renders safe
fallback teaser data and does not expose fallback member details.
