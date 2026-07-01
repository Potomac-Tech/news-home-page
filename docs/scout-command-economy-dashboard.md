# Scout/Command Economy Dashboard

Task 033 adds the paid member dashboard for detailed lunar economy intelligence.
It is scoped to the canonical Potomac Supabase project ref
`xlpkdoeldtlhearqajat`.

## Route

- `/member/economy`: protected Next.js route for Scout users, Command users,
  and authorized staff.
- `/member/economy/downloads/scenarios`: CSV download for published scenarios.
- `/member/economy/downloads/assumptions`: CSV download for model assumptions.
- `/member/economy/downloads/sources`: CSV download for reviewed sources.
- `/member/economy/downloads/daily-outputs`: CSV download for daily outputs.

Signed-out users are redirected to login. Signed-in Explorer-only members see a
paid-access gate instead of detailed economy records.

## Data Surface

The dashboard loads the active published methodology version, scenario
estimates, assumptions, reviewed sources, assumption-source evidence links, and
recent daily outputs. It shows update timestamps, freshness timestamps,
confidence labels, range values, and CSV exports for paid workflows.

## Access Control

The migration
`supabase/migrations/20260626180422_scout_command_economy_dashboard_access.sql`
adds read-only RLS policies for `scout` and `command_user` role assignments.
Those policies allow paid members to read active, published economy records,
including non-public-but-published methodology detail. Staff policies for
editors, analysts, and admins remain separate. Authorization continues to use
normalized `member_role_assignments`, not user-editable metadata.

## Verification Notes

Live dashboard reads require Potomac Supabase public credentials, applied
migrations, and a signed-in Scout or Command test user. Without those, local
verification can still confirm compilation, route registration, the no-config
gate, and CSV route protection.
