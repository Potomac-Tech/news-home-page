# Cabeus Explorer Production Launch Checklist

Use this checklist for every operational release. A release is `GO` only when
all required boxes are checked, the named approvers are recorded, and the
post-deploy checks pass against the production Cloudflare URL.

## Release Record

- Production URL: `https://cabeus-explorer.jake-249.workers.dev/`
- Canonical Supabase project: `xlpkdoeldtlhearqajat`
- Release commit: ____________________
- Cloudflare version: ____________________
- Previous known-good commit: ____________________
- Previous known-good Cloudflare version: ____________________
- Release date/time (UTC): ____________________
- Content owner: ____________________
- Editor or admin approver: ____________________
- Technical release owner: ____________________

Never use Supabase project `nwoluvjdojzayozyzlob` for this release.

## Content And Brand Gate

- [ ] The content owner approved the release inventory.
- [ ] At least one active editor or admin approved every published CMS story.
- [ ] Homepage story teasers are current, cited, reviewed, and free of placeholder copy.
- [ ] The carousel contains 3-5 eligible slides with rank, schedule, approval, and expiration metadata.
- [ ] Required carousel slides remain protected from personalization until expiration.
- [ ] The weekly Launches & Missions tracker contains reviewed data or an approved, source-checked no-launch state.
- [ ] New Contract Awards contains reviewed records or the reviewed empty state without fabricated values.
- [ ] Public estimates expose only approved ranges; gated analyst estimates are absent from public HTML, metadata, search, sitemap, and prefetch payloads.
- [ ] Source-registry entries have approved license status, citations, freshness timestamps, confidence, and analyst review state.
- [ ] UDRI house-ad, Pathfinder, and Source assets are approved, unexpired, and available from the expected Supabase Storage paths.
- [ ] Public branding says `Cabeus Explorer`; internal Potomac branding appears only in approved company or backend contexts.
- [ ] Public tiers are Explorer, Scout, and Meridian; Scout remains `$25,000/user/year` and Meridian has no public price.
- [ ] LinkedIn points to `https://www.linkedin.com/company/cabeus-explorer`.
- [ ] Substack and podcast modules appear only when their approved HTTPS destination environment variables are configured.
- [ ] X/Twitter and all unapproved social placeholders are absent.

## Authentication And Membership Gate

- [ ] `/request-access` opens on Sign Up by default and offers Sign In without changing routes.
- [ ] Explorer accepts any verified email domain and does not apply the Meridian business-email denylist.
- [ ] Verification callbacks use `/auth/callback`, retain the requested safe next path, and persist the session across protected navigation.
- [ ] Unverified accounts route to verification and cannot read member content.
- [ ] Verified accounts with incomplete profiles route to `/account/profile/complete`.
- [ ] Profile-complete Explorer, Scout, and Command users receive only their normalized role and entitlement access.
- [ ] Logout navigation does not prefetch the session-revoking route.
- [ ] `/upgrade` preserves source, content, campaign, object, tier, and return context.
- [ ] Scout checkout uses the configured Stripe price for `$25,000/user/year` and activates entitlements only after a verified webhook.
- [ ] Meridian uses the authenticated server-side inquiry path and the configurable personal-domain denylist.
- [ ] Meridian creates a lead and audit record but never grants Command roles or entitlements automatically.
- [ ] Member, tracker, community, upload, saved-work, alert, paid API, export, and admin routes enforce email verification, profile completion, RLS, and applicable role/entitlement gates.

## Resend Free Gate

- [ ] Resend has exactly one verified sending domain: `potomacdb.com`.
- [ ] Cloudflare contains the apex Resend MX, DKIM, and SPF records.
- [ ] `RESEND_API_KEY` exists only as a server-side secret and is not exposed through `NEXT_PUBLIC_*` or committed files.
- [ ] Operational mail sends from and to `info@potomacdb.com`; validated submitter addresses are used as Reply-To.
- [ ] Supabase Auth sends from a verified `@potomacdb.com` address and appears in Resend delivery logs.
- [ ] `RESEND_PLAN=free`, inbound receiving is disabled, and no pay-as-you-go, overage, auto-upgrade, dedicated-IP, paid add-on, or marketing-broadcast path exists.
- [ ] Soft/hard caps remain 90/100 daily and 2,700/3,000 monthly with reserves of 10/day and 300/month.
- [ ] The quota preflight counts recipients, records provider headers and message IDs, and handles provider failure, `429`, `daily_quota_exceeded`, and `monthly_quota_exceeded`.
- [ ] Routine alerts digest, queue, defer, or remain in app before the operational reserve is consumed.
- [ ] Public forms persist the lead first and show sent, queued, delayed, or configuration-needed status accurately.
- [ ] `/admin/email` shows quota usage, reset time, queue backlog, held/failed deliveries, and authorized retry controls.
- [ ] Manual retry and capped-delivery procedures in `docs/resend-free-operations.md` were reviewed by the release owner.

## Trust And Operations Gate

- [ ] Terms, Privacy, Cookies, Accessibility, Data Safety, and account-deletion routes return successful responses.
- [ ] Analytics events cover carousel, access, upgrade, Meridian inquiry, tracker, and approved CTA journeys without storing raw email or prohibited sensitive data.
- [ ] Cloudflare observability uses the approved 1% baseline sampling guard, reduces sampling as daily events approach 190,000, and pauses logs at 199,000 until reset.
- [ ] Content expiration maintenance and source-freshness checks are active.
- [ ] No `mailto:` workflow, Meridian Stripe/checkout/invoice/public-payment path, payment-provider placeholder, sample URL, or unfinished token is visible.
- [ ] The rollback commit and previous Cloudflare version are recorded above and remain available.

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
$env:RELEASE_AUDIT_BASE_URL='https://cabeus-explorer.jake-249.workers.dev/'
npm run test:release
$env:QUALITY_BASE_URL='https://cabeus-explorer.jake-249.workers.dev/'
$env:QUALITY_ROUTES='/,/news,/request-access,/upgrade,/tracker/launches,/tracker/contracts,/pricing,/account/profile/complete'
npm run test:quality
npm run test:production-crawl
```

- [ ] Lint, unit/integration tests, email operations tests, E2E tests, and production build pass.
- [ ] Release audit reports zero issues across all critical routes.
- [ ] Mobile and desktop checks report no serious/critical accessibility violations, overflow, or performance-budget failures.
- [ ] Desktop and mobile screenshots of the homepage, access flow, Launches & Missions, and Contract Awards were visually reviewed.
- [ ] The production crawl reports no console errors, JavaScript exceptions, CSP violations, or HTTP 4xx/5xx failures.
- [ ] Structured data, canonical URLs, sitemap, robots, citations, source links, and CTA destinations were checked.
- [ ] Signed-out, unverified, profile-incomplete, Explorer, Scout, Command/org-admin, editor, analyst, and admin journeys were exercised or covered by current automated evidence.
- [ ] One authorized Meridian production inquiry confirmed sender, recipient, Reply-To, provider ID, lead/audit records, delivered status, and no automatic entitlement.

## Post-Deploy Smoke Test

- [ ] Record the new Cloudflare version and deployment time in the release record.
- [ ] Open `/`, `/news`, `/request-access`, `/upgrade`, `/tracker/launches`, `/tracker/contracts`, `/pricing`, and `/account/profile/complete` at mobile and desktop sizes.
- [ ] Confirm the homepage carousel rotates every eight seconds, pauses on interaction, and honors reduced motion.
- [ ] Confirm the free access, Scout upgrade, and Meridian inquiry paths reach their approved destinations.
- [ ] Confirm no member session is revoked by page prefetch or ordinary protected navigation.
- [ ] Review Cloudflare and Supabase Auth logs for new production errors without exceeding the observability budget.
- [ ] Confirm the Resend usage ledger, queue, and latest operational delivery agree with provider status.
- [ ] Re-run the production crawl after any hotfix and repeat until it reports zero issues.

## Decision

- [ ] `GO`: every required item is checked and all three named owners approve.
- [ ] `NO-GO`: record the blocker, owner, remediation, and next review time below.

Blocker or exception: _________________________________________________

Content owner approval: ____________________  Date: ____________________

Editor/admin approval: ____________________  Date: ____________________

Technical release approval: ____________________  Date: ____________________

## Rollback

1. Stop additional deployments and operational retries.
2. Restore the previous known-good commit and deploy it through the normal Cloudflare workflow.
3. Confirm the restored Cloudflare version, then run the production release audit and crawler.
4. Do not revert database migrations destructively. Apply a reviewed forward remediation when schema behavior caused the incident.
5. Preserve lead, delivery, quota, audit, and source-lineage records for investigation.
6. Record the incident, affected routes, timestamps, rollback version, and follow-up owner.
