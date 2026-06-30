# Lunar Terminal Navigation Shell

Task 054 organizes the Next.js scaffold around a lunar industry terminal.

## Shared Module Map

`next-app/app/_data/terminal.ts` is the source of truth for terminal sections:

- lunar news
- launches
- spacecraft and landers
- procurement
- regulatory intelligence
- companies
- economy
- datasets
- marketplace
- events
- calculators
- alerts
- account paths

The map feeds the public header, `/terminal`, and the member dashboard terminal
map. Each item has a status label so public, member, Scout, and planned modules
can be scanned without needing the final data model for every section.

## Routes

The task adds lightweight route shells for the terminal areas that later schema
and UI tasks will replace with data-backed modules:

- `/terminal`
- `/launches`
- `/spacecraft`
- `/procurement`
- `/regulatory`
- `/companies`
- `/calculators`
- `/alerts`
- `/account`

Existing routes remain connected for `/news`, `/datasets`, `/events`,
`/member/economy`, and `/member/marketplace`.

## Responsive Behavior

The global header now has horizontally scrollable navigation rows on mobile and
wrapped navigation on larger screens. The terminal map uses responsive grids so
sections stack on mobile and expand across desktop viewports.

## Verification Limit

The shell can be rendered without Supabase credentials. Live member workspace
verification still requires configured Potomac Supabase public environment
variables and a signed-in approved member.
