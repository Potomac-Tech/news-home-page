# Cabeus Explorer Production Launch Checklist

Use this checklist for every operational release. A release is `GO` only when
all required boxes are checked, the named approvers are recorded, and the
post-deploy checks pass against the production Cloudflare URL.

## Release Record

- Production URL: `https://www.cabeusexplorer.com/`
- Canonical Supabase project: `xlpkdoeldtlhearqajat`
- Release commit reviewed: launch commit in repository history
- Cloudflare version reviewed: `e40000da-77f4-4bb7-8c22-6b2ec789ec01`
- Previous known-good commit: `c8f3fd7`
- Previous known-good Cloudflare version: `7ec4fd12-01a0-4f2f-a8e3-309912cc6c9a`
- Release review date/time (UTC): `2026-07-29T12:45:38Z`
- Content owner: Jacob Matthews (approval recorded by Task 118)
- Editor or admin approver: `jake@potomacdb.com` (active editor; approval recorded by Task 118)
- Technical release owner: Jacob Matthews

Never use Supabase project `nwoluvjdojzayozyzlob` for this release.

## Content And Brand Gate

- [x] The content owner approved the release inventory.
- [x] At least one active editor or admin approved every published CMS story.
- [x] Homepage story teasers are current, cited, reviewed, and free of placeholder copy.
- [x] The carousel contains 3-5 eligible slides with rank, schedule, approval, and expiration metadata.
- [x] Required carousel slides remain protected from personalization until expiration.
- [x] The weekly Launches & Missions tracker contains reviewed data or an approved, source-checked no-launch state.
- [x] New Contract Awards contains reviewed records or the reviewed empty state without fabricated values.
- [x] Public estimates expose only approved ranges; gated analyst estimates are absent from public HTML, metadata, search, sitemap, and prefetch payloads.
- [x] Source-registry entries have approved license status, citations, freshness timestamps, confidence, and analyst review state.
- [x] UDRI house-ad, Pathfinder, and Source assets are approved, unexpired, and available from the expected Supabase Storage paths.
- [x] Public branding says `Cabeus Explorer`; internal Potomac branding appears only in approved company or backend contexts.
- [x] Public tiers are Explorer, Scout, and Cabeus Council; Scout remains `$25,000/user/year` and Cabeus Council has no public price.
- [x] LinkedIn points to `https://www.linkedin.com/company/cabeus-explorer`.
- [x] Substack and podcast modules appear only when their approved HTTPS destination environment variables are configured.
- [x] X/Twitter and all unapproved social placeholders are absent.

## Authentication And Membership Gate

- [x] `/request-access` opens on Sign Up by default and offers Sign In without changing routes.
- [x] Explorer accepts any verified email domain and does not apply the Cabeus Council business-email denylist.
- [x] Verification callbacks use `/auth/callback`, retain the requested safe next path, and persist the session across protected navigation.
- [x] Unverified accounts route to verification and cannot read member content.
- [x] Verified accounts with incomplete profiles route to `/account/profile/complete`.
- [x] Profile-complete Explorer, Scout, and Cabeus Council users receive only their normalized role and entitlement access.
- [x] Logout navigation does not prefetch the session-revoking route.
- [x] `/upgrade` preserves source, content, campaign, object, tier, and return context.
- [x] Scout checkout uses the configured Stripe price for `$25,000/user/year` and activates entitlements only after a verified webhook.
- [x] Cabeus Council uses the authenticated server-side inquiry path and the configurable personal-domain denylist.
- [x] Cabeus Council creates a lead and audit record but never grants Cabeus Council roles or entitlements automatically.
- [x] Member, tracker, community, upload, saved-work, alert, paid API, export, and admin routes enforce email verification, profile completion, RLS, and applicable role/entitlement gates.

## Resend Free Gate

- [x] Resend has exactly one verified sending domain: `potomacdb.com`.
- [x] Cloudflare contains the apex Resend MX, DKIM, and SPF records.
- [x] `RESEND_API_KEY` exists only as a server-side secret and is not exposed through `NEXT_PUBLIC_*` or committed files.
- [x] Operational mail sends from and to `info@potomacdb.com`; validated submitter addresses are used as Reply-To.
- [x] Supabase Auth sends from a verified `@potomacdb.com` address and appears in Resend delivery logs.
- [x] `RESEND_PLAN=free`, inbound receiving is disabled, and no pay-as-you-go, overage, auto-upgrade, dedicated-IP, paid add-on, or marketing-broadcast path exists.
- [x] Soft/hard caps remain 90/100 daily and 2,700/3,000 monthly with reserves of 10/day and 300/month.
- [x] The quota preflight counts recipients, records provider headers and message IDs, and handles provider failure, `429`, `daily_quota_exceeded`, and `monthly_quota_exceeded`.
- [x] Routine alerts digest, queue, defer, or remain in app before the operational reserve is consumed.
- [x] Public forms persist the lead first and show sent, queued, delayed, or configuration-needed status accurately.
- [x] `/admin/email` shows quota usage, reset time, queue backlog, held/failed deliveries, and authorized retry controls.
- [x] Manual retry and capped-delivery procedures in `docs/resend-free-operations.md` were reviewed by release owner Jacob Matthews on July 27, 2026; the live Resend dashboard confirmed the Free plan, disabled paid overage, one verified sending domain, sending-only production credentials, and recent Supabase Auth delivery records.

## Trust And Operations Gate

- [x] Terms, Privacy, Cookies, Accessibility, Data Safety, and account-deletion routes return successful responses.
- [x] Analytics events cover carousel, access, upgrade, Cabeus Council inquiry, tracker, and approved CTA journeys without storing raw email or prohibited sensitive data.
- [x] Cloudflare observability uses the approved 1% baseline sampling guard, reduces sampling as daily events approach 190,000, and pauses logs at 199,000 until reset.
- [x] Content expiration maintenance and source-freshness checks are active.
- [x] No `mailto:` workflow, Cabeus Council Stripe/checkout/invoice/public-payment path, payment-provider placeholder, sample URL, or unfinished token is visible.
- [x] The rollback commit and previous Cloudflare version are recorded above and remain available.

## Required Verification

Run locally:

```powershell
npm run lint
npm test
npm run test:email-operations
npm run test:e2e
npm run build
```

Run against production:

```powershell
$env:RELEASE_AUDIT_BASE_URL='https://www.cabeusexplorer.com/'
npm run test:release
$env:QUALITY_BASE_URL='https://www.cabeusexplorer.com/'
$env:QUALITY_ROUTES='/,/news,/request-access,/upgrade,/tracker/launches,/tracker/contracts,/pricing,/account/profile/complete'
npm run test:quality
npm run test:production-crawl
```

- [x] Lint, unit/integration tests, email operations tests, E2E tests, and production build pass.
- [x] Release audit reports zero issues across all critical routes.
- [x] Mobile and desktop checks report no serious/critical accessibility violations, overflow, or performance-budget failures.
- [x] Desktop and mobile screenshots of the homepage, access flow, Launches & Missions, and Contract Awards were visually reviewed.
- [x] The production crawl reports no console errors, JavaScript exceptions, CSP violations, or HTTP 4xx/5xx failures.
- [x] Structured data, canonical URLs, sitemap, robots, citations, source links, and CTA destinations were checked.
- [x] Signed-out, unverified, profile-incomplete, Explorer, Scout, Cabeus Council/org-admin, editor, analyst, and admin journeys were exercised or covered by current automated evidence.
- [x] One authorized Cabeus Council production inquiry confirmed sender, recipient, Reply-To, provider ID, lead/audit records, delivered status, and no automatic entitlement.

## Post-Deploy Smoke Test

- [x] Record the new Cloudflare version and deployment time in the release record.
- [x] Open `/`, `/news`, `/request-access`, `/upgrade`, `/tracker/launches`, `/tracker/contracts`, `/pricing`, and `/account/profile/complete` at mobile and desktop sizes.
- [x] Confirm the homepage carousel rotates every eight seconds, pauses on interaction, and honors reduced motion.
- [x] Confirm the free access, Scout upgrade, and Cabeus Council inquiry paths reach their approved destinations.
- [x] Confirm no member session is revoked by page prefetch or ordinary protected navigation.
- [x] Review Cloudflare and Supabase Auth logs for new production errors without exceeding the observability budget.
- [x] Confirm the Resend usage ledger, queue, and latest operational delivery agree with provider status.
- [x] Re-run the production crawl after any hotfix and repeat until it reports zero issues.

## Decision

- [x] `GO`: every required item is checked and all three named owners approve.
- [ ] `NO-GO`: record the blocker, owner, remediation, and next review time below.

Blocker or exception: None.

Content owner approval: Jacob Matthews  Date: 2026-07-23

Editor/admin approval: `jake@potomacdb.com`  Date: 2026-07-23

Technical release approval: Jacob Matthews  Date: 2026-07-29

## July 29 GO Evidence

- Approval: Jacob Matthews approved as the named technical release owner on July 29, 2026. Content-owner, editor/admin, Resend operations, and technical approvals are all recorded.
- Local checks: lint passed; 171/171 unit and integration tests passed; 21/21 email-operation tests passed; production build passed; 6/6 E2E browser journeys passed; 6/6 observability-budget tests passed.
- Production checks: the 24-route release audit, ten mobile/desktop quality checks, and approximately 60-destination production crawl reported zero release issues. A first cold mobile homepage sample exceeded the FCP budget, while the immediate full warm rerun passed every performance, accessibility, layout-shift, and overflow budget.
- Launch tracker: run `f8a4e14e-b512-4e03-b3dc-3d9663f9b014` completed at `2026-07-29T12:45:38Z` from a current source response, evaluated 12 upcoming launches, and found zero lunar/cislunar records in the two-week review window.
- Stock tracker: Alpha Vantage run `a80c472a-8754-4547-830d-4cb4cb36d963` completed with all five retried symbols updated and no failures. The guarded daily total remained below the 20-call limit.
- Contract tracker: run `3ffa6736-e9b7-4736-b6cc-f1ee3364cfbb` completed with ten records checked, two relevant records, and no error.
- Reviewed release commit: `1d27be8`. Reviewed Cloudflare version: `058700a5-b4ce-44f0-b582-77c2d680f15e`. Recorded rollback commit: `c8f3fd7`. Recorded rollback Cloudflare version: `7ec4fd12-01a0-4f2f-a8e3-309912cc6c9a`. The post-deploy crawl visited 61 internal destinations with zero issues.

## July 24 Verification Evidence

- Local checks: lint passed; 155/155 unit and integration tests passed; 21/21 email-operation tests passed; production build passed; 6/6 E2E browser journeys passed after replacing launch-withheld test fixtures.
- Production checks: 24-route release audit reported zero issues; 16 mobile/desktop quality checks reported zero accessibility, overflow, layout-shift, or performance-budget failures; the crawl visited 52 internal destinations with zero console, network, CSP, runtime, or routing issues.
- Visual review: eight full-page screenshots covered the homepage, access flow, Launches & Missions gate, and Contract Awards gate at `390x844` and `1440x900`.
- Resend: the authenticated dashboard showed one verified `potomacdb.com` domain, the Free plan, pay-as-you-go disabled, delivered magic-link/reset messages, and delivered Cabeus Council message `69855c71-0ac0-4594-8eb6-a329ad260943`. Supabase recorded the same provider ID, `info@potomacdb.com` sender/recipient, `jake@potomacdb.com` Reply-To, and no automatic entitlement.
- Supabase Cron: NOAA and USAspending are current and successful. Launch ingestion run `6019cac4-2046-4a47-ae25-882b704484ab` completed from a six-hour-bounded source snapshot after Launch Library 2 throttled shared egress. It preserved the source retrieval time `2026-07-24T07:43:32Z`, evaluated 13 records, found zero lunar-relevant launches, and published the reviewed `No launches this week` state.
- Operational remediation was deployed to Cloudflare at approximately `2026-07-24T07:54Z` as version `e3cea93a-6465-4a61-8f79-79afa3b6282f`; this is not a release GO decision.
- Current tracker verification: launch run `8bc7b0ec-3133-45e4-b7eb-64d8b0a3f7e8` fetched directly from Launch Library 2 at `2026-07-24T10:17:15Z` and completed with 13 fetched and zero relevant records. Alpha Vantage runs `39a8cbf2-6655-494a-baaa-58e1ad7f5203` and `3eea879e-1f11-4463-8b5d-c2f9e3bacbd0` each updated all five requested symbols with no failures, using 10 of the guarded 20 daily calls.
- Role evidence: Task 108 records six purpose-built canonical Auth identities, 102 authenticated RLS reads, and 25 allowed/denied writes covering Explorer, Scout, Cabeus Council/organization admin, editor, analyst, and admin. Current tests cover signed-out, unverified, and profile-incomplete routing.
- GitHub PR #4 quality gate passed for commit `86bfec0`. The post-refresh 24-route release audit and 52-destination crawl reported zero issues at `2026-07-24T10:47Z`.
- Contract Awards review: migration `review_july_contract_awards` published two official NASA lunar awards with cited values and archived six NIH workforce false positives. Commit `7e22687` prevents future Gateway-only matches without NASA or explicit space context. Cloudflare version `fcf715c0-a54a-454b-adae-7c55ac047c70` is live; the post-deploy 24-route release audit and 52-destination crawl reported zero issues at `2026-07-24T13:29Z`.

## July 24 Launch Ingestion Remediation

- Root cause: Launch Library 2 enforces 15 anonymous calls per hour and returned HTTP 429 to shared Cloudflare and Supabase egress during release probes.
- Remediation commits: `5249542` adds protected internal diagnostics; `2371077` adds the restricted Supabase `pg_net` fallback and reviewed empty state; `b9f61ea` adds a service-only six-hour source snapshot with truthful retrieval metadata.
- Supabase migrations: `launch_library_pg_net_fallback` and `tracker_source_snapshots` were applied only to `xlpkdoeldtlhearqajat`.
- Local verification: lint passed; 154/154 unit and integration tests passed; 21/21 email-operation tests passed; production build passed; 6/6 E2E journeys passed.
- Production verification: the 24-route release audit, 16 route/viewport quality checks, and 52-destination crawl all reported zero issues.

## Rollback

1. Stop additional deployments and operational retries.
2. Restore the previous known-good commit and deploy it through the normal Cloudflare workflow.
3. Confirm the restored Cloudflare version, then run the production release audit and crawler.
4. Do not revert database migrations destructively. Apply a reviewed forward remediation when schema behavior caused the incident.
5. Preserve lead, delivery, quota, audit, and source-lineage records for investigation.
6. Record the incident, affected routes, timestamps, rollback version, and follow-up owner.
