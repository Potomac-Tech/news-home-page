# Sponsor And Ad Inventory Workflow

Task 023 adds the staff-side sponsor and ad placement foundation for direct-sold
advertising.

## Data Model

- Sponsor accounts live in `public.sponsors`.
- Sellable inventory lives in `public.ad_placements`.
- Contract windows, discounts, gross/net value, and reporting notes live in
  `public.sponsor_campaigns`.
- Placement-level flights, creative URLs, share of voice, impressions, clicks,
  conversions, and reporting links live in
  `public.sponsor_campaign_placements`.
- All tables have RLS enabled and explicit Supabase Data API grants for
  authenticated users and `service_role`.

## Access Model

- Anonymous users have no direct table access, which avoids exposing sponsor
  discounts, contract values, reporting counters, and contact details.
- Editors and admins can create and update sponsor inventory records.
- Analysts can read sponsor inventory and reporting fields through RLS, but
  cannot edit them.

## App Surface

- Staff editor: `/admin/sponsors`

The admin screen supports sponsor account records, placement setup,
campaign-level date and discount fields, and placement-flight delivery
reporting. Public rendering and programmatic fallback behavior are intentionally
left for Task 024 so those surfaces can expose only public-safe fields.
