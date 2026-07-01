# Economy Methodology Admin

Task 031 adds the analyst-facing admin workflow for maintaining the lunar
economy methodology records created in Tasks 029 and 030. It is scoped to the
canonical Potomac Supabase project ref `xlpkdoeldtlhearqajat`.

## Route

- `/admin/economy`: protected Next.js admin route for editors, analysts, and
  admins.

The route uses the existing Supabase server client and normalized
`member_role_assignments` role checks. It does not use user-editable metadata
for authorization.

## Analyst Workflow

The page lets authorized staff:

- Inspect the active methodology snapshot, public state, validity window,
  publication timestamp, and methodology notes.
- Review methodology version history across draft, active, and archived
  records.
- Create and edit methodology versions.
- Create and edit model assumptions with numeric or text values, units,
  rationale, source notes, confidence labels, public visibility, and display
  ordering.
- Create and edit source documents with review status, confidence labels,
  citation text, license notes, source URLs, public visibility, and retrieved
  timestamps.
- Link assumptions to source documents while enforcing that both records belong
  to the same methodology version.
- Inspect scenario estimates and recent daily output history used by public and
  future paid economy dashboards.

## Verification Notes

`npm run build:next` confirms the route compiles and is registered as the
dynamic `/admin/economy` route. Live edit-flow verification still requires a
reachable Supabase project with the Task 029 and Task 030 migrations applied, a
valid publishable key, and a seeded editor, analyst, or admin user.
