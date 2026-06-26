# Public Economy Summary Widget

Task 032 adds a public lunar economy tracker widget to the homepage. It is
scoped to the canonical Potomac Supabase project ref `xlpkdoeldtlhearqajat`.

## Public Surface

The homepage `Markets And Models` section now includes a public widget with:

- Headline estimate.
- Scenario/range label.
- Output date.
- Concise methodology note.
- Confidence label and score.
- Reviewed source count.
- Freshness date.
- Calls to action for methodology access and related briefs.

The widget does not expose the analyst-only assumption or source tables. Those
remain in `/admin/economy` for staff and in future Scout/Command dashboards.

## Data Source

`next-app/app/_data/economy.ts` loads the latest public, published
`lunar_economy_daily_outputs` row when the correct Supabase public environment
variables are present. Without live credentials, it falls back to the Firefly
Blue Ghost full-cost benchmark from Task 030:

```text
$155M headline
$147.3M - $155M public range
June 26, 2026 output date
Medium confidence, 72%
4 reviewed sources
```

The fallback preserves the full NASA-paid cost rule by including mission
delivery, NASA science payload / PRISM cost basis, and the Blue Ghost data
addendum.

## Verification Notes

Rendered QA used the in-app Browser for DOM, console, mobile overflow, date,
and CTA checks on `http://localhost:3002/`. The Browser screenshot API timed
out on `Page.captureScreenshot`, so desktop and mobile screenshot evidence was
captured with bundled Playwright using local Microsoft Edge.
