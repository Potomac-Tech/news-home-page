# Internal Summit Tracker Workflow

Task 022 adds a member-only tracker for Potomac internal summits and past-event
summaries.

## Data Model

- Summit records live in `public.internal_summits`.
- Records carry a publishing state, summit status, date window, location,
  tracker summary, agenda, past-event summary, major news, source links, and
  next steps.
- The table has RLS enabled and is not granted to `anon`.

## Access Model

- Approved Member, Scout, and Command users can read published summit records.
- Editors, analysts, and admins can read summit records for staff purposes.
- Editors and admins can create, edit, publish, archive, and update summit
  records.

## App Surfaces

- Member tracker: `/member/summits`
- Staff editor: `/admin/summits`
- The member workspace links to the summit tracker.

When Supabase public environment variables are absent, `/member/summits` shows a
safe configuration gate and does not render internal fallback summit content.
