# July 21, 2026 Launch Readiness

## Release Rule

No public or member surface may imply that sample, fallback, queued, planned, or
stale data is live. A module is discoverable only when it has approved content
or a source-checked empty state. Hidden modules remain routable only to staff
where operational review requires them.

## Current Production Inventory

| Surface | Production evidence on July 19 | Launch decision | Required action |
| --- | --- | --- | --- |
| Homepage shell, membership, Nexus, legal | Live and verified | Publish | Replace or suppress child modules that fail this matrix. |
| News | `editorial_articles`: 0; local fallback stories render | Decision required | Import and approve current cited stories, or hide News links and carousel story inventory. |
| Event calendar | `event_calendar_events`: 0; local fallback events render | Decision required | Import and approve current conference records, or hide Events. |
| Dataset catalog | 6 database records plus local fallback catalog | Publish selectively | Suppress proprietary placeholder records and expose only reviewed source-backed entries. |
| Launches & Missions | 0 tracker rows; Launch Library 2 script exists but is not scheduled | Launch-critical | Add scheduled API ingestion, source checks, review/empty-state workflow, and freshness monitoring. |
| Contract awards | 0 rows; importer requires a manually supplied export | Hide until populated | Add scheduled USAspending draft ingestion and editor review before discovery. |
| Space weather | 4 rows, last updated July 2 | Launch-critical | Add scheduled NOAA SWPC ingestion and stale-state enforcement. |
| Public-company ticker | 0 quote rows | Hide | Select a licensed quote provider and configure its server-side API credentials before display. |
| Lunar commodity ticker | 20 observations, last updated July 2 | Review before publish | Validate each proxy source and add a repeatable refresh path; otherwise hide prices and retain methodology only. |
| Lunar mission/spacecraft tracker | 0 database rows; representative fallback records render | Hide until populated | Populate reviewed mission records from approved sources and remove representative records from production fallback. |
| Company directory | 0 database rows; queued fallback profiles render | Hide until populated | Import and approve cited company profiles. |
| Procurement | 0 opportunities/awards; fallback records include placeholder citations | Hide | Populate from approved procurement sources and complete editor review. |
| Regulatory | 0 records; fallback records include placeholder citations | Hide | Populate from approved agency sources and complete editor review. |
| Data marketplace | 0 requests and 0 offers; extractor is explicitly a placeholder | Hide | Replace sample extraction with source-backed ingestion and review. |
| Calculators | Local tools with cited assumptions | Publish | Verify every calculator, citation, units, limitations, and mobile layout. |
| Community and account tools | Schema/UI implemented | Member-only | Exercise live role journeys; hide individual modules that fail signed-in smoke tests. |

## API Sources Approved For Initial Engineering

- Launch Library 2 for upcoming launch schedules. Ingest as draft and record the
  primary source plus pending cross-check status.
- NOAA Space Weather Prediction Center JSON products for current conditions,
  planetary K-index, and solar-wind observations.
- USAspending API v2 for candidate federal contract awards. Ingest candidates as
  draft; do not publish keyword matches without editor approval.
- SEC `data.sec.gov` APIs for company filings and financial facts where a tracked
  issuer CIK is already approved. This is not a licensed market-price feed.

## Decisions Needed From The Content Owner

1. Approve the conservative hide list above or identify a module that must launch
   from reviewed fallback content.
2. Provide the stock-quote vendor and server-side API credential, or approve
   hiding the public-company ticker for launch.
3. Identify the editor/admin who will approve imported stories, events, launch
   rows, awards, company records, and commodity proxy sources before release.

## Release Evidence

- Canonical Supabase project: `xlpkdoeldtlhearqajat`.
- Current production release audit: 9 routes, 0 issues, but insufficient route
  coverage for launch.
- Expanded quality audit: one mobile homepage FCP miss (1812 ms versus 1800 ms);
  no serious accessibility or overflow failures in the inspected routes.
- All launch decisions must be reflected in navigation, search, command palette,
  sitemap, structured data, and direct-route behavior, not hidden with CSS.
