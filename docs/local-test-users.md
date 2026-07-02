# Local Test Users

The local Supabase seed migration
`supabase/migrations/20260701201833_seed_local_test_users.sql` creates four
confirmed email/password users for role-gated verification.

These accounts are intended for local development and QA only. Do not use these
credentials in production.

| Persona | Email | Password | Primary roles |
| --- | --- | --- | --- |
| Explorer | `explorer.test@potomac.local` | `PotomacTest123!` | `member` |
| Scout | `scout.test@potomac.local` | `PotomacTest123!` | `member`, `scout` |
| Command | `command.test@potomac.local` | `PotomacTest123!` | `member`, `command_user`, `org_admin` scoped to `potomac-command-test` |
| Staff | `staff.test@potomac.local` | `PotomacTest123!` | `member`, `editor`, `analyst`, `admin` |

The seed also creates `Potomac Command Test Organization`, an active Command
organization entitlement, a Scout user entitlement, approved member profiles,
and audit events.

## Apply Locally

```powershell
npx supabase migration up --local --include-all --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"
```

## Verification

```powershell
npx supabase db query --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website" "select profile.email, profile.base_tier, string_agg(role_assignment.role_id, ', ' order by role_assignment.role_id) as roles from public.member_profiles profile join public.member_role_assignments role_assignment on role_assignment.user_id = profile.user_id where profile.email like '%.test@potomac.local' group by profile.email, profile.base_tier order by profile.email;"
```
