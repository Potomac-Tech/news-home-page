# Scout+ Data Marketplace UI

Task 036 adds the first paid-member marketplace surface at
`/member/marketplace`. It is scoped to the canonical Potomac Supabase project
ref `xlpkdoeldtlhearqajat`.

## Route

- `/member/marketplace`: protected Scout/Command marketplace page.
- Entry point: `/member` includes a Data marketplace link beside the economy
  dashboard and summit tracker.

## Access Model

The page uses Supabase Auth claims and normalized `member_role_assignments`.
Scout users, Command users, editors, analysts, and admins can enter the route.
Signed-out users are redirected to login, and approved Explorer/member-only
users see a paid-access gate.

Marketplace row visibility is still enforced by the RLS policies from Task 034:

- Scout users can read approved, published Scout-tier requests, offers, and
  source evidence.
- Command users can also read approved, published Command-tier records.
- Authorized staff can inspect published records through the same UI while
  operational management remains outside this task.

## Data Loaded

The page reads only live Supabase data; there is no public fallback dataset for
paid marketplace listings.

- `data_market_data_requests`: approved open/matched/fulfilled requests.
- `data_market_data_offers`: approved available/matched/fulfilled offers.
- `data_market_request_sources` and `data_market_offer_sources`: citation
  relationships for visible listings.
- `data_market_source_documents`: approved source records accessible at the
  current member tier.

Each listing renders its summary, status, tier, confidence label and score,
mission/location/instrument metadata, analyst rationale, and source evidence.

## Verification Notes

Live Scout/Command read verification requires configured Potomac Supabase public
environment variables, the Task 034 migration applied to the canonical project,
and a signed-in Scout or Command test user.
