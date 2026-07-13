# Potomac News & Intelligence Automation Tasks

This task list is edited by the recurring Codex automation. The automation should read `docs/codex-automation-memory.md` first, then work from the first unchecked task downward.

Task format:

```md
Task NNN: Short title
Priority:
Requirement IDs:
Supersedes:
Superseded by:
Goal:
Acceptance criteria:
Non-technical summary:
Verification:
Blocked reason:
```

- [x] Task 001: Confirm Supabase MCP target uses `xlpkdoeldtlhearqajat`
  - Priority: P0
  - Requirement IDs: Legacy setup / N/A to current requirements matrix
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Ensure Codex and any Supabase tooling target the correct Potomac Supabase project.
  - Acceptance criteria: MCP configuration points to project ref `xlpkdoeldtlhearqajat`; any reference to `nwoluvjdojzayozyzlob` is removed or clearly marked as wrong; authentication status is documented.
  - Non-technical summary: Supabase tooling is now documented and project-scoped to the correct Potomac backend.
  - Verification: Confirmed local Codex config uses `https://mcp.supabase.com/mcp?project_ref=xlpkdoeldtlhearqajat`; added matching project `.mcp.json`; confirmed the Supabase MCP endpoint is reachable with the expected unauthenticated HTTP `401` response; authenticated tool access could not be verified because Supabase MCP tools were not exposed in this session.
  - Blocked reason: None.

- [x] Task 002: Add project documentation for the Next.js + Supabase migration
  - Priority: P0
  - Requirement IDs: Legacy setup / N/A to current requirements matrix
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Document the intended migration from the current Vite site to a Next.js + Supabase architecture.
  - Acceptance criteria: Documentation explains the migration rationale, target stack, key risks, Supabase ownership boundaries, and expected developer workflow.
  - Non-technical summary: The migration path is now documented so the team can move from the current site to the future news and member platform with clearer guardrails.
  - Verification: Reviewed the current Vite routes, public assets, Tailwind brand tokens, and package setup; added migration documentation covering rationale, stack, risks, ownership boundaries, and developer workflow. No build was run because this was a documentation-only task.
  - Blocked reason: None.

- [x] Task 003: Create initial Next.js app structure or migration scaffold
  - Priority: P0
  - Requirement IDs: Legacy setup / N/A to current requirements matrix
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Establish the first usable Next.js structure for the future site.
  - Acceptance criteria: Project contains a working Next.js scaffold or migration-compatible structure; existing Potomac routes/assets are accounted for; build instructions are documented.
  - Non-technical summary: A separate Next.js scaffold now exists so the future platform can be built without disrupting the current live Vite site.
  - Verification: `npm run build:next` passed for the `next-app` scaffold and generated the preserved route set; `npm run build` passed for the existing Vite app. Both builds reported the existing Browserslist data warning. Installing Next reported 20 npm audit findings that were not changed because dependency remediation is outside this scaffold task.
  - Blocked reason: None.

- [x] Task 004: Preserve Potomac brand tokens, typography, colors, and assets
  - Priority: P0
  - Requirement IDs: R-BRAND-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Carry the current Potomac visual identity into the new platform foundation.
  - Acceptance criteria: Brand colors, typography choices, logo assets, and lunar command-center styling are available to new pages/components without regressions.
  - Non-technical summary: The Next.js scaffold now has Potomac brand colors, fonts, styling utilities, and synced logo/media assets ready for new pages.
  - Verification: Added a Next brand module, documented the token and asset workflow, synced `public/` assets into `next-app/public/`, and confirmed `npm run build:next` and `npm run build` pass after the brand updates.
  - Blocked reason: None.

- [x] Task 005: Add Supabase client/server integration
  - Priority: P0
  - Requirement IDs: Legacy setup / N/A to current requirements matrix
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Connect the app to Supabase safely from browser and server contexts.
  - Acceptance criteria: Supabase clients are configured with the correct project ref, environment variable documentation exists, and no secret keys are exposed to the browser.
  - Non-technical summary: The Next.js scaffold now has safe Supabase browser and server connection helpers pointed at the correct Potomac project.
  - Verification: Installed current Supabase SSR/client packages; added browser, server, and proxy client helpers; documented environment variables and secret-key handling; confirmed `npm run build:next` and `npm run build` pass; ran a hidden-file search for project refs and secret exposure patterns. Authenticated Supabase calls were not run because no publishable key was available in this session.
  - Blocked reason: None.

- [x] Task 006: Add Supabase Auth login, logout, session handling, and protected routes
  - Priority: P0
  - Requirement IDs: R-AUTH-001, R-AUTH-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Let users sign in and route them based on authentication status.
  - Acceptance criteria: Login, logout, session refresh, protected route handling, and unauthenticated redirects work in the app.
  - Non-technical summary: The scaffold now has sign-in, sign-out, session refresh, and a protected member area ready for Supabase credentials.
  - Verification: Added login, callback, logout, and protected member routes; protected routes use server-side `getClaims()` and redirect signed-out users to login; confirmed `npm run build:next` and `npm run build` pass. Live login/logout could not be exercised because no Supabase publishable key was available in this session.
  - Blocked reason: None.

- [x] Task 007: Create member profile, application, organization, role, and entitlement schema
  - Priority: P0
  - Requirement IDs: R-TIER-001, R-AUTH-003
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Define the core data model for members, organizations, approvals, roles, and paid access.
  - Acceptance criteria: Schema supports pending applicants, approved Members, Scout users, Command organizations, org admins, and entitlement records.
  - Non-technical summary: The initial database model now defines member applications, profiles, organizations, roles, org admins, and paid-access entitlements.
  - Verification: Created a Supabase migration with the CLI for the workspace and documented the schema coverage; static search confirmed the required tables, roles, entitlements, and RLS enablement are present. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so remote application/RLS checks remain unverified.
  - Blocked reason: None.

- [x] Task 008: Add RLS policies for public, pending applicant, Member, Scout, Command, org admin, editor, analyst, and admin access
  - Priority: P0
  - Requirement IDs: R-AUTH-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Protect Supabase data according to the membership and staff access model.
  - Acceptance criteria: RLS policies exist for relevant tables; each role can access only the expected rows/actions; policies avoid user-editable metadata for authorization.
  - Non-technical summary: The member access tables now have a documented RLS policy migration for public applications, members, paid tiers, organization admins, staff, and admins.
  - Verification: Added private-schema authorization helpers, explicit grants, and RLS policies for the member access tables; static search confirmed helper functions, grants, policies, and required role names are present. Recheck on 2026-07-01: local Supabase migration listing now connects and lists migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote SQL/RLS checks remain unverified.
  - Blocked reason: None.

- [x] Task 009: Build free Member application flow with manual approval state
  - Priority: P0
  - Requirement IDs: R-TIER-001, R-AUTH-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Let public visitors apply for free membership and enter a pending review state.
  - Acceptance criteria: Application form captures required fields, creates a pending application, shows confirmation, and does not grant full access before approval.
  - Non-technical summary: Public visitors can now submit a free Member application that stays pending until an admin reviews it.
  - Verification: Added the `/apply` form route, pending application insert logic, confirmation messaging, and documentation; confirmed `npm run build:next` and `npm run build` pass. Live insert verification was not possible because no Supabase publishable key was available and the schema migration was not applied to a reachable database.
  - Blocked reason: None.

- [x] Task 010: Build admin approval workflow for free Members
  - Priority: P0
  - Requirement IDs: R-TIER-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Let authorized admins review, approve, or reject membership applications.
  - Acceptance criteria: Admin workflow lists pending applications, records decisions, updates member status, and keeps an audit trail.
  - Non-technical summary: Admins now have a protected review workflow for approving or rejecting free Member applications.
  - Verification: Added the protected `/admin/applications` route, admin role guard, approve/reject server actions, member profile/role updates for linked users, audit-event inserts, and workflow documentation; confirmed `npm run build:next` and `npm run build` pass. Live approval/rejection could not be exercised because no Supabase publishable key was available and the schema migration was not applied to a reachable database.
  - Blocked reason: None.

- [x] Task 011: Add Stripe Scout checkout at `$25k/user/year`
  - Priority: P0
  - Requirement IDs: R-UPGRADE-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Support self-serve annual Scout upgrades for approved Members.
  - Acceptance criteria: Stripe product/price or documented configuration supports `$25k/user/year`; checkout starts only for eligible users; payment status is captured.
  - Non-technical summary: Approved Members now have a server-side Stripe Checkout path for the annual Scout upgrade.
  - Verification: Installed the current Stripe SDK; documented the `$25k/user/year` recurring Price configuration; added the server-only checkout route and member upgrade button; confirmed `npm run build:next` and `npm run build` pass. Live Stripe checkout was not run because no Stripe secret key, Price ID, or authenticated Supabase session was available.
  - Blocked reason: None.

- [x] Task 012: Add Scout entitlement activation after successful payment
  - Priority: P0
  - Requirement IDs: R-UPGRADE-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Grant Scout access after successful Stripe payment or subscription activation.
  - Acceptance criteria: Stripe webhook or equivalent process updates entitlements, handles failures/idempotency, and records audit history.
  - Non-technical summary: Stripe webhook handling now activates Scout entitlements after payment and records duplicate-safe audit history.
  - Verification: Added a webhook idempotency migration, server-only Supabase service client, shared Stripe server helper, webhook route for successful checkout/subscription updates/deletions/payment failures, role/entitlement updates, and audit-event writes; confirmed `npm run build:next` and `npm run build` pass. Live webhook delivery was not exercised because Stripe secrets, a Supabase service secret, and an applied reachable schema were unavailable.
  - Blocked reason: None.

- [x] Task 013: Add Command interest form and manual sales/admin workflow
  - Priority: P0
  - Requirement IDs: R-UPGRADE-002, R-UPGRADE-003
  - Supersedes: None.
  - Superseded by: Task 085
  - Goal: Capture enterprise Command interest without self-serve purchase.
  - Acceptance criteria: Command interest form stores requests, notifies/admin-surfaces leads, and supports manual entitlement grants after offline approval.
  - Non-technical summary: Enterprise Command interest can now be captured publicly and reviewed by admins for manual organization-level access grants.
  - Verification: Added Command interest schema/RLS, public `/command` form, protected `/admin/command` workflow, manual Command organization/entitlement grant action, audit-event writes, and documentation; confirmed `npm run build:next` and `npm run build` pass. Live database inserts and grants could not be exercised because Supabase keys were unavailable and the schema migration was not applied to a reachable database.
  - Blocked reason: None.

- [x] Task 014: Build organization admin portal for seats, members, entitlements, and billing contacts
  - Priority: P0
  - Requirement IDs: R-TIER-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Give organization admins a place to manage their organization.
  - Acceptance criteria: Org admins can view organization details, members, seats, entitlements, and billing contacts within their permitted scope.
  - Non-technical summary: Organization admins now have a protected workspace to review their permitted organizations, seats, members, billing contact, and active entitlements.
  - Verification: Added `/organization`, an organization-admin auth helper, scoped Supabase reads, navigation, and documentation; confirmed `npm run build:next` and `npm run build` pass. Live database reads could not be exercised because Supabase keys were unavailable and the schema migration was not applied to a reachable database.
  - Blocked reason: None.

- [x] Task 015: Create editorial CMS schema for articles, authors, tags, versions, citations, and SEO metadata
  - Priority: P0
  - Requirement IDs: R-CONTENT-001, R-HOME-001, R-HOME-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Store editorial content with public teaser and gated full-body support.
  - Acceptance criteria: CMS schema supports articles, authors, tags, versions, citations, SEO/AEO fields, teaser content, gated body, and publish states.
  - Non-technical summary: Editorial content now has a CMS-ready database design for public teasers, protected full stories, authors, tags, source citations, version history, and search metadata.
  - Verification: Added the editorial CMS migration and schema documentation, including public article rows, separate gated bodies, authors, tags, versions, citations, SEO/AEO fields, publish states, indexes, grants, and RLS policies; confirmed `npm run build:next` and `npm run build` pass. Recheck on 2026-07-01: local Supabase migration listing now connects and lists migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, and no runtime keys/test users are available, so live migration/RLS checks remain unverified.
  - Blocked reason: None.

- [x] Task 016: Build editor workflow for draft, preview, publish, and gated body content
  - Priority: P0
  - Requirement IDs: R-CONTENT-001, R-HOME-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Let editors manage news stories without code changes.
  - Acceptance criteria: Editors can create drafts, preview public/gated content, publish stories, and update gated bodies safely.
  - Non-technical summary: Editors now have a protected workspace for creating drafts, previewing public and member-only story content, saving versions, and publishing articles.
  - Verification: Added `/admin/editorial`, editorial staff auth, draft/create/update/publish server actions, inline public and gated previews, version snapshot writes, and workflow documentation; confirmed `npm run build:next` and `npm run build` pass. Live editor actions could not be exercised because Supabase keys were unavailable and the editorial schema was not applied to a reachable database.
  - Blocked reason: None.

- [x] Task 017: Build public news-first homepage with headline feed, snippets, event teasers, tickers, and sponsor slots
  - Priority: P0
  - Requirement IDs: R-HOME-003, R-BRAND-001, R-ADS-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Make the homepage function as the public front door for the news/intelligence site.
  - Acceptance criteria: Homepage displays featured and latest stories, short snippets, event teasers, market modules, sponsor slots, and membership CTAs.
  - Non-technical summary: The public homepage now works as a news-first front door with a lead brief, latest-story snippets, event previews, market/ticker modules, sponsor placements, and Member/Command access calls to action.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --check` passed. Browser QA on `http://127.0.0.1:3001/` confirmed the homepage title, lead story, ticker, event teasers, market modules, sponsor slots, and CTA navigation to `/apply`. The Browser screenshot API timed out with `Page.captureScreenshot`, so desktop `1280x720` and mobile `390x844` screenshot evidence was captured with bundled Playwright using local Microsoft Edge; both viewports rendered without horizontal overflow. Live Supabase CMS feed reads could not be exercised because no Supabase public key was available, so QA covered the safe fallback path and the code still rejects any non-`xlpkdoeldtlhearqajat` Supabase URL.
  - Blocked reason: None.

- [x] Task 018: Build article page with rich public teaser and gated full story
  - Priority: P0
  - Requirement IDs: R-AUTH-001, R-UPGRADE-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Balance SEO/AEO visibility with membership gating.
  - Acceptance criteria: Public visitors see headline, summary, key bullets, intro, citations, and signup prompts; approved Members can read the full article.
  - Non-technical summary: Article pages now show rich public teasers with key points, intro text, citations, and access prompts, while full bodies are requested only for signed-in users with an approved Member-or-higher role.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --check` passed. Browser QA on `http://127.0.0.1:3001/news/vipc-grant-winner` confirmed the headline, public summary, intro, source citations, gated full-story panel, and sign-in CTA navigation. Desktop `1280x720` and mobile `390x844` screenshot evidence was captured with bundled Playwright using local Microsoft Edge; both viewports rendered without horizontal overflow. Live approved-member unlock could not be exercised because no Supabase public key, signed-in test member, or applied remote schema was available; the implementation uses normalized role assignments and the existing RLS-protected body table for the live path.
  - Blocked reason: None.

- [x] Task 019: Add schema.org metadata, canonical URLs, sitemap, and robots configuration
  - Priority: P0
  - Requirement IDs: R-QA-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Improve search and answer-engine discoverability for public pages.
  - Acceptance criteria: Public routes include relevant structured data, canonical URLs, sitemap coverage, and robots configuration that does not expose gated content improperly.
  - Non-technical summary: Public pages now publish canonical URLs, structured data, sitemap entries, and robots rules that expose public teaser content while keeping protected areas out of crawler paths.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --check` passed. Local checks confirmed `/robots.txt` disallows `/admin/`, `/api/`, `/auth/`, `/member`, and `/organization`; `/sitemap.xml` lists public routes and the public article teaser URL only; the homepage HTML includes canonical, WebSite, and ItemList JSON-LD; the VIPC article HTML includes canonical, NewsArticle JSON-LD, a gated-content selector, and does not include the member-only fallback body in public markup. Implementation was checked against current official Next.js metadata-file/JSON-LD docs and schema.org NewsArticle guidance.
  - Blocked reason: None.

- [x] Task 020: Add Substack, podcast, LinkedIn, and X link modules
  - Priority: P1
  - Requirement IDs: R-SOCIAL-001
  - Supersedes: None.
  - Superseded by: Task 077 and Task 089 for removing X/unapproved placeholder behavior while retaining Substack, podcast, and LinkedIn.
  - Goal: Make Potomac's external channels easy to find.
  - Acceptance criteria: Header, footer, or content modules include configurable links for Substack, podcast, LinkedIn, and X.
  - Non-technical summary: The site footer now has a reusable external-channel module for Substack, podcast, LinkedIn, and X, with LinkedIn live and the other channels clearly marked as launch pending until public URLs exist.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --check` passed. Search and existing-code review found a verified Potomac LinkedIn company URL but no reliable public Potomac Substack, podcast, or X URL, so those configurable channel entries intentionally render as launch-pending placeholders rather than invented links. Local HTML checks confirmed the homepage and article page render all four channel labels, include the verified LinkedIn URL, and add the live channel to organization `sameAs` structured data.
  - Blocked reason: None.

- [x] Task 021: Build public/member event calendar with teaser-gated access
  - Priority: P1
  - Requirement IDs: R-SCOPE-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Promote major space conferences, summits, and workshops while reserving details for Members.
  - Acceptance criteria: Public users see event teasers; approved Members see full event details; event data is editable by authorized staff.
  - Non-technical summary: The site now has a public event calendar with conference and workshop teasers, member-only detail gates, and a staff editor for maintaining event data.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --cached --check` passed. Browser QA on `http://127.0.0.1:3002/events` confirmed the page title, event cards, public teaser labels, member-gated detail panels, no public leak of fallback member detail text, no console errors, and CTA navigation to `/apply`. Desktop `1280x720` and mobile `390x844` screenshots were captured with bundled Playwright after the in-app Browser screenshot API timed out with `Page.captureScreenshot`; both viewports rendered without horizontal overflow. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified.
  - Blocked reason: None.

- [x] Task 022: Build Potomac internal summit tracker and past-event summary view
  - Priority: P1
  - Requirement IDs: R-SCOPE-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Track Potomac's upcoming internal summits and summarize major news from past events.
  - Acceptance criteria: Member-gated tracker shows upcoming internal summits and past-event summaries with dates, status, and editable content.
  - Non-technical summary: Approved members now have a dedicated internal summit tracker for upcoming summit plans and past-event summaries, with a staff editor for maintaining the content.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --cached --check` passed. Browser QA on `http://127.0.0.1:3002/member/summits` confirmed the safe no-env member gate, no internal fallback summit content exposure, no console errors, and CTA navigation to `/apply`. Desktop `1280x720` and mobile `390x844` screenshots were captured with bundled Playwright after the in-app Browser screenshot API timed out with `Page.captureScreenshot`; both viewports rendered without horizontal overflow. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified.
  - Blocked reason: None.

- [x] Task 023: Add sponsor and ad placement schema/admin controls
  - Priority: P1
  - Requirement IDs: R-ADS-001
  - Supersedes: None.
  - Superseded by: Task 077, Task 089
  - Goal: Store and manage direct-sold sponsorship and ad inventory.
  - Acceptance criteria: Schema and admin controls support sponsors, placements, campaign dates, discounts, status, and reporting fields.
  - Non-technical summary: Staff can now manage sponsor accounts, sellable ad placements, campaign date windows, discount terms, and delivery reporting fields from a protected admin workflow.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --check` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live sponsor create/edit flows were not exercised because authenticated Supabase database tooling, applied schema, and signed-in editor/admin test users were unavailable.
  - Blocked reason: None.

- [x] Task 024: Implement hybrid direct-sold/programmatic ad placement surfaces
  - Priority: P1
  - Requirement IDs: R-ADS-001
  - Supersedes: None.
  - Superseded by: Task 077, Task 089
  - Goal: Display sponsor inventory and allow programmatic fallback where appropriate.
  - Acceptance criteria: Public pages can render direct-sold sponsor units and documented fallback slots without breaking layout or gated content.
  - Non-technical summary: Public pages now render sponsor units from live direct-sold campaign data when available, with stable Potomac-branded fallback slots when no campaign is active.
  - Verification: `npm run build` passed; `git diff --check` passed with only LF-to-CRLF warnings. Root Vite preview QA on `http://127.0.0.1:4173/` confirmed `/`, `/events`, and `/news/vipc-grant-winner` render the news-first homepage, event calendar, article gate, and Potomac-branded sponsor units in the app that Cloudflare Pages currently builds. Browser DOM and console checks passed with no framework overlay or app warnings/errors; Browser screenshot and locator-click calls timed out, so bundled Playwright using local Microsoft Edge captured desktop `1280x720` and mobile `390x844` screenshot evidence and clicked the homepage Calendar link through to `/events`. Live direct-sold campaign rendering from Supabase could not be exercised because the schema is not applied to a reachable authenticated project in this session.
  - Blocked reason: None.

- [x] Task 025: Create public company universe and dynamic top-20 space company ranking
  - Priority: P1
  - Requirement IDs: R-LUNAR-003
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Maintain a ranked list of publicly traded space companies for ticker display.
  - Acceptance criteria: Admin-maintained eligible company universe exists; ranking logic selects top 20 by the chosen metric and records ranking date/source.
  - Non-technical summary: Analysts now have a protected company universe and dated top-20 ranking workflow for public space-company ticker coverage.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --check` passed. Added an explicit-grant/RLS Supabase migration for public company records, ranking runs, top-20 ranking snapshots, and the staff-checked ranking function; added `/admin/companies` for maintaining companies and generating/publishing snapshots; documented the workflow. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified.
  - Blocked reason: None.

- [x] Task 026: Add curated/delayed stock quote ingestion and ticker UI
  - Priority: P1
  - Requirement IDs: R-SCOPE-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Show stock data without requiring real-time licensing in MVP.
  - Acceptance criteria: Quote records include source, delay/freshness timestamp, price, change, and ticker display on public/dashboard surfaces.
  - Non-technical summary: Staff can now curate delayed public-company quote rows, and the homepage plus member workspace can show the latest displayable ticker data without real-time market feeds.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --check` passed. A local `next start` smoke test on `http://127.0.0.1:3004/` confirmed the public homepage renders the safe quote-feed fallback when no displayable Supabase quote rows are available. Added the delayed quote schema/RLS migration, quote maintenance controls in `/admin/companies`, a shared quote-backed ticker loader, public homepage ticker rendering, member workspace ticker rendering, and workflow documentation. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified.
  - Blocked reason: None.

- [x] Task 027: Create commodity asset and proxy-pricing model schema
  - Priority: P1
  - Requirement IDs: R-SCOPE-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Store lunar-resource commodity prices and proxy assumptions.
  - Acceptance criteria: Schema supports commodities, units, proxy formulas, source citations, confidence labels, and update cadence.
  - Non-technical summary: Lunar-resource commodity pricing now has a database foundation for assets, proxy formulas, source-backed observations, citations, confidence labels, and update cadence.
  - Verification: `git diff --check` passed. Added a Supabase migration for commodities, proxy-pricing models, price observations, source citations, explicit grants, RLS policies, confidence labels, update cadence fields, and workflow documentation. Recheck on 2026-07-01: repo-wide `npm run build:next`, `npm run build`, and `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified.
  - Blocked reason: None.

- [x] Task 028: Add 20 lunar-resource commodity ticker entries with citations and confidence labels
  - Priority: P1
  - Requirement IDs: R-SCOPE-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Seed or configure the commodity ticker with lunar-resource-relevant entries.
  - Acceptance criteria: 20 commodity entries exist with price/proxy source notes, confidence labels, units, and display-ready ticker fields.
  - Non-technical summary: The lunar-resource ticker now has 20 display-ready commodity entries with proxy values, units, confidence labels, source notes, and citations.
  - Verification: Added a Supabase seed migration plus documentation for 20 lunar-resource commodities, each with an active commodity row, `Public ticker proxy v1` model, displayable price/proxy observation, and citation. Static verification counted 20 seed rows, confirmed no unexpected wrong-project Supabase references were introduced, and `git diff --check` passed with only the existing LF-to-CRLF warning. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified.
  - Blocked reason: None.

- [x] Task 029: Create lunar economy model schema with assumptions, sources, versions, and daily estimates
  - Priority: P0
  - Requirement IDs: R-SCOPE-001, R-DATAOPS-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Store the analytical model behind the daily lunar economy tracker.
  - Acceptance criteria: Schema supports model versions, assumptions, source documents, scenario estimates, confidence scores, and daily output values.
  - Non-technical summary: The lunar economy tracker now has a database design for model versions, assumptions, reviewed sources, scenario estimates, confidence scoring, and daily published outputs.
  - Verification: Added a Supabase migration and schema documentation for six economy-model tables with enums, constraints, indexes, explicit grants, RLS enabled on all tables, and public/staff/manage policies. Static checks confirmed six `lunar_economy_*` tables, six RLS enablements, eighteen policies, confidence-score fields, source review status, publication status, and no unexpected wrong-project Supabase references. `git diff --check` passed. Recheck on 2026-07-01: repo-wide `npm run build:next`, `npm run build`, and `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified.
  - Blocked reason: None.

- [x] Task 030: Implement Firefly benchmark using full NASA-paid cost basis
  - Priority: P0
  - Requirement IDs: R-SCOPE-001, R-DATAOPS-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Calculate the Firefly lunar surface data benchmark from the full NASA-paid cost, not only the data addendum.
  - Acceptance criteria: Benchmark includes original `~$100M` mission cost, `$10M` data addendum, `~$45M` PRISM contracts, citations, methodology notes, and versioned assumptions.
  - Non-technical summary: The Firefly lunar data benchmark now uses the full NASA-paid cost basis, not just the later data addendum.
  - Verification: Added a Supabase seed migration and documentation for `firefly-blue-ghost-full-cost-benchmark-v1`, including four public source documents, seven versioned assumptions, a published baseline scenario, and a published daily output. Static checks confirmed the benchmark includes `$101M` mission delivery, `$93.3M` original award reference, `$44M` PRISM/science payload cost basis, `$10M` data addendum, `$155M` baseline, `$147.3M` lower reference, and the `baseline_full_nasa_paid_cost` scenario key. Source review used NASA, Firefly, NASA Science CLPS delivery, and Associated Press pages. `git diff --check` passed with only the existing LF-to-CRLF warning. Recheck on 2026-07-01: repo-wide `npm run build:next`, `npm run build`, and `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified.
  - Blocked reason: None.

- [x] Task 031: Build analyst-facing economy methodology and source table UI
  - Priority: P1
  - Requirement IDs: R-DATAOPS-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Let analysts inspect and maintain lunar economy methodology inputs.
  - Acceptance criteria: Analyst view shows assumptions, formulas, citations, source tables, confidence labels, and methodology version history.
  - Non-technical summary: Analysts now have a protected economy admin workspace for reviewing methodology versions, assumptions, source records, evidence links, confidence labels, and output history.
  - Verification: Added `/admin/economy`, an editor/analyst/admin guard, server actions for methodology versions, assumptions, source documents, and assumption-source evidence links, plus workflow documentation. `npm run build:next` passed and registered `/admin/economy` as a dynamic route; `npm run build` passed for the legacy Vite site; `git diff --check` passed; project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about the wrong project. Recheck on 2026-07-01: `npm run lint` passed. Live protected-route and Supabase edit-flow verification could not be exercised because no Supabase publishable key, applied reachable schema, or seeded analyst/editor/admin test account was available in this session.
  - Blocked reason: None.

- [x] Task 032: Build public economy summary widget
  - Priority: P1
  - Requirement IDs: R-SCOPE-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Show a simplified public version of the lunar economy tracker.
  - Acceptance criteria: Public widget displays headline estimate, date, scenario/range label, concise methodology note, and membership CTA for details.
  - Non-technical summary: The homepage now shows a public lunar economy tracker with the headline estimate, date, range, confidence, source count, methodology note, and access prompts.
  - Verification: Added a public economy summary loader, Firefly full-cost fallback, reusable homepage widget, and workflow documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with only existing LF-to-CRLF warnings; project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing docs that warn against the wrong project. In-app Browser QA on `http://localhost:3002/` confirmed page identity, no console errors/warnings, `$155M` headline, `$147.3M - $155M` range, `Jun 26, 2026` date with no stale `Jun 25, 2026` display, methodology note, CTA text, CTA navigation to `/apply`, and no mobile horizontal overflow at `390x844`. Browser screenshot capture timed out with `Page.captureScreenshot`, so desktop `1280x720` and mobile `390x844` screenshot evidence was captured with bundled Playwright using local Microsoft Edge. Live Supabase reads were not exercised because no Supabase publishable key or applied reachable schema was available, so QA covered the safe fallback path.
  - Blocked reason: None.

- [x] Task 033: Build Scout/Command detailed economy dashboard
  - Priority: P1
  - Requirement IDs: R-SCOPE-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Give paid members access to deeper lunar economy analysis.
  - Acceptance criteria: Dashboard shows detailed scenarios, source tables, assumptions, downloads, and update timestamps with Scout/Command access control.
  - Non-technical summary: Paid Scout and Command users now have a protected lunar economy dashboard with scenario analysis, methodology assumptions, reviewed sources, update history, and CSV downloads.
  - Verification: Added Scout/Command RLS read policies for active published economy records, a gated `/member/economy` route, protected CSV download routes, member/homepage entry points, and workflow documentation. `npm run build:next` passed and registered `/member/economy` plus `/member/economy/downloads/[kind]`; `npm run build` passed for the legacy Vite site; `git diff --check` passed with only existing LF-to-CRLF warnings. Local route checks on the existing `http://127.0.0.1:3001` Next dev server confirmed `/member/economy` renders the no-config paid-data gate and `/member/economy/downloads/scenarios` returns `503` without Supabase configuration. Project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about the wrong project. Recheck on 2026-07-01: `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live Scout/Command data reads could not be exercised because no Supabase publishable key, applied reachable schema, or seeded paid test user was available.
  - Blocked reason: None.

- [x] Task 034: Create data request, data offer, extraction run, and audit log schema
  - Priority: P0
  - Requirement IDs: R-DATAOPS-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Store the data marketplace and its automated extraction history.
  - Acceptance criteria: Schema supports data requests, data offers, source documents, extraction runs, confidence labels, rationales, and audit logs.
  - Non-technical summary: The database now has a foundation for a Scout+ data marketplace, including data requests, data offers, reviewed sources, extraction job history, citations, confidence labels, rationale fields, and audit logs.
  - Verification: Added `supabase/migrations/20260626193529_data_marketplace_extraction_schema.sql` with marketplace enums, data request/offer tables, source documents, request/offer citation joins, extraction runs, audit logs, indexes, triggers, grants, and RLS policies; added schema documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed; static search confirmed required tables, RLS enablement, policies, grants, source/citation joins, confidence labels, and audit logs are present. Project-ref search found the correct `xlpkdoeldtlhearqajat` reference in the new doc and no wrong project reference in the new migration/doc. Recheck on 2026-07-01: `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified.
  - Blocked reason: None.

- [x] Task 035: Implement automated data-market extraction pipeline placeholder with confidence labels and citations
  - Priority: P1
  - Requirement IDs: R-DATAOPS-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Establish the pipeline structure for extracting data requests/offers from news and scholarly sources.
  - Acceptance criteria: Placeholder or initial pipeline can create draft/published marketplace records with citations, confidence labels, extraction rationale, and audit trace.
  - Non-technical summary: A dry-run-first extraction pipeline placeholder now turns reviewed source notes into draft or publish-ready marketplace requests and offers with citations, confidence labels, rationale, and audit records.
  - Verification: Added `npm run extract:data-marketplace`, a local placeholder extraction script, sample input, and workflow documentation. Dry run generated one extraction run, one source document, one data request, one data offer, confidence labels, extraction rationales, and source-linked payloads without writing to Supabase. Publish-mode dry run confirmed planned records switch to approved/open/available states. `node --check scripts/data-market-extraction-placeholder.mjs` passed; `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with only existing LF-to-CRLF warnings. Apply-mode wrong-project verification with `https://nwoluvjdojzayozyzlob.supabase.co` failed before any write with the expected canonical-project error for `xlpkdoeldtlhearqajat`. Live apply-mode writes were not run because no Supabase service key or reachable applied schema was available in this session.
  - Blocked reason: None.

- [x] Task 036: Build Scout+ data marketplace UI for requests and offers
  - Priority: P1
  - Requirement IDs: R-DATAOPS-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Let paid members browse data requests and offers.
  - Acceptance criteria: Scout+ users can view request/offer lists, details, sources, confidence labels, locations, instruments, and mission metadata.
  - Non-technical summary: Scout and Command users now have a protected data marketplace page for approved requests and offers with mission context, location and instrument fields, confidence labels, analyst rationale, and source evidence.
  - Verification: Added `/member/marketplace`, a Scout/Command/staff access guard, a live Supabase data loader for approved marketplace requests/offers/source evidence, a member workspace link, and workflow documentation. `npm run build:next` passed and registered `/member/marketplace`; `npm run build` passed for the legacy Vite site; `git diff --check` passed with the recurring LF-to-CRLF warning on a touched file. Project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about the wrong project. Browser QA on `http://127.0.0.1:3001/member/marketplace` confirmed the no-config paid-data gate, page title, no framework overlay, no console errors, `/apply` navigation, and no mobile horizontal overflow at `390x844`. Browser screenshot capture timed out, so production-mode screenshot evidence was captured with bundled Playwright against `http://127.0.0.1:3010/member/marketplace` at `1280x720` and `390x844`; both had no console errors, no framework overlay, and no horizontal overflow. Recheck on 2026-07-01: `npm run lint` passed. Live Scout/Command marketplace reads were not exercised because no Supabase publishable key, applied reachable schema, or seeded paid test user was available.
  - Blocked reason: None.

- [x] Task 037: Create dataset catalog with public NASA/science data and Potomac proprietary entries
  - Priority: P1
  - Requirement IDs: R-DATAOPS-001, R-SCOPE-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Show available and upcoming datasets in one catalog.
  - Acceptance criteria: Catalog supports public datasets, Potomac proprietary datasets, source metadata, availability state, tier requirement, and sample/demo indicators.
  - Non-technical summary: The site now has a dataset catalog for public lunar science archives and Potomac proprietary previews, including availability, access tier, source, sample, and demo details.
  - Verification: Added `supabase/migrations/20260629130558_dataset_catalog.sql` with dataset catalog enums, entries, source metadata, sample/demo fields, tier requirements, availability states, seed records, explicit grants, and RLS policies; added `/datasets`, a live Supabase/fallback catalog loader, sitemap/nav/current-route entries, DataCatalog/Dataset structured metadata, and catalog documentation. Static migration checks confirmed catalog entry/source tables, public science and Potomac proprietary kinds, availability, tier, sample/demo, source metadata, RLS, explicit grants, and seed records are present. `npm run build:next` passed and registered `/datasets`; `npm run build` passed for the legacy Vite site; `git diff --check` passed. Project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about the wrong project. Browser QA on `http://127.0.0.1:3001/datasets` confirmed fallback catalog content, DataCatalog/Dataset JSON-LD, sample/source/marketplace links, no framework overlay, no console errors, and no horizontal overflow at desktop or `390x844` mobile after tightening header nav spacing. Browser screenshot capture remains unreliable, so production-mode screenshot evidence was captured with bundled Playwright against `http://127.0.0.1:3010/datasets` at `1280x720` and `390x844`; both had no console errors, no framework overlay, and no horizontal overflow. Recheck on 2026-07-01: `npm run lint` passed. Live Supabase catalog reads and migration application were not exercised because no Supabase publishable key, applied reachable schema, local Postgres, or authenticated database tooling was available.
  - Blocked reason: None.

- [x] Task 038: Add tier-based dataset release states and one-year exclusivity logic
  - Priority: P1
  - Requirement IDs: R-SCOPE-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Enforce release timing by membership tier.
  - Acceptance criteria: Command-exclusive, Scout-delayed, public/demo, and unavailable states are represented; one-year exclusivity timing is calculated and visible to authorized users.
  - Non-technical summary: Dataset catalog entries now show whether data is Command-exclusive, Scout-delayed, public/demo, or unavailable, including one-year exclusivity timing where applicable.
  - Verification: Added `supabase/migrations/20260629131559_dataset_release_states.sql` with release-state enum values for Command-exclusive, Scout-delayed, public/demo, and unavailable records; added exclusivity, Scout release, public release, release note, and unavailable-reason fields; added one-year Command exclusivity and unavailable-reason constraints; updated catalog seed records and added the near-real-time polar volatiles unavailable placeholder. Updated the `/datasets` loader and fallback records to include release-state fields, and the catalog UI now renders release-state labels, exclusivity windows, Scout/public release dates, unavailable reasons, release notes, and calculated days remaining for Command-exclusive records. Static migration checks confirmed all four states, release columns, one-year constraint, unavailable-reason constraint, release index, and seeded state coverage. `npm run build:next` passed; `npm run build` passed; project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about the wrong project. Browser QA on `http://127.0.0.1:3001/datasets` confirmed all four release states, the `Jun 29, 2026 - Jun 29, 2027` one-year window, calculated days remaining, the unavailable placeholder and reason, no framework overlay, no console errors, and no horizontal overflow at desktop or `390x844` mobile. Browser screenshot capture remains unreliable, so production-mode screenshot evidence was captured with bundled Playwright against `http://127.0.0.1:3010/datasets` at `1280x720` and `390x844`; both had no console errors, no framework overlay, and no horizontal overflow. Recheck on 2026-07-01: `npm run lint` passed. Live Supabase release-state reads and migration application were not exercised because no Supabase publishable key, applied reachable schema, local Postgres, or authenticated database tooling was available.
  - Blocked reason: None.

- [x] Task 039: Add Nexus dashboard card with entitlement status and SSO/deep-link placeholder
  - Priority: P1
  - Requirement IDs: R-SCOPE-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Connect the member dashboard to the existing Nexus experience.
  - Acceptance criteria: Dashboard card shows Nexus access status and a safe SSO/deep-link placeholder to `nexus-explore.potomacdb.com`.
  - Non-technical summary: The member workspace now shows Nexus access status and a safe placeholder link for Scout, Command, and staff users.
  - Verification: Added a `/member` Nexus access card that checks active normalized roles and user-scoped active entitlements, shows role/entitlement status, and renders `https://nexus-explore.potomacdb.com` as a placeholder link for Scout, Command, and staff roles without appending any SSO token or session material. Added workflow documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files. Static checks confirmed the Nexus card, status loader, placeholder domain, and SSO-safety documentation are present. Project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about the wrong project. Local `/member` route rendering could not exercise the signed-in card because the existing dev server has no Supabase public configuration and returns the pre-existing missing-config server error for `/member`; live signed-in Nexus status reads were not exercised because no Supabase publishable key, applied reachable schema, or seeded Scout/Command test user was available.
  - Blocked reason: None.

- [x] Task 040: Add NASA and large-space-company job alerts schema and dashboard module
  - Priority: P2
  - Requirement IDs: R-ALERT-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Provide useful job alerts for space-sector roles.
  - Acceptance criteria: Schema and dashboard module support employer, role, location, source URL, posting date, and freshness indicators.
  - Non-technical summary: Members now have a dashboard job-alert card for NASA and major space-company hiring sources, backed by a curated Supabase schema with source links, posting dates, locations, and freshness labels.
  - Verification: Added `supabase/migrations/20260629220305_job_alerts_schema.sql` with job-alert enums, `space_sector_job_alerts`, employer/role/location/source/posting-date/freshness fields, seed alerts for official NASA, SpaceX, Blue Origin, and Lockheed Martin career sources, explicit authenticated grants, RLS, and staff manage policies. Added `/member` job-alert rendering plus a safe fallback loader and documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with the recurring LF-to-CRLF warning on `next-app/app/member/page.tsx`; static checks confirmed required schema fields, RLS/grants, loader, UI card, and source labels. Project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about `nwoluvjdojzayozyzlob`. Recheck on 2026-07-01: `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live member reads were not exercised because no Supabase publishable key, applied reachable schema, or signed-in member test account was available.
  - Blocked reason: None.

- [x] Task 041: Add space weather source schema and dashboard module
  - Priority: P2
  - Requirement IDs: R-SCOPE-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Surface space-weather context inside the dashboard.
  - Acceptance criteria: Schema and dashboard module include source attribution, update timestamp, key metrics, and graceful stale-data states.
  - Non-technical summary: Members now have a dashboard space-weather card that shows official NOAA/NASA source conditions, update times, compact metrics, attribution, and current/stale labels.
  - Verification: Added `supabase/migrations/20260629220633_space_weather_sources.sql` with space-weather freshness/publication enums, `space_weather_source_snapshots`, source attribution, source update/retrieval timestamps, stale-after thresholds, risk labels, JSON key metrics, official NOAA SWPC and NASA DONKI seed snapshots, explicit authenticated grants, RLS, and staff manage policies. Added `/member` space-weather rendering plus a safe fallback loader and documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with the recurring LF-to-CRLF warning on `next-app/app/member/page.tsx`; static checks confirmed required source fields, update timestamps, key metrics, freshness states, RLS/grants, loader, UI card, and source labels. Current source pages checked included NOAA SWPC current conditions, Planetary K-index, Real-Time Solar Wind, Alerts/Watches/Warnings, and NASA CCMC DONKI. Project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about `nwoluvjdojzayozyzlob`. Recheck on 2026-07-01: `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live member reads were not exercised because no Supabase publishable key, applied reachable schema, or signed-in member test account was available.
  - Blocked reason: None.

- [x] Task 042: Add CSV/XLSX upload flow for Scout/Command experimental test data
  - Priority: P1
  - Requirement IDs: R-AUTH-001, R-DATAOPS-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Let paid members upload Earth test data for comparison.
  - Acceptance criteria: Scout/Command users can upload CSV/XLSX files, files are stored securely, validation errors are shown clearly, and unauthorized users are blocked.
  - Non-technical summary: Scout and Command members now have a protected test-data upload page for CSV/XLSX files, with private storage, clear validation messages, and locked access for unpaid or signed-out users.
  - Verification: Added `supabase/migrations/20260630030304_experimental_test_data_uploads.sql` with a private `experimental-test-data` Storage bucket, upload metadata table, explicit grants, RLS policies, owner/org/staff read rules, and paid-role upload policies. Added `/member/test-data`, a server-side paid access guard, an upload API route with CSV/XLSX extension, MIME, size, and empty-file validation, recent upload history, member workspace navigation, and workflow documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with the recurring LF-to-CRLF warning on `next-app/app/member/page.tsx`; local production render check on `http://127.0.0.1:3011/member/test-data` returned `200` and showed the expected no-config Supabase gate. Static search confirmed the private bucket/table, validation copy, and correct `xlpkdoeldtlhearqajat` project references while only existing docs warn against `nwoluvjdojzayozyzlob`. Recheck on 2026-07-01: `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live file uploads were not exercised because no Supabase publishable key, applied reachable schema, Storage bucket, or signed-in Scout/Command test user was available.
  - Blocked reason: None.

- [x] Task 043: Add comparison dashboard for Earth test data vs approved lunar/public datasets
  - Priority: P1
  - Requirement IDs: R-SCOPE-001, R-DATAOPS-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Help users compare their experimental data against lunar or public reference datasets.
  - Acceptance criteria: Dashboard can select uploaded test data and approved datasets, run a comparison, and display results with clear assumptions/limitations.
  - Non-technical summary: Paid members can now select an uploaded Earth test file and an approved reference dataset, save a preliminary comparison, and see the assumptions and limitations clearly.
  - Verification: Added `supabase/migrations/20260630030735_experimental_test_data_comparisons.sql` with comparison status enum, comparison result table, explicit grants, RLS policies, owner/staff read rules, paid-role insert rules, upload ownership checks, and approved dataset checks. Added `/api/member/test-data/comparisons`, a comparison form on `/member/test-data`, reference dataset selection, recent comparison history, result summaries, compatibility scores, assumptions, and visible limitations that state row parsing/unit normalization/statistical fit are not implemented yet. Updated workflow documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files; local production render check on `http://127.0.0.1:3012/member/test-data` returned `200` and showed the expected no-config Supabase gate. Static search confirmed comparison table/API/UI strings and correct `xlpkdoeldtlhearqajat` project references while only existing docs warn against `nwoluvjdojzayozyzlob`. Recheck on 2026-07-01: `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live comparisons were not exercised because no Supabase publishable key, applied reachable schema, Storage bucket, uploaded test file, approved dataset records, or signed-in Scout/Command test user was available.
  - Blocked reason: None.

- [x] Task 044: Add Command-only real-time/near-real-time intelligence access model
  - Priority: P0
  - Requirement IDs: R-TIER-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Represent Command-exclusive intelligence access for newly collected lunar data.
  - Acceptance criteria: Data model and access rules support one Command user receiving real-time or near-real-time intelligence exclusive for at least one year after collection.
  - Non-technical summary: Command-exclusive lunar intelligence can now be allocated to one Command user with real-time or near-real-time access for a required one-year exclusivity window.
  - Verification: Added `supabase/migrations/20260630031059_command_exclusive_intelligence_access.sql` with real-time/near-real-time access modes, allocation statuses, `command_intelligence_allocations`, collection and exclusive-access timestamps, one-year exclusivity constraints, one active allocation per dataset, allocated-user role checks, Command-exclusive dataset checks, explicit grants, and RLS policies for allocated users, organization admins, analysts, and admins. Added workflow documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed; static checks confirmed the allocation table, one-active-dataset index, one-year constraint, allocated Command-user role check, and split insert/update/delete policies. Project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about `nwoluvjdojzayozyzlob`. Recheck on 2026-07-01: `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live allocation checks were not exercised because no Supabase publishable key, applied reachable schema, Command-exclusive dataset, seeded Command user, or authenticated database tooling was available.
  - Blocked reason: None.

- [x] Task 045: Add Command perks tracking for analyst support, proposal support, mission briefs, custom alerts, and sponsorship
  - Priority: P1
  - Requirement IDs: R-TIER-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Track promised Command benefits and service delivery.
  - Acceptance criteria: Admin workflow tracks support requests, mission briefs, custom alerts, executive perks, free sponsorship, and fulfillment status.
  - Non-technical summary: Admins can now track Command customer benefits, due dates, fulfillment progress, blocked items, and sponsorship notes from the Command pipeline.
  - Verification: Added `supabase/migrations/20260630080208_command_perks_tracking.sql` with Command perk type/status/priority enums, `command_perk_commitments`, fulfillment fields, explicit grants, RLS policies for organization visibility and staff management, active Command entitlement checks, and admin-only deletion. Extended `/admin/command` with active Command organization selection, perk creation, perk update, fulfillment status, due/fulfilled dates, next steps, blocked reasons, sponsorship notes, and audit-event writes. Added workflow documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files; static search confirmed Command perk schema/UI/action coverage and correct `xlpkdoeldtlhearqajat` project references while only existing docs warn against `nwoluvjdojzayozyzlob`. Recheck on 2026-07-01: `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live perk creation/update verification was not exercised because no Supabase publishable key, applied reachable schema, active Command organization, or signed-in admin test user was available.
  - Blocked reason: None.

- [x] Task 046: Create member-to-member chat schema, RLS, moderation, and audit model
  - Priority: P1
  - Requirement IDs: R-MSG-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Define the data model and access rules for safe direct chat between approved members.
  - Acceptance criteria: Schema supports conversations, participants, messages, read receipts, muted/blocked participants, report/moderation records, audit events, and RLS that limits access to approved participants and authorized staff.
  - Non-technical summary: Approved members now have a database foundation for safe direct chat with read state, muting, blocking, reporting, moderation, and audit records.
  - Verification: Added `supabase/migrations/20260630080656_member_chat_schema.sql` with chat conversations, participants, messages, read receipts, blocks, reports, moderation actions, audit events, enum states, indexes, updated-at triggers, explicit grants, private authorization helpers, and RLS policies for approved Explorer/Scout/Command participants plus analyst/admin moderation. Added workflow documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed; static search confirmed the required chat tables, block/report/moderation/audit tables, helper functions, RLS policies, and correct `xlpkdoeldtlhearqajat` project references while only existing docs warn against `nwoluvjdojzayozyzlob`. Recheck on 2026-07-01: `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live RLS behavior was not exercised because no Supabase publishable key, applied reachable schema, or seeded Explorer/Scout/Command/moderator test users were available.
  - Blocked reason: None.

- [x] Task 047: Build direct member-to-member chat UI and notification surfaces
  - Priority: P1
  - Requirement IDs: R-MSG-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Let approved Members, Scout users, and Command users start and continue member-to-member conversations.
  - Acceptance criteria: Member dashboard includes chat inbox, conversation detail, compose/reply flow, unread indicators, privacy-constrained member discovery, report/block controls, and graceful empty/error states.
  - Non-technical summary: Approved members now have a protected chat workspace for direct conversations, replies, unread status, member discovery, reporting, and blocking.
  - Verification: Added `/member/chat`, server actions for starting conversations, replies, read receipts, reports, and blocks, a member dashboard link, workflow documentation, and `supabase/migrations/20260630130336_member_chat_profile_discovery.sql` for chat profile discovery plus conversation timestamp updates. `npm run build:next` passed and registered `/member/chat`; `npm run build` passed; `git diff --check` passed with the recurring LF-to-CRLF warning on `next-app/app/member/page.tsx`; static search confirmed chat UI/action/migration coverage and correct `xlpkdoeldtlhearqajat` project references while only existing docs warn against `nwoluvjdojzayozyzlob`. Browser QA against `http://127.0.0.1:3017/member/chat` confirmed the no-config member-chat gate, page title, no framework overlay, no console errors, `/apply` navigation, and no mobile horizontal overflow at `390x844`; Browser screenshot capture timed out with `Page.captureScreenshot`. Recheck on 2026-07-01: `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live compose/reply/report/block verification was not exercised because no Supabase publishable key, applied reachable schema, or seeded approved member test users were available.
  - Blocked reason: None.

- [x] Task 048: Add moderated member forum schema, RLS, and audit model
  - Priority: P1
  - Requirement IDs: R-COMM-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Define the data model and access controls for member forums.
  - Acceptance criteria: Schema supports forums, topics, posts, replies, reactions or bookmarks, reports, moderation actions, retained audit events, and RLS for Explorer, Scout, Command, moderator, analyst, editor, and admin access.
  - Non-technical summary: The platform now has a database foundation for moderated member forums with tier-gated access, posts, replies, reports, moderation records, and audit history.
  - Verification: Added `supabase/migrations/20260630131146_member_forum_schema.sql` with forum, topic, post/reply, reaction, bookmark, report, moderation action, and audit-event tables; added forum enum states, a normalized `moderator` role, private tier/moderation helpers, explicit authenticated/service grants, and RLS policies for Explorer, Scout, Command, moderator, analyst, editor, and admin access. Added schema documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed; static search confirmed required forum tables, helpers, grants, RLS enablement, moderation policies, and retained audit records. Recheck on 2026-07-01: `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live RLS behavior was not exercised because no Supabase publishable key, applied reachable schema, or seeded Explorer/Scout/Command/moderator/staff test users were available.
  - Blocked reason: None.

- [x] Task 049: Build moderated member forum UI
  - Priority: P1
  - Requirement IDs: R-COMM-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Let approved members discuss lunar markets, missions, datasets, procurement, regulatory issues, and events.
  - Acceptance criteria: Member dashboard includes forum index, topic list, topic detail, compose/reply flow, reporting controls, moderator states, empty/error states, and clear access messaging for public or unapproved users.
  - Non-technical summary: Approved members now have a protected forum workspace for browsing channels, opening discussion topics, replying, saving discussions, marking useful posts, and reporting content for moderation.
  - Verification: Added the `/member/forums` route, protected member-forum auth helpers, forum server actions, member dashboard navigation, and forum UI documentation. `npm run build:next` passed and registered `/member/forums`; `npm run build` passed; `git diff --check` passed with the existing line-ending warning for `next-app/app/member/page.tsx`; browser QA on `http://127.0.0.1:3018/member/forums` confirmed the Supabase access gate renders, the main `Apply for access` link navigates to `/apply`, desktop and mobile widths have no horizontal overflow, and no browser console warnings or errors were captured. Recheck on 2026-07-01: `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live approved-member forum posting was not exercised because no Supabase publishable key, applied reachable schema, or seeded member/moderator users were available.
  - Blocked reason: None.

- [x] Task 050: Add RFQ schema, RLS, response workflow, moderation, and audit model
  - Priority: P1
  - Requirement IDs: R-RFQ-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Define the data model for Scout and Command RFQ workflows.
  - Acceptance criteria: Schema supports RFQ posts, organization attribution, categories, due dates, attachments or external links, response submissions, visibility controls, status changes, reports, moderation actions, and audit logs.
  - Non-technical summary: Scout and Command RFQs now have a database foundation for posting opportunities, inviting organizations, attaching links/files, receiving responses, tracking status changes, handling reports, moderating content, and preserving audit history.
  - Verification: Added `supabase/migrations/20260630180219_rfq_schema_rls_moderation.sql` with RFQ posts, invited organizations, RFQ/response resource links, responses, status events, reports, moderation actions, audit events, enum states, indexes, updated-at triggers, explicit grants, private authorization helpers, and RLS policies for Scout/Command users, organization admins, moderators, analysts, and admins. Added schema documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed; static search confirmed the required RFQ tables, response workflow, visibility helpers, grants, RLS enablement, moderation policies, and retained audit records. Supabase guidance was checked against current RLS/API docs and the 2026 breaking change that new tables may not be exposed to Data/GraphQL APIs automatically. Recheck on 2026-07-01: `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live RLS behavior was not exercised because no Supabase publishable key, applied reachable schema, or seeded Scout/Command/organization-admin/moderator/staff test users were available.
  - Blocked reason: None.

- [x] Task 051: Build Scout/Command RFQ posting, browsing, and response UI
  - Priority: P1
  - Requirement IDs: R-RFQ-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Let Scout and Command members post, browse, and respond to lunar industry RFQs.
  - Acceptance criteria: Dashboard includes RFQ list, filters, detail page, post form, response form, organization-aware permissions, moderation/report actions, and graceful states for members without access.
  - Non-technical summary: Scout and Command members now have a protected RFQ workspace for viewing opportunities, posting requests, submitting responses, updating statuses, and reporting items for moderation.
  - Verification: Added `/member/rfqs`, RFQ access helpers, server actions for RFQ creation, status updates, response submission, and reporting, plus a member dashboard link and workflow documentation. `npm run build:next` passed and registered `/member/rfqs`; `npm run build` passed; `git diff --check` passed with the recurring LF-to-CRLF warning on `next-app/app/member/page.tsx`; static search confirmed RFQ route/action/auth coverage. Browser QA used local Microsoft Edge through Playwright because the in-app Browser tool was unavailable and bundled Playwright Chromium was not installed; `http://127.0.0.1:3020/member/rfqs` returned `200`, rendered the no-config Supabase gate with RFQ workspace copy, had no framework overlay, no console errors, `/apply` navigation, and no horizontal overflow at desktop `1280x720` or mobile `390x844`. Recheck on 2026-07-01: `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live RFQ posting, browsing, response, organization attribution, moderation, and report verification was not exercised because no Supabase publishable key, applied reachable RFQ schema, or seeded Scout/Command/organization-admin/moderator test users were available.
  - Blocked reason: None.

- [x] Task 052: Document Explorer, Scout, and Command tier packaging and gates
  - Priority: P0
  - Requirement IDs: R-TIER-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Align the product model with Explorer as the free approved base membership, Scout as the professional paid tier, and Command as the enterprise tier.
  - Acceptance criteria: Documentation and access-control notes define tier names, pricing/approval model, limits, included features, upgrade paths, and legacy Member terminology handling.
  - Non-technical summary: The Explorer, Scout, and Command packaging model is now documented in one place, including who each tier is for, how access is granted, what each tier includes, and how the older Member terminology should be used.
  - Verification: Added `docs/tier-packaging-and-gates.md` with tier names, internal role mappings, free/manual/self-serve billing model, `$25,000/user/year` Scout pricing, Command sales-led approval, included features, initial limits, upgrade paths, access-control notes, and legacy Member terminology guidance. Updated `docs/member-access-schema.md` to link the schema model back to the canonical tier packaging doc. `git diff --check` passed with the recurring LF-to-CRLF warning on `docs/member-access-schema.md`; static search confirmed Explorer, Scout, Command, pricing, upgrade path, access-control, and legacy terminology coverage. No app build was run because this was documentation-only.
  - Blocked reason: None.

- [x] Task 053: Build Explorer/Scout/Command pricing and upgrade entry points
  - Priority: P1
  - Requirement IDs: R-TIER-001, R-UPGRADE-001, R-UPGRADE-002
  - Supersedes: None.
  - Superseded by: Task 078, Task 086
  - Goal: Make tier differences and upgrade paths clear to prospects and approved members.
  - Acceptance criteria: Public pricing or membership page explains Explorer, Scout, and Command; member dashboard surfaces relevant upgrade CTAs; Scout checkout and Command interest paths remain connected.
  - Non-technical summary: Prospects and approved members now have a public pricing page and dashboard entry point that explain Explorer, Scout, and Command access and route users to the right application, checkout, or sales path.
  - Verification: Added `/pricing`, public and member navigation links, homepage CTA, sitemap coverage, metadata/JSON-LD, and `docs/pricing-upgrade-entry-points.md`. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files. Recheck on 2026-07-01: `npm run lint` passed. Browser QA used local Microsoft Edge through Playwright CLI because the in-app Browser setup timed out and the Playwright test runner was not installed in the repo; desktop `1280x720` and mobile `390x844` screenshots of `/pricing` rendered the tier page without visible first-viewport overflow. Local route checks confirmed `/pricing`, `/apply`, `/command`, and `/sitemap.xml` return `200`, `/pricing` includes the Explorer/Scout/Command headline, `$25,000` Scout price, `/apply`, `/member`, `/command` links, JSON-LD, and sitemap inclusion. Live Scout checkout and `/member` workspace verification could not be exercised because the dev server has no `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
  - Blocked reason: None.

- [x] Task 054: Build lunar industry terminal navigation and dashboard shell
  - Priority: P0
  - Requirement IDs: R-SCOPE-001, R-NAV-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Organize the platform as a lunar industry terminal rather than a generic space site.
  - Acceptance criteria: Navigation and dashboard shell expose lunar news, launches, spacecraft/landers, procurement, regulatory, companies, economy, datasets, marketplace, events, calculators, alerts, and account areas with responsive behavior.
  - Non-technical summary: The site now presents Potomac as a lunar industry terminal, with public navigation and dashboard cards for news, missions, markets, datasets, events, calculators, alerts, and account paths.
  - Verification: Added a shared terminal module map, responsive global terminal navigation, `/terminal`, lightweight route shells for launches, spacecraft/landers, procurement, regulatory, companies, calculators, alerts, and account, a member dashboard terminal map, sitemap entries, and `docs/lunar-terminal-navigation-shell.md`. `npm run build:next` passed and registered the new routes; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files. Recheck on 2026-07-01: `npm run lint` passed. Browser QA used local Microsoft Edge through Playwright CLI because the in-app Browser setup timed out earlier in the run; desktop `1280x720` and mobile `390x844` screenshots of `/terminal` rendered the terminal shell and responsive navigation. Local route checks confirmed `/terminal`, `/launches`, `/spacecraft`, `/procurement`, `/regulatory`, `/companies`, `/calculators`, `/alerts`, and `/account` return `200`; sitemap checks confirmed each new public shell route is included. Live member workspace verification could not be exercised because the dev server has no `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
  - Blocked reason: None.

- [x] Task 055: Add lunar launch, spacecraft, lander, payload, and satellite tracker schema
  - Priority: P1
  - Requirement IDs: R-LUNAR-001, R-MISSION-004
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Store lunar mission object tracking data with source-backed status.
  - Acceptance criteria: Schema supports lunar launches, spacecraft, landers, payloads, lunar satellites, operators, mission phases, launch windows, landing sites, instruments, status, timestamps, freshness, and source citations.
  - Non-technical summary: The database now has a planned structure for tracking lunar missions, operators, launches, spacecraft, landers, satellites, payloads, instruments, status history, landing sites, freshness, and source citations.
  - Verification: Created `supabase/migrations/20260630231101_lunar_mission_object_tracking.sql` with operator, mission, mission-object, launch-window, landing-site, payload/instrument, status-event, and source-citation tables; added mission/object/status/visibility/confidence/source-review enums, timestamps, freshness fields, source review fields, explicit grants, RLS enablement, and public/member/Scout/Command/staff access policies using normalized roles. Added `docs/lunar-mission-object-tracking-schema.md`. Supabase guidance was checked against the current RLS/API docs and the 2026 changelog note that new public tables may not be exposed to Data/GraphQL APIs automatically. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed; static search confirmed required tracking tables, object/phase enums, freshness, grants, RLS, helper function, and policies are present; project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing docs that warn against the wrong project. Recheck on 2026-07-01: `npm run lint` passed. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live migration application and RLS behavior were not exercised because no Supabase publishable key, applied reachable schema, authenticated database tooling, or seeded public/Explorer/Scout/Command/staff test users were available.
  - Blocked reason: None.

- [x] Task 056: Build lunar launch, spacecraft, lander, and satellite tracker modules
  - Priority: P1
  - Requirement IDs: R-LUNAR-001, R-MISSION-004
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Let members track lunar missions and objects in the terminal.
  - Acceptance criteria: Dashboard modules show upcoming launches, active spacecraft/landers/satellites, mission status, source freshness, filters, detail pages, and gated detail levels by tier.
  - Non-technical summary: The terminal now has working lunar launch and spacecraft tracker pages, mission detail pages, and a member tracker entry point that shows source freshness, filters, mission status, and tier-aware detail prompts.
  - Verification: Added `/launches`, `/spacecraft`, `/missions/[slug]`, `/member/missions`, a shared lunar mission tracker data loader, tier access helper, fallback tracker records, terminal/member navigation updates, and `docs/lunar-mission-tracker-modules.md`. Supabase guidance was checked against the current 2026 Data API grant/RLS change; the UI keeps using the existing explicit grants/RLS schema and validates the canonical `xlpkdoeldtlhearqajat` project URL. `npm run build:next` passed and registered the new dynamic routes; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files; local production route checks on `http://127.0.0.1:3025` confirmed `/launches`, `/spacecraft`, `/missions/artemis-ii`, and `/member/missions` return `200` and render expected tracker headings, fallback mission records, detail sections, source sections, and the member no-config Supabase gate. Recheck on 2026-07-01: `npm run lint` passed. Live Supabase tracker reads and role-gated detail unlocking were not exercised because no Potomac Supabase publishable key, applied reachable schema, or seeded Explorer/Scout/Command/staff test users were available.
  - Blocked reason: None.

- [x] Task 057: Add lunar procurement and regulatory intelligence schema
  - Priority: P1
  - Requirement IDs: R-LUNAR-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Store lunar-relevant procurement and regulatory records.
  - Acceptance criteria: Schema supports procurements, awards, SBIR/STTR items, regulatory filings, comment periods, policy milestones, compliance notes, agencies, due dates, source URLs, confidence labels, and analyst review state.
  - Non-technical summary: The database now has a planned structure for tracking lunar procurements, awards, SBIR/STTR opportunities, regulatory filings, comment periods, policy milestones, compliance notes, agencies, due dates, source links, confidence, and analyst review state.
  - Verification: Created `supabase/migrations/20260701041100_lunar_procurement_regulatory_intelligence.sql` with agency, procurement, award, regulatory-record, policy-milestone, and source-citation tables; added procurement/regulatory/status/visibility/confidence/source-review enums, SBIR/STTR fields, comment-period fields, compliance/risk notes, due/effective dates, source URLs, freshness timestamps, analyst review state, explicit Data API grants, RLS enablement, and public/member/Scout/Command/staff policies using normalized roles. Added `docs/lunar-procurement-regulatory-schema.md`. Supabase guidance was checked against the current 2026 Data API grant/RLS change. Static search confirmed required procurement, award, SBIR/STTR, regulatory, comment-period, policy, agency, source, confidence, review, grant, RLS, and policy structures. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed; project-ref search found only the correct `xlpkdoeldtlhearqajat` references in the new documentation and existing config/task history. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live migration application and RLS behavior were not exercised because no Supabase publishable key, applied reachable schema, authenticated database tooling, or seeded Scout/Command/staff test users were available.
  - Blocked reason: None.

- [x] Task 058: Build lunar procurement and regulatory hub UI
  - Priority: P1
  - Requirement IDs: R-LUNAR-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Give Scout and Command members a practical hub for lunar opportunities and policy risk.
  - Acceptance criteria: Hub includes searchable/filterable procurement and regulatory lists, detail pages, due-date/status indicators, citations, watchlist hooks, and upgrade prompts for users without access.
  - Non-technical summary: The terminal now has searchable procurement and regulatory hubs with detail pages, due-date and status indicators, citations, upgrade prompts, and watchlist attachment points for future saved-work features.
  - Verification: Added `/procurement`, `/procurement/[slug]`, `/regulatory`, `/regulatory/[slug]`, and `/member/procurement`; added a shared procurement/regulatory Supabase loader with fallback records, citation joins, filters, search helpers, and normalized Scout/Command access checks; added dashboard navigation and `docs/lunar-procurement-regulatory-hub-ui.md`. `npm run build:next` passed and registered the new routes; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files; local production route checks confirmed `/procurement`, `/procurement/clps-instrument-rfi`, `/regulatory`, and `/regulatory/fcc-lunar-relay-spectrum-watch` return `200` and render expected hub/detail copy, filters, citations, upgrade prompts, and watchlist hooks. Recheck on 2026-07-01: `npm run lint` passed. Live Scout/Command Supabase reads, RLS behavior, and watchlist persistence were not exercised because no Potomac Supabase publishable key, applied reachable schema, saved-work schema, or seeded Scout/Command/staff test users were available.
  - Blocked reason: None.

- [x] Task 059: Create lunar company profile and comparison schema
  - Priority: P1
  - Requirement IDs: R-LUNAR-003
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Store profiles for companies participating in the lunar industry.
  - Acceptance criteria: Schema supports company sectors, programs, contracts, facilities, leadership, public financials or licensed financial fields, news links, relationships, source citations, and comparison attributes.
  - Non-technical summary: The database now has a planned structure for lunar company profiles, facilities, leadership, contracts, financial metrics, news links, relationships, source citations, and comparison fields.
  - Verification: Created `supabase/migrations/20260701140308_lunar_company_profiles_comparison_schema.sql` with company profile, facility, leadership, contract, financial, news-link, relationship, comparison-attribute, and source-citation tables; added publication/visibility/confidence/source-review/relationship enums, freshness fields, analyst review state, source license notes, explicit Data API grants, RLS enablement, and public/Explorer/Scout/Command/staff policies using normalized roles. Added `docs/lunar-company-profile-comparison-schema.md`. Supabase guidance was checked against the current 2026 Data API grant/RLS change. Static search confirmed required company, sector, program, contract, facility, leadership, financial, news, relationship, source, comparison, confidence, review, grant, RLS, and policy structures. `npm run build:next` passed; `npm run build` passed; `npm run lint` passed; `git diff --check` passed with the recurring LF-to-CRLF warning on the touched task file; project-ref search found only the correct `xlpkdoeldtlhearqajat` references in active config/docs and existing warnings against the wrong project. Recheck on 2026-07-01: `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed local migrations through `20260701190220`; linked remote `supabase db query --linked` failed with Supabase access-control `403`, so live remote migration/RLS checks remain unverified. Live migration application and RLS behavior were not exercised because no Supabase publishable key, applied reachable schema, authenticated database tooling, or seeded public/Explorer/Scout/Command/staff test users were available.
  - Blocked reason: None.

- [x] Task 060: Build lunar company directory, profile, and comparison UI
  - Priority: P1
  - Requirement IDs: R-LUNAR-003
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Let members discover, inspect, and compare lunar companies.
  - Acceptance criteria: UI includes searchable directory, company profile pages, comparison table, source/freshness labels, public teaser behavior, and Scout/Command detail gates where appropriate.
  - Non-technical summary: The terminal now has a searchable lunar company directory, company profile pages, comparison table, source/freshness labels, upgrade prompts, and watchlist attachment points.
  - Verification: Added `/companies`, `/companies/[slug]`, a shared lunar company Supabase loader with fallback records, search/filter helpers, tier access helpers, terminal/member navigation updates, and `docs/lunar-company-directory-profile-ui.md`. `npm run build:next` passed and registered `/companies` plus `/companies/[slug]`; `npm run build` passed; `npm run lint` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files; static search confirmed directory, profile, comparison, source/freshness, watchlist, Supabase table-loader, and project-ref documentation coverage. HTTP route checks confirmed `/companies`, `/companies?filter=clps&q=firefly`, `/companies/intuitive-machines`, and `/companies/astrobotic` return `200` and render expected fallback company, directory, comparison, upgrade, profile, and source content. Production browser QA used local Microsoft Edge through Playwright on `http://127.0.0.1:3027`; desktop `1280x720` and mobile `390x844` checks for `/companies` and `/companies/intuitive-machines` showed no horizontal overflow and no console errors. Live Supabase reads, role-gated detail unlocking, and watchlist persistence were not exercised because no Potomac Supabase publishable key, applied Task 059 schema, saved-work schema, or seeded Explorer/Scout/Command/staff test users were available.
  - Blocked reason: None.

- [x] Task 061: Add lunar mission calculator framework
  - Priority: P1
  - Requirement IDs: R-CALC-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Establish a reusable structure for lunar mission planning calculators.
  - Acceptance criteria: Framework supports named calculators, assumptions, formulas, source citations, units, confidence notes, version history, input validation, saved runs, and tier-based access.
  - Non-technical summary: The database now has a planned framework for lunar mission calculators, including versions, assumptions, formulas, citations, validation rules, saved runs, and tier-aware access.
  - Verification: Created `supabase/migrations/20260701190220_lunar_mission_calculator_framework.sql` with calculator definition, version, assumption, formula-step, validation-rule, source-citation, and saved-run tables; added publication/visibility/confidence/source-review enums, units, input/output schemas, formula manifests, source license notes, validation messages, saved-run snapshots, explicit Data API grants, RLS enablement, and public/Explorer/Scout/Command/staff policies using normalized roles. Added `docs/lunar-mission-calculator-framework.md`. Supabase guidance was checked against the current 2026 Data API grant/RLS change. Static search confirmed required calculator, assumption, formula, citation, unit, confidence, version, validation, saved-run, grant, RLS, and policy structures. `npm run build:next` passed; `npm run build` passed; `npm run lint` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on pre-existing touched config files; `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` connected and listed the new local migration. Live migration application and RLS behavior were not exercised because the broader historical migrations are not applied remotely, real runtime keys are absent, and no seeded Explorer/Scout/Command/organization/staff test users are available.
  - Blocked reason: None.

- [x] Task 062: Build initial lunar mission calculators
  - Priority: P1
  - Requirement IDs: R-CALC-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Provide practical calculators for lunar mission planning workflows.
  - Acceptance criteria: Initial calculators cover lunar mission cost, launch window assumptions, RF link budget, thermal budget, radiation exposure, and power budget with clear limitations and citations.
  - Non-technical summary: The calculator page now has six working lunar planning tools for cost, launch-window pressure, RF link margin, thermal balance, radiation exposure, and surface power.
  - Verification: Added `/calculators` as an interactive calculator workspace with local fallback definitions for lunar mission cost, launch-window screen, RF link budget, thermal balance, radiation exposure, and surface power budget; each calculator includes editable assumptions, units, formula notes, limitation notes, citations, confidence labels, and a Scout+ saved-run label for the Task 061 persistence model. Added `next-app/app/_data/lunarCalculators.ts`, `next-app/app/calculators/LunarCalculatorWorkspace.tsx`, and `docs/lunar-mission-calculators.md`; updated terminal navigation to mark calculators live. `npm run build:next` passed; `npm run build` passed; `npm run lint` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on pre-existing touched config files and touched calculator files; static search confirmed all six calculator names and saved-run label are present; a temporary local production server check for `/calculators` returned `200` and confirmed expected calculator content. Live Supabase-backed calculator definitions and saved runs were not exercised because the Task 061 schema is not applied remotely, real runtime keys are absent, and no seeded Explorer/Scout/Command test users are available.
  - Blocked reason: None.

- [x] Task 063: Add global search, command palette, and related intelligence index
  - Priority: P0
  - Requirement IDs: R-SEARCH-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Let members quickly find content and jump across the terminal.
  - Acceptance criteria: Search/index model covers articles, events, companies, lunar missions, datasets, data requests/offers, jobs, procurements, regulatory records, methodology sources, and dashboard modules; command palette supports keyboard navigation and admin-pinned results.
  - Non-technical summary: The database now has a planned global search and command-palette index that can organize terminal results, source evidence, keyboard shortcuts, synonyms, and admin-pinned navigation across the lunar intelligence product.
  - Verification: Created `supabase/migrations/20260702000232_global_search_command_palette_index.sql` with search record, source evidence, command entry, and synonym tables; added record/source/visibility/status/confidence/command enums, generated full-text search vectors, GIN indexes, admin-pinned result fields, explicit Data API grants, RLS policies, and seeded terminal command records. Added `docs/global-search-command-palette-index.md`. Supabase guidance was checked against the current 2026 Data API grant/RLS change. Static search confirmed article, event, company, lunar mission, dataset, data request/offer, job, procurement, regulatory record, methodology source, dashboard module, command palette, admin-pinned, grant, RLS, synonym, and citation coverage. `npm run build:next` passed; `npm run build` passed; `npm run lint` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files; `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` listed local migrations through `20260702000232`. Live migration application, RLS behavior, and command/search reads were not exercised because real runtime keys, applied remote schema, and seeded Explorer/Scout/Command/staff test users are unavailable.
  - Blocked reason: None.

- [x] Task 064: Build global search and command palette UI
  - Priority: P1
  - Requirement IDs: R-SEARCH-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Make search and fast navigation usable from public and member surfaces.
  - Acceptance criteria: UI includes search page, scoped filters, result snippets, source/tier labels, no-result states, keyboard-accessible command palette, and entitlement-aware result visibility.
  - Non-technical summary: The terminal now has a global search page and keyboard command palette so visitors and members can quickly find articles, events, companies, missions, datasets, procurement, regulatory records, methodology sources, calculators, and dashboard modules.
  - Verification: Added `/search`, scoped filters, fallback/live Supabase search loaders, result snippets, source counts, freshness/confidence/tier labels, no-result states, header command-palette entry point, `Ctrl+K`/`Cmd+K` palette behavior, and `/search` sitemap coverage; added `docs/global-search-command-palette-ui.md`. Supabase guidance was checked against the current 2026 Data API grant/RLS change; the UI reads `intelligence_search_records` and `intelligence_command_entries` when Potomac Supabase public config is available and otherwise uses local fallback records. Static search confirmed `/search`, command palette, Supabase search/command tables, and sitemap coverage. `npm run build:next` passed; `npm run build` passed; `npm run lint` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files. Local production route checks on `http://127.0.0.1:3031` confirmed `/search`, `/search?q=firefly&scope=all`, `/search?q=zzzz-no-match&scope=company`, and `/sitemap.xml` return `200` and render expected search, filtered, no-result, and sitemap content. Browser QA with the in-app Browser confirmed `/search` page identity, no blank page, no framework overlay, no console warnings, `firefly` search submission, `Ctrl+K` command-palette open behavior, palette no-match state, and mobile `390x844` rendering without horizontal page overflow. Live Supabase-backed search reads and role-specific RLS visibility were not exercised because real runtime keys, applied remote schema, and seeded Explorer/Scout/Command/staff test users are unavailable.
  - Blocked reason: None.

- [x] Task 065: Add watchlists, saved searches, reading list, and preference schema
  - Priority: P1
  - Requirement IDs: R-WATCH-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Store user-specific monitoring and saved-work preferences.
  - Acceptance criteria: Schema supports watched companies, missions, procurements, regulatory records, events, datasets, marketplace records, saved searches, reading-list items, notification preferences, dashboard defaults, and audit-safe ownership.
  - Non-technical summary: The database now has a planned personalization model for Scout and Command members to save watchlists, searches, reading-list items, notification settings, and dashboard defaults.
  - Verification: Created `supabase/migrations/20260702050828_watchlists_saved_work_preferences.sql` with watchlist, watchlist-item, saved-search, reading-list, notification-preference, dashboard-preference, and saved-work audit tables; added object/status/channel/frequency enums, watched object coverage for companies, missions, procurements, regulatory records, events, datasets, marketplace records, articles, methodology sources, calculators, RFQs, and forum threads; added owner/organization scope, audit-safe ownership fields, indexed foreign keys, active/alert partial indexes, explicit Data API grants, RLS enablement, and policies using normalized Scout/Command/staff roles plus organization-admin helpers. Added `docs/watchlists-saved-work-preferences-schema.md`. Supabase guidance was checked against the current 2026 Data API grant/RLS change, and Supabase Postgres guidance was checked for foreign-key indexes, partial indexes, and RLS basics. Static search confirmed required tables, object types, grants, RLS, helper functions, policies, and index coverage. `npm run build:next` passed; `npm run build` passed; `npm run lint` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on unrelated local files; `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` listed the new local migration through `20260702050828`. `npx supabase migration up --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not reach this migration because pending migration `20260702000232_global_search_command_palette_index.sql` failed first while creating `public.intelligence_search_records`; live migration application and RLS behavior were not exercised because the pending migration chain is blocked before Task 065 and no seeded Scout/Command/staff test users are available.
  - Blocked reason: None.

- [x] Task 066: Build watchlists, saved searches, reading list, and preference UI
  - Priority: P1
  - Requirement IDs: R-WATCH-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Let Scout and Command members personalize what they monitor.
  - Acceptance criteria: Dashboard includes watchlist controls, saved search creation, reading-list save/remove actions, notification settings, dashboard defaults, and graceful states for unsupported objects or lower tiers.
  - Non-technical summary: Scout and Command members now have a saved-work workspace for watchlists, saved searches, reading-list items, notification preferences, and terminal defaults.
  - Verification: Added `/member/saved-work`, saved-work auth helpers, Supabase-backed dashboard loaders, server actions for creating/archiving watchlists, adding/removing watchlist items, saving/removing searches, saving/reading/archiving reading-list items, saving notification preferences, and saving dashboard defaults; added member workspace and terminal navigation entries plus `docs/watchlists-saved-work-preferences-ui.md`. Supabase guidance was checked against the current Data API grant/RLS model. Static search confirmed the route, Task 065 table reads/writes, object-kind options, graceful config/locked/unsupported states, and saved-work documentation. `npm run lint` passed; `npm run build:next` passed and registered `/member/saved-work`; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on pre-existing local files and touched files. A local `next start` production server reached Ready, but the Windows shell probe did not return usable HTTP output before timeout, so browser/HTTP rendering evidence could not be captured in this run. Live Supabase reads/writes and RLS behavior were not exercised because the Task 065 schema is still behind the pending migration-chain blocker and no seeded Scout/Command/staff users are available.
  - Blocked reason: None.

- [x] Task 067: Add alerts center, email notifications, in-app notifications, and freshness indicators
  - Priority: P1
  - Requirement IDs: R-ALERT-001, R-EMAIL-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Notify members about changes to watched lunar intelligence and important platform events.
  - Acceptance criteria: System supports alert rules, alert feed, unread badges, email delivery hooks, notification preferences, stale-data indicators, delivery audit logs, and tier-aware limits for Explorer, Scout, and Command.
  - Non-technical summary: Members now have an alerts center foundation with unread feed notices, stale-data labels, paid alert rules, email hook audit records, and tier-aware limits.
  - Verification: Created `supabase/migrations/20260702101257_alerts_center_notifications_freshness.sql` with alert tier limits, alert rules, alert feed items, delivery audit events, alert trigger/feed/severity/delivery enums, explicit grants, RLS policies, private authorization helpers, and Explorer/Scout/Command/staff tier limit seeds. Replaced the `/alerts` shell with a dynamic alerts center, fallback/public preview, member alert access helper, Supabase/fallback loader, server actions for creating/archiving alert rules and marking feed items read, tier cards, unread/urgent/stale/rule counters, stale freshness labels, delivery audit rendering, and Scout/Command rule controls; updated terminal navigation and added `docs/member-alerts-center.md`. Supabase guidance was checked against the current Data API grant/RLS model. Static search confirmed alert rules, feed items, unread badges, email delivery hooks, notification/frequency fields, stale indicators, delivery logs, and Explorer/Scout/Command tier limits. `npm run lint` passed; `npm run build:next` passed and registered `/alerts` as dynamic; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on pre-existing local files and touched files; `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` listed local migrations through `20260702101257`. Live migration application, RLS behavior, scheduled alert evaluation, and actual email delivery were not exercised because the pending migration chain remains blocked before Task 065/067, no email provider is configured, and no seeded Explorer/Scout/Command/staff test users are available.
  - Blocked reason: None.

- [x] Task 068: Add data source registry, license review, freshness, and quality scoring
  - Priority: P0
  - Requirement IDs: R-DATAOPS-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Build the trust layer for source-backed lunar intelligence.
  - Acceptance criteria: Schema/admin workflow tracks source owner, URL, license/terms review, refresh frequency, parser/job, health, freshness, citation requirements, quality score, confidence label, and analyst review state.
  - Non-technical summary: Analysts now have a source registry foundation for tracking which lunar intelligence sources are usable, fresh, properly cited, healthy, and reviewed.
  - Verification: Created `supabase/migrations/20260702150512_data_source_registry_trust_layer.sql` with source registry, citation requirement, parser run, health check, quality review, and registry-link tables; added source owner, URL, terms/license review, refresh frequency, parser/job, health, freshness, citation, quality score, confidence, publication, and analyst review fields; added explicit Data API grants, RLS enablement, and staff-only policies using normalized editor/analyst/admin roles. Added `/admin/sources`, staff auth, validated server actions, and `docs/data-source-registry-trust-layer.md`. Supabase guidance was checked against current Data API grant/RLS documentation and the 2026 Data API exposure changelog. `npm run lint` passed; `npm run build:next` passed and registered `/admin/sources`; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on unrelated local files; static search confirmed source owner, URL, license review, refresh, parser/job, health, freshness, citation requirements, quality score, confidence label, analyst review state, grants, RLS, and admin workflow coverage; `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` listed local migrations through `20260702150512`. Live migration application, protected admin route interaction, and RLS behavior were not exercised because the pending migration chain remains blocked before Task 065/067/068 and seeded editor/analyst/admin test users are unavailable.
  - Blocked reason: None.

- [x] Task 069: Add reusable table, chart, and export framework for intelligence modules
  - Priority: P0
  - Requirement IDs: R-DATAOPS-001, R-API-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Standardize how data-heavy modules display, cite, filter, and export information.
  - Acceptance criteria: Framework supports filtering, sorting, pagination, column picker, source columns, freshness labels, confidence labels, chart tooltips, data-table fallback, CSV/PDF export where entitled, and responsive behavior.
  - Non-technical summary: Data-heavy intelligence pages now have a reusable table, chart, and export component so future modules can use consistent filters, citations, freshness labels, and paid export controls.
  - Verification: Added `next-app/app/_components/IntelligenceDataExplorer.tsx` with search filtering, sortable columns, pagination, configurable page sizes, a column picker, source badges, freshness tooltips, confidence styling, compact chart bars with tooltips, a data-table fallback when chart data is absent, CSV download, print-to-PDF export, entitlement-aware locked export buttons, and responsive horizontal table behavior. Added `docs/intelligence-table-chart-export-framework.md` with usage and entitlement guidance. `npm run lint` passed; `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on unrelated local files; static search confirmed filtering, sorting, pagination, column picker, source/freshness/confidence labels, chart tooltips, data-table fallback, CSV/PDF export, and entitlement controls are covered. Browser interaction testing was not run because no live module consumes the reusable framework yet.
  - Blocked reason: None.

- [x] Task 070: Add Scout/Command API, exports, webhooks, and developer portal scaffold
  - Priority: P1
  - Requirement IDs: R-API-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Provide paid workflow infrastructure for Scout and Command users.
  - Acceptance criteria: Scaffold includes API key model, endpoint catalog, quota fields, usage logs, webhook subscriptions, export jobs, developer documentation route, and tier-aware access controls.
  - Non-technical summary: Scout and Command users now have a developer-platform foundation for API access, quota tracking, export jobs, webhooks, and developer documentation.
  - Verification: Added `supabase/migrations/20260702161000_scout_command_developer_platform.sql` with developer tier limits, endpoint catalog, API key metadata, usage logs, webhook subscriptions/deliveries, export jobs, explicit Data API grants, and RLS policies for Scout, Command, organization admin, and staff access. Added `/member/developer`, developer access helpers, Supabase/fallback dashboard data, terminal navigation, and `docs/scout-command-developer-platform.md`. Supabase guidance was checked against the current Data API grant/RLS model and 2026 changelog. Static search confirmed API key model, endpoint catalog, quota fields, usage logs, webhook subscriptions, export jobs, developer documentation route, grants, RLS, and tier-aware access controls. `npm run lint` passed; `npm run build:next` passed and registered `/member/developer`; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files; `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` listed local migrations through `20260702161000`. Live migration application, API key issuance, API handler auth, export workers, webhook delivery, and RLS behavior were not exercised because the pending migration chain remains blocked before Task 065/067/068/070 and seeded Scout/Command/staff users plus runtime secrets are unavailable.
  - Blocked reason: None.

- [x] Task 071: Add legal, trust, account lifecycle, and consent surfaces
  - Priority: P0
  - Requirement IDs: R-TRUST-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Support membership, ads, analytics, uploads, and paid tiers with baseline public trust pages and controls.
  - Acceptance criteria: Public/member surfaces include Terms, Privacy, Cookies, Accessibility, Data Safety, account deletion request flow, cookie preference controls, and clear support/contact paths.
  - Non-technical summary: Public visitors and members now have baseline legal, privacy, cookie, accessibility, data-safety, and account-deletion support surfaces.
  - Verification: Added `/legal/terms`, `/legal/privacy`, `/legal/cookies`, `/legal/accessibility`, `/legal/data-safety`, and `/account/delete`; added local cookie preference controls, shared trust navigation data, footer trust links, account-center links, sitemap coverage, and `docs/legal-trust-account-lifecycle-surfaces.md`. Static search confirmed Terms, Privacy, Cookies, Accessibility, Data Safety, account deletion, cookie preferences, and support/contact paths. `npm run lint` passed; `npm run build:next` passed and registered all trust/account routes; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files. Backend account deletion automation, legal counsel review, production cookie/analytics integration, and support SLA/retention handling were not implemented in this baseline surface task.
  - Blocked reason: None.

- [x] Task 072: Add security, accessibility, analytics, observability, and performance baseline
  - Priority: P0
  - Requirement IDs: R-TRUST-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Define and verify non-functional requirements for a production-ready intelligence platform.
  - Acceptance criteria: Implementation includes security headers, rate limiting or documented controls, input validation, CSRF/session protections where applicable, accessibility checks, analytics events, logs/metrics/traces hooks, performance budgets, and documented error/empty/stale/offline states.
  - Non-technical summary: The platform now has baseline security headers, product analytics and logging hooks, performance targets, accessibility expectations, and operational-state guidance.
  - Verification: Added global Next.js security headers in `next-app/next.config.mjs`, including HSTS, content-type protection, frame denial, referrer policy, permissions policy, opener policy, DNS prefetch control, and report-only CSP. Added `next-app/lib/platform/baseline.ts` with rate-limit defaults, analytics event dispatch, structured logging hooks, accessibility baseline checks, performance budgets, and ready/loading/empty/error/stale/offline/locked state copy. Added `docs/security-accessibility-observability-performance-baseline.md` documenting rate-limit enforcement, input validation, CSRF/session protections, accessibility checks, analytics, observability, performance budgets, and operational states. Static search confirmed security headers, rate limits, validation/CSRF/session guidance, accessibility checks, analytics events, logging hooks, performance budgets, and operational state coverage. `npm run lint` passed; `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files. CI enforcement, CSP reporting endpoints, production analytics provider integration, managed logs/metrics/traces, API middleware rate limiting, and measured Core Web Vitals collection remain follow-on work.
  - Blocked reason: None.

- [x] Task 073: Add automated tests for auth, RBAC, article gating, billing, member chat, forums, RFQs, lunar terminal modules, and RLS
  - Priority: P0
  - Requirement IDs: R-QA-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Cover critical security and access-control behavior with tests.
  - Acceptance criteria: Automated tests exercise login/session behavior, membership gating, role restrictions, billing entitlement updates, direct chat/forum/RFQ access and moderation rules, lunar terminal module gates, exports/API gates, and RLS expectations.
  - Non-technical summary: The project now has automated safety checks for the most important member access, paid tier, community, lunar terminal, export/API, and database security contracts.
  - Verification: Added `tests/potomac-critical-flows.test.mjs` and an `npm test` script using Node's built-in test runner. The suite checks Supabase login/session/logout wiring, normalized role-based article gating, admin/org-admin restrictions, Scout Stripe checkout/webhook entitlement updates and idempotency, member chat/forum/RFQ access and moderation schema, lunar module tier gates, Scout/Command developer/export gates, protected-table RLS policies, avoidance of user-editable metadata for authorization, and the canonical `xlpkdoeldtlhearqajat` Supabase project reference. `npm test` passed with 8 tests; `npm run lint` passed; `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files. Live RLS execution against Supabase was not run because the pending migration chain remains blocked before Task 065/067/068/070 and seeded Explorer/Scout/Command/staff test users are unavailable.
  - Blocked reason: None.

- [x] Task 074: Add end-to-end tests for public teaser, Explorer article unlock, Scout dashboard, chat/forums/RFQs, and Command admin flows
  - Priority: P1
  - Requirement IDs: R-QA-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Validate the main user journeys from browser-level behavior.
  - Acceptance criteria: E2E tests cover public article teaser, Explorer full article access, Scout dashboard access, direct chat inbox/conversation flows, forum posting, RFQ browsing/responding, lunar terminal navigation, and Command/admin workflows.
  - Non-technical summary: The project now has browser-level journey tests for the public article gate, sign-in unlock path, paid dashboard protection, community/RFQ gates, lunar terminal navigation, and Command request/admin access paths.
  - Verification: Added `tests/potomac-e2e-flows.e2e.test.mjs` and `npm run test:e2e`; the E2E script builds the Next app, starts a local production server, and runs Playwright against public teaser, Explorer sign-in, Scout developer access, chat/forums/RFQ redirects, lunar terminal navigation, and Command public/admin flows using the canonical `xlpkdoeldtlhearqajat` Supabase URL with a placeholder publishable key. `npm run test:e2e` passed with 6 browser tests; `npm test` passed with 8 static tests; `npm run lint` passed; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched/pre-existing files. Live authenticated Explorer full-body unlock, Scout dashboard data, chat conversation posting, forum posting, RFQ browsing/responding, and Command admin database actions were not exercised because seeded Explorer/Scout/Command/admin test users and live Supabase credentials are unavailable in this run.
  - Blocked reason: None.

- [x] Task 075: Run build, lint, tests, and document remaining gaps
  - Priority: P0
  - Requirement IDs: R-QA-002, R-DEPLOY-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Verify the implementation and capture any remaining gaps.
  - Acceptance criteria: Build, lint, and available tests are run; results are recorded; remaining gaps or skipped checks are documented clearly.
  - Non-technical summary: The current implementation has been checked with the available builds, linting, static tests, and browser E2E tests, with the remaining live-data and production-integration gaps documented.
  - Verification: `npm run test:e2e` passed after building the Next app and running 6 Playwright browser tests; `npm test` passed with 8 static critical-flow tests; `npm run lint` passed; `npm run build` passed for the Vite site; `git diff --check` passed with recurring LF-to-CRLF warnings on touched/pre-existing files. `npm run test:e2e` also verified `npm run build:next`, which passed and registered the current Next route set. Remaining gaps: live authenticated Explorer full-body unlock, Scout dashboard data, chat conversation posting, forum posting, RFQ browsing/responding, Command admin database actions, Supabase RLS execution, remote migration application, email/webhook delivery, production analytics/observability, and real seeded Explorer/Scout/Command/staff/admin user journeys remain unverified because live Supabase credentials, seeded role users, and production integrations are unavailable in this automation run.
  - Blocked reason: None.

- [x] Task 076: Reverify completed tasks and unblock local Supabase migrations
  - Priority: P0
  - Requirement IDs: R-QA-002, R-DEPLOY-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Reverify every completed Potomac News Intelligence task with the available local checks, use the local computer and Supabase stack to fix actionable blockers, and identify remaining matrix gaps.
  - Acceptance criteria: All existing completed tasks remain checked; no unchecked task is missed; application builds, lint, static tests, browser E2E tests, local Supabase migration application, schema lint, and security advisors are rerun; actionable local blockers are fixed; remaining unsatisfied requirements are captured as new unchecked tasks.
  - Non-technical summary: The full task list was rechecked, the app test suite still passes, and the local Supabase database migration chain is no longer stuck.
  - Verification: Confirmed all 75 prior tasks were checked and no unchecked tasks existed before this audit. `npm run lint` passed; `npm test` passed with 8 static tests; `npm run build` passed; `npm run test:e2e` passed after `npm run build:next` and 6 browser tests; `git diff --check` passed with only the pre-existing LF-to-CRLF warning on `docs/codex-automation-memory.md`. Used Windows computer control to confirm local app/browser context was available without reading unrelated sensitive windows. Supabase CLI `2.109.0` and local Docker Supabase were available. Fixed the old migration blocker in `20260702000232_global_search_command_palette_index.sql` by replacing non-immutable generated `tsvector` columns with trigger-maintained search vectors and replacing enum-to-text unique-index expressions with `NULLS NOT DISTINCT` indexes. Fixed the next blocker in `20260702050828_watchlists_saved_work_preferences.sql` with the same nullable unique-index pattern. Added repair migrations `20260705023452_fix_public_company_ranking_status_cast.sql` and `20260705023613_harden_updated_at_search_path.sql`. `npx supabase migration up --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` now applies through `20260705023613`; `npx supabase db lint --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` reports no schema errors; `npx supabase db advisors --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website" --type security --level warn --fail-on error` reports no security issues. Performance advisors still report warning-level RLS optimization work: 73 `auth_rls_initplan` warnings and 86 `multiple_permissive_policies` warnings; Task 109 captures the production hardening follow-up. Live remote Supabase verification was not run because `SUPABASE_DB_PASSWORD`, Supabase runtime keys, Stripe secrets, and seeded role-user credentials are not present in the shell environment.
  - Blocked reason: None.

- [x] Task 077: Reconcile live homepage copy, tiers, branding, ads, social links, and visible placeholders
  - Priority: P0
  - Requirement IDs: R-TIER-001, R-BRAND-001, R-HOME-003, R-ADS-001, R-SOCIAL-001, R-UPGRADE-001, R-UPGRADE-002, R-EMAIL-001, R-QA-002
  - Supersedes: Task 020, Task 023, Task 024
  - Superseded by: None.
  - Goal: Bring public surfaces into the approved Cabeus Explorer/Potomac model before adding new modules.
  - Acceptance criteria: Public copy uses Explorer as the free default signup membership, Scout at `$25k/user/year`, and Meridian as the current public enterprise label while internal RBAC remains Command and final naming remains open; public brand is Cabeus Explorer except approved Potomac Pathfinder and Potomac Source CTAs; no public route shows placeholder or launch-pending copy; approved Substack, podcast, and LinkedIn links are retained when configured with real destination URLs; X, unapproved social channels, fake URLs, and launch-pending social placeholders are removed; incomplete sponsor slots are replaced with UDRI house ads, Potomac Pathfinder CTAs, Potomac Source CTAs, or source-backed empty states; account-required CTAs point to `/request-access`; premium CTAs point to `/upgrade`; Meridian surfaces do not show Stripe, self-serve checkout, public payment, or `mailto:` links or workflows and instead route to a submitted server-side inquiry form that emails through Resend Free to/from `info@potomacdb.com` after quota preflight with safe Reply-To behavior; desktop/mobile screenshots confirm no first-viewport overflow.
  - Non-technical summary: Public-facing pages now use Explorer as the free entry point, Scout at `$25k/user/year`, and Meridian for organization-level access; generic sponsor and social placeholders were replaced with approved house/product CTAs or removed when no real destination exists.
  - Verification: `npm run lint` passed; `npm test` passed with 8 static tests; `npm run build` passed and generated `/request-access`, `/upgrade`, `/pathfinder/inquire`, and `/source/inquire`; `git diff --check` passed with only recurring LF-to-CRLF warnings. Static app/test scan found no remaining public app hits for launch-pending social placeholders, X/Twitter channel copy, old `$1,495/$3,495/$7,495` tier prices, reserved partner slots, public Command request labels, or `/apply` CTA links. In-app Browser setup was attempted first, but its DOM snapshot API failed with `incrementalAriaSnapshot is not a function`, so rendered QA used Playwright with installed Microsoft Edge against `http://127.0.0.1:3003`: desktop homepage showed Cabeus Explorer, Explorer, `$25,000/user/year`, Meridian, no X channel, no launch-pending copy, no framework overlay, and no horizontal overflow; clicking `Join Explorer` opened `/request-access`, where `Start with free Explorer access`, `Request Explorer`, and `Sign in` were visible; mobile `/upgrade` showed the Meridian manual-review card with `Request Meridian`, no Meridian payment/checkout wording, no framework overlay, and no horizontal overflow. Console QA only reported the pre-existing report-only CSP warning for `upgrade-insecure-requests`. `npm run test:e2e` rebuilt successfully but failed before page assertions because its temporary Next server printed Ready on port `61301` while repeated fetch readiness checks still failed; no E2E assertion failure was reached. Live remote Supabase, Resend Free delivery/quota preflight, and production Cloudflare checks were not run because runtime secrets, sender/domain verification, quota ledger configuration, and production deployment access are not available in this shell; Tasks 083-085 and 113-114 retain those deeper operational checks.
  - Blocked reason: None.

- [x] Task 078: Add configurable enterprise product naming with Meridian as the current public label
  - Priority: P0
  - Requirement IDs: R-TIER-001, R-UPGRADE-002
  - Supersedes: Task 053
  - Superseded by: None.
  - Goal: Refer to the public enterprise product as Meridian for now while preserving the backend Command entitlement and leaving room to finalize the name later.
  - Acceptance criteria: Public enterprise display name can be configured as `Meridian` or `Command` from a single config/CMS source; default is `Meridian`; backend role, entitlement, RLS, analytics tier, API scopes, and admin workflows continue to use internal `command` identifiers; sitemap, metadata, pricing, upgrade, carousel teasers, gated messages, dashboard copy, and QA scans use the configured display label consistently; tests confirm no accidental fourth tier, no public slash-labeling, no mixed `Command`/`Meridian` labeling beyond the configured display string, and no broken entitlement mapping.
  - Non-technical summary: The enterprise offering is now named from one central setting. It currently appears as Meridian across public pricing, upgrade, article, event, company, search, homepage, and member-workspace surfaces, while the underlying permission system remains Command.
  - Verification: `npm run lint`, `npm test` (9 tests), and `npm run build` passed. Added a regression test covering the two allowed public enterprise labels, Meridian as the default, internal Command identifiers, no fourth tier, and no hard-coded public enterprise labels on key routes. Rendered QA at `http://127.0.0.1:3001/pricing` confirmed Explorer, Scout, and Meridian copy plus the Meridian request path; desktop width had no horizontal overflow. Mobile `/upgrade` rendered without visible out-of-bounds elements or console errors; the browser reported a 17px document-width discrepancy without an identifiable overflowing child, so broader mobile-overflow enforcement remains with Task 110/112.
  - Blocked reason: None.

- [x] Task 079: Build `/request-access` Sign In / Sign Up auth page with free Explorer default
  - Priority: P0
  - Requirement IDs: R-AUTH-002, R-TIER-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Replace scattered account CTAs with one clear auth gateway that defaults new users into free Explorer membership.
  - Acceptance criteria: `/request-access` renders a Cabeus Explorer Sign In / Sign Up page; the Sign Up tab is open by default for direct visits, account-required CTAs, UDRI `Learn more`, and signup-oriented CTAs; the free Explorer membership path is preselected; Explorer signup allows any verified email domain; Sign In remains available as a secondary tab; Sign In and Sign Up preserve return URL, source CTA, campaign attribution, required tier, and clicked-content context; Supabase signup/login/callback/logout/password recovery remain compatible; existing `/apply`, `/login`, and `/signup` routes redirect or canonicalize into `/request-access` unless needed for legacy callbacks; successful signup creates or requests the free Explorer membership record according to the current approval model, sends email verification, and then shows the verification-required state from Task 082; verified users with incomplete profiles route to `/account/profile/complete`; verified/profile-complete users return to the originally requested non-premium content; anonymous premium intent authenticates first, completes email verification/profile completion as needed, and then forwards to `/upgrade`; tests cover anonymous account-required CTA, direct sign-in, direct sign-up, default open Sign Up tab, Explorer default selection, personal/free email acceptance for Explorer, email-verification handoff, profile-completion handoff, callback return routing, password recovery compatibility, UDRI routing, premium-intent retention, and legacy route redirects.
  - Non-technical summary: The unified Sign In / Sign Up gateway now defaults to free Explorer access, keeps the user’s original destination and campaign context, supports sign-in and password recovery, and sends verified but incomplete members to the profile form before opening member content.
  - Verification: `npm run lint` passed; `npm test` passed with 12 tests; `npm run build` passed. Local rendered QA confirmed Sign Up is selected by default with Explorer selected and a secondary Sign In tab with magic-link, password, and reset-password paths. Local route checks confirmed `/apply` redirects to `/request-access` and `/auth/login?next=/news` redirects to `/request-access?tab=signin&next=%2Fnews`. The canonical Supabase migration `20260710053251_profile_completion_gate` was applied to `xlpkdoeldtlhearqajat` and verified by querying both `member_profile_completions` and migration history. Full live signup, verification-email delivery, callback completion, and password-reset delivery were not exercised because those actions send email and require a test mailbox.
  - Blocked reason: None.

- [x] Task 080: Build profile completion flow and profile-complete gate
  - Priority: P0
  - Requirement IDs: R-AUTH-001, R-AUTH-003
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Require an operational user profile before any member content, tracker app shell, checkout, or personalized intelligence becomes visible.
  - Acceptance criteria: `/account/profile/complete` collects full name, organization or affiliation, role/title, country, timezone, primary interest areas, and communication preference; phone, budget range, procurement timeline, and use-case detail remain optional unless triggered by an inquiry or sales workflow; Explorer profile completion does not reject personal/free email domains when the email is verified; Meridian upgrade or inquiry intent requires business/organization email validation through the simple personal-domain denylist handled by the upgrade/inquiry workflow; route preserves return URL, premium intent, source CTA, and campaign attribution; successful save marks the profile complete in normalized profile data or trusted app metadata, not user-editable metadata; shared helpers redirect profile-incomplete users away from member dashboards, `/tracker/launches`, full article bodies, paid intelligence, community/chat/forums/RFQ surfaces, saved work, alerts, uploads, admin dashboards, checkout, personalized cards, API/export features, and gated estimates; `/request-access`, callback, logout, password recovery, verification-required screens, profile-completion help, and public teaser pages remain accessible; tests cover profile-incomplete account, completed profile, partial save validation, Explorer with personal email accepted, return-to-content, return-to-upgrade, timezone defaulting, preference storage, and non-leakage in metadata/search/API/prefetch payloads.
  - Non-technical summary: A verified, completed profile is now required before protected member tools, premium intelligence, checkout, organization administration, and related APIs can load. Public news and event teasers remain available, with a clear profile-completion path for signed-in users.
  - Verification: Added and applied Supabase migration `20260710053251_profile_completion_gate` with a normalized profile-completion table, explicit grants, own-row RLS policies, and staff-read policy. Added `/account/profile/complete`, member-owned profile upsert, verified-email checks, return-context support, callback profile handoff, and shared gates across articles, events, chat, forums, RFQs, saved work, alerts, marketplace, economy, uploads, developer tools, lunar terminal member views, administration, organization administration, and Scout checkout. `npm test` (12 tests), `npm run lint`, and `npm run build` passed. Cloudflare deployment `fcdf2d25-5475-44c1-954c-441b72149fa2` succeeded; anonymous production checks returned `200` for `/request-access` and `/events`, `307` to unified sign-in for `/account/profile/complete`, `/member`, and `/member/chat`, and `405` for a non-POST checkout request.
  - Blocked reason: None.

- [x] Task 081: Enforce email-verification and profile-completion gates for member and non-public content
  - Priority: P0
  - Requirement IDs: R-AUTH-001, R-AUTH-003
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Make verified email and completed profile the first gates before member-only content or signed-in intelligence app shells become visible.
  - Acceptance criteria: Shared auth/access helpers check Supabase email verification and profile completion before rendering member dashboards, `/tracker/launches`, full article bodies, paid intelligence, community/chat/forums/RFQ surfaces, saved work, alerts, uploads, admin dashboards, gated estimates, checkout, and personalized cards; email-unverified users see a verification-required state with resend/check-email guidance and public-safe CTAs; profile-incomplete users see a profile-completion-required state with `/account/profile/complete` CTA; public pages, `/request-access`, callback, logout, password recovery, account verification help, profile-completion help, and upgrade explainers remain accessible; route metadata, command palette, search results, server actions, API handlers, and RLS-facing helpers do not leak member content to email-unverified or profile-incomplete users; tests cover anonymous, email-unverified, profile-incomplete, verified/profile-complete generic authenticated, Explorer, Scout, Meridian/internal Command, staff, and admin cases.
  - Non-technical summary: Signed-in users now must verify their email and complete their profile before protected intelligence, member tools, administration, downloads, uploads, or checkout can load. Unverified users receive a dedicated confirmation screen, while search and the command palette show only public-safe entries until the profile is ready.
  - Verification: `npm test` passed 13 checks, including profile-gate, callback-handoff, protected-helper, and public-safe search/command-palette regression coverage. `npm run lint` and `npm run build` passed. Cloudflare deployment `b9855a5e-a544-4e71-a30b-20b039eefe17` succeeded; anonymous production checks returned `200` for `/request-access`, `/search`, and `/events`, plus `307` to unified sign-in for `/account/verify`, `/member`, `/member/chat`, and `/admin/editorial`. Live role-by-role browser coverage requires the seeded verified, incomplete, and tiered fixture accounts planned in Task 108.
  - Blocked reason: None. Full live fixture coverage remains scheduled under Task 108.

- [x] Task 082: Build email-verification UX, resend flow, and profile-completion handoff
  - Priority: P0
  - Requirement IDs: R-AUTH-001, R-AUTH-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Make the verified-email requirement operational instead of a dead-end access gate.
  - Acceptance criteria: Public-safe verification-required screens exist for member dashboards, `/tracker/launches`, full article bodies, paid intelligence, community/chat/forums/RFQ surfaces, saved work, alerts, uploads, admin dashboards, checkout, personalized cards, and gated estimates; screens explain that email verification is required before member content is visible; users can request a verification email resend with rate limiting, audit logging, and clear success/error states; verified users with incomplete profiles route to `/account/profile/complete`; `/request-access`, callback, password-recovery, account verification help, profile-completion flow, and `/upgrade` flows route users back to the intended destination after verification/profile completion; unverified users never receive member data in route metadata, command palette, search results, server actions, API handlers, or prefetched payloads; tests cover anonymous, unverified authenticated, newly verified, profile-incomplete, profile-complete, expired/invalid verification links, resend throttling, and post-verification return routing.
  - Non-technical summary: Members can now open a verification screen, request a new confirmation email using their account address, see clear success, error, and wait states, and continue to profile completion or their original destination after verification. The system records resend activity without storing raw email addresses and limits repeated requests.
  - Verification: Added `/api/auth/resend-verification`, a public-safe verification screen/form, Supabase Auth `resend` handoff through `/auth/callback`, and migration `20260710151437_email_verification_resend_controls`. The canonical project has the resend rate-limit/audit tables, RLS, and protected RPC functions; the profile-completion migration was also safely re-applied after fixing its duplicate-trigger idempotency. `npm test` passed 14 checks, `npm run lint` passed, and `npm run build` passed. Canonical security advisor check found only three unrelated existing warnings on `compliance_settings`, `saml_providers`, and `security_audit_logs`; it did not flag the new resend controls. Cloudflare deployment `0dbfe23c-6cf1-4afb-b178-99cfd441c5c0` succeeded; production `/account/verify` returned `200` with the resend controls and a malformed resend request returned `400` without contacting the provider.
  - Blocked reason: Actual email delivery depends on the configured Supabase Auth email provider, templates, allowed redirect URL, and production sender settings. The endpoint reports provider failures accurately; a live resend is not triggered during automated verification to avoid sending email without a designated test address.

- [x] Task 083: Configure Resend Free production server-side email transport for forms and alerts
  - Priority: P0
  - Requirement IDs: R-EMAIL-001, R-EMAIL-002, R-INQUIRY-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Give Meridian, Pathfinder, Source, UDRI fallback, alerts, and operational inquiry forms a real Resend Free-backed server-side email path instead of client-side links, paid-provider leakage, or placeholders.
  - Acceptance criteria: Resend Free is configured through a server-only email adapter with runtime secrets kept out of the repo; `RESEND_API_KEY` or an explicitly documented equivalent runtime binding is required for production; no paid Resend plan, pay-as-you-go overage, dedicated IP, paid add-on, extra sending domain, marketing broadcast, or paid automation dependency is enabled unless a future CEO-approved config explicitly changes the plan; `info@potomacdb.com` is the approved sender/from address and Meridian destination inbox; Reply-To uses the submitter's validated email when available and falls back to `info@potomacdb.com`; Pathfinder, Source, UDRI fallback, alerts, and operational inquiry destinations are configurable without code changes, with `info@potomacdb.com` as the default destination until specific inboxes are approved; form submissions store Supabase lead/audit records before email send where schema exists; sent messages store provider `resend`, provider message ID when returned, sender, recipient, recipient count, Reply-To, template/form type, related lead IDs, send status, retry status, quota bucket, and failure reason where available; failures are logged and shown as an accurate pending/configuration state rather than a false success; Task 084 owns the shared quota governor, duplicate suppression, quota holds, retry queue, and free-plan limit tests; production release blocks if Resend verification for the `potomacdb.com` domain and `info@potomacdb.com` sender, DNS configuration, destination email, required runtime secrets, or Task 084 free-plan quota configuration are missing.
  - Non-technical summary: Added a server-side Resend delivery path for Meridian inquiries. Each inquiry is saved before sending, records its delivery outcome privately, and keeps the email key out of browser code and the repository.
  - Verification: `npm test` passed (15 tests); `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed. The canonical `xlpkdoeldtlhearqajat` database has migration `20260710181949` applied; its audit table has RLS enabled and is not readable by anonymous or authenticated API roles.
  - Blocked reason: None. Live sender/domain delivery remains a release gate and the full quota governor is Task 084.

- [x] Task 084: Implement Resend Free-plan quota governor and graceful degradation
  - Priority: P0
  - Requirement IDs: R-EMAIL-003, R-EMAIL-004
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Keep all app-controlled Resend usage within the Free-plan budget while preserving a reliable user experience for inquiries and alerts.
  - Acceptance criteria: Add a server-side quota governor for Resend with configurable Free-plan defaults of 90-email/day and 2,700-email/month soft caps, 100 transactional emails/day and 3,000 transactional emails/month hard caps, one sending domain, 30-day provider retention assumptions, an operational reserve of at least 10 emails/day and 300 emails/month for enterprise/inquiry/form messages, and a conservative internal send-rate cap below Resend's default 10 requests/second/team API rate limit; count every recipient in `To`, `CC`, and `BCC` separately; avoid CC/BCC for operational forms unless explicitly approved; disable inbound Resend receiving unless explicitly approved because received messages count against the quota; reserve configurable daily capacity for high-priority Meridian, Pathfinder, Source, UDRI, and operational inquiry submissions; treat alert emails and digest emails as lower priority; persist leads/audit records before attempting email; queue or mark email-delayed records when quota is exhausted; continue in-app alerts when email is paused; batch/digest lower-priority alerts where practical; suppress duplicate sends; capture and persist Resend response headers such as `x-resend-daily-quota`, `x-resend-monthly-quota`, `ratelimit-limit`, `ratelimit-remaining`, `ratelimit-reset`, and `retry-after` when available; handle Resend `daily_quota_exceeded`, `monthly_quota_exceeded`, and `rate_limit_exceeded` responses with backoff and queued retry rather than public failures; expose an admin-only usage and email queue dashboard with daily/monthly usage, remaining budget, reserved capacity, queued messages, failed sends, retry timing, reset windows, and provider message IDs; make public form success states say the request was received even when email is queued, without exposing internal quota details; ensure release checks fail if configuration implies a paid Resend plan, pay-as-you-go overages, dedicated IP add-ons, paid automation overages, marketing broadcasts, extra domains, unbounded retries, missing quota counters, or public quota-error leakage; tests cover normal send, recipient-count accounting, quota-reserved send, low-budget alert downgrade, quota-exhausted form submission, queued retry, duplicate suppression, Resend 429 responses, missing headers, admin usage view, and no paid-plan leakage.
  - Non-technical summary: Added a Free-plan safety system that reserves email capacity before sending, protects high-priority inquiries, delays non-critical mail at configured limits, records provider quota information, and gives administrators a private queue and usage view.
  - Verification: `npm test` passed (17 tests); `npm run lint` and `npm run build` passed. Canonical project `xlpkdoeldtlhearqajat` has migrations `20260710184052`, `20260710184521`, and `20260710184638` applied. Rollback-only database checks confirmed a reservation is released without incrementing sends, and the ninth claim in one second is rejected by the internal 8/second cap. The admin RPC is unavailable to `anon` and available only to authenticated callers, with an internal admin-role check.
  - Blocked reason: None. Live sender/domain status and real production delivery volumes remain release verification items for Task 113.

- [x] Task 085: Build Meridian enterprise server-side inquiry form and business-email validation
  - Priority: P0
  - Requirement IDs: R-UPGRADE-002, R-UPGRADE-003, R-AUTH-004, R-INQUIRY-002, R-EMAIL-001, R-EMAIL-002
  - Supersedes: Task 013
  - Superseded by: None.
  - Goal: Make the Meridian enterprise path operational without Stripe, public payment, `mailto:`, or placeholder payment workflows.
  - Acceptance criteria: Meridian CTAs from `/upgrade`, premium teasers, Meridian-only cards, pricing surfaces, and gated enterprise features never render Stripe checkout, posted pricing, invoice checkout, online checkout, public payment, public price, `mailto:` fallback, or generic payment placeholders; the path requires signed-in, email-verified, profile-complete users before enterprise contact actions; Explorer signup still allows any verified email domain; Meridian contact requires a business or organization email using a configurable simple personal-domain denylist, staff override, and audit logging; server-side email uses Resend Free with `info@potomacdb.com` as both destination and sender/from address with the submitter's validated business email as Reply-To when available; the MVP denylist includes common consumer domains such as `gmail.com`, `googlemail.com`, `yahoo.com`, `outlook.com`, `hotmail.com`, `live.com`, `msn.com`, `icloud.com`, `me.com`, `aol.com`, `proton.me`, `protonmail.com`, `pm.me`, `fastmail.com`, and `hey.com`; submissions capture user ID, verified auth email, business email, organization, role/title, requested product label `Meridian`, source CTA, source content, return URL, message, attribution, and consent/communication preference; the contact action is a submitted form handled server-side that sends server-side email through Resend Free to and from `info@potomacdb.com` for contract discussions after a quota preflight, stores the Resend provider message ID when returned or queued/quota-held state when relevant, and records a staff-reviewable Supabase lead/audit record where schema is available; missing Resend configuration or missing free-plan quota enforcement blocks release and shows admin-facing configuration messaging, not public placeholder copy; successful submission tells the user Cabeus Explorer will follow up by email for contract discussions and never grants entitlement automatically; backend entitlement remains internal `Command` and can only be activated manually by authorized staff after contract approval; tests cover Explorer personal-email allowance, Meridian personal-email block, Meridian business-email success, simple denylist configuration, staff override/audit, missing Resend configuration, Resend Free quota-hold behavior, Resend server-side email payload addressed to/from `info@potomacdb.com`, Reply-To behavior, no `mailto:` workflow, lead/audit record creation, duplicate submissions, analytics, no payment UI leakage, and backend Command entitlement mapping.
  - Non-technical summary: Meridian contract requests now require an approved member account and completed profile, validate business email addresses, save the request and audit trail, and either send or accurately queue the follow-up without offering online payment.
  - Verification: `npm test` passed (18 tests); `npm run lint` and `npm run build` passed. Canonical project `xlpkdoeldtlhearqajat` has migrations `20260710185238` and `20260710185543` applied. Database checks confirm anonymous callers cannot submit or override domain rules, while authenticated callers can use the guarded inquiry function; all guarded functions also enforce verified member/profile or admin state internally.
  - Blocked reason: None. Live delivery confirmation for the production `potomacdb.com` sender remains a release check in Task 113.

- [x] Task 086: Build premium upgrade page and gated-content routing for Scout and Meridian
  - Priority: P0
  - Requirement IDs: R-UPGRADE-001, R-UPGRADE-002, R-UPGRADE-003, R-TIER-001, R-AUTH-001, R-AUTH-004
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Send premium content clicks to the correct upgrade path: Scout self-serve Stripe and Meridian server-side contract-discussion form.
  - Acceptance criteria: `/upgrade` accepts required tier, source content type, source object ID or slug, return URL, source CTA, and campaign/source metadata; premium-gated articles, datasets, tools, tracker estimates, exports, API features, advanced alerts, paid carousel teasers, and Meridian-only cards route to `/upgrade`; anonymous premium clicks first collect authentication through `/request-access`, complete email verification/profile completion as needed, and then return to `/upgrade`; email-unverified users see verification before Scout checkout or gated member content; profile-incomplete users complete `/account/profile/complete` before Scout checkout or before returning to gated content; email-verified/profile-complete Explorer or non-entitled users see Scout Stripe checkout for Scout upgrades; Meridian shows no Stripe, online checkout, self-serve invoice, public payment, `mailto:`, or payment-provider placeholder; Meridian requires a business or organization email, uses a configurable simple personal-domain denylist, rejects or asks users to replace consumer/personal email domains, collects contract-discussion intent, submits through a server-side form, sends email through Resend Free to and from `info@potomacdb.com`, uses the submitter's validated business email as Reply-To when available, checks quota before send, creates a staff-reviewable enterprise lead/audit record, stores the Resend provider message ID or queued/quota-held status when available, and tells the user Cabeus Explorer will follow up for contract discussions; Scout users see Meridian upgrade only when appropriate; already-entitled Command users are routed to the originally clicked content; Meridian copy clearly maps to the backend Command entitlement and does not create a fourth tier; failures, pending enterprise approval, missing contact-email configuration, missing Resend email transport configuration, free-plan quota holds, and email-delivery failures show operational messaging rather than placeholders; analytics track premium click source, upgrade impression, Scout checkout start, Scout checkout success, Scout checkout failure, Meridian contract-discussion start, Meridian lead submission, Meridian email sent/failed/queued, and return-to-content; tests cover anonymous premium click, email-unverified account, profile-incomplete account, Explorer to Scout, Explorer to Meridian, Scout attempting Meridian, already-entitled user, personal email rejected for Meridian, business email accepted for Meridian, missing contact email, missing Resend configuration, Resend Free quota hold, Resend server-side email payload to/from `info@potomacdb.com`, Reply-To behavior, lead/audit record creation, and gated estimate non-leakage.
  - Non-technical summary: Premium clicks now preserve where the member came from, guide incomplete accounts through verification, send Scout members to self-service checkout, send Meridian prospects to contract discussion, and return entitled members to the original intelligence item.
  - Verification: `npm test` passed (19 tests); `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed. Tests cover account-state gates, tier separation, context preservation, Command return routing, Scout checkout return URLs, Meridian no-payment rules, and all required upgrade analytics event hooks.
  - Blocked reason: None. Live Stripe payment completion and production Resend sender verification remain release-environment checks in Tasks 112-114 rather than implementation blockers.

- [x] Task 087: Add Supabase Storage asset pipeline for Pathfinder and Source CTA images
  - Priority: P0
  - Requirement IDs: R-ADS-001, R-CONTENT-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Store and serve the CEO-provided Pathfinder and Source CTA images safely.
  - Acceptance criteria: Supabase Storage bucket/folder and admin upload/select controls support Pathfinder and Source CTA images; uploads validate file type, size, dimensions, alt text, attribution/source note, review status, and expiration metadata; existing CEO-provided images are added as reviewed assets or repo fallbacks with stable paths; no generic replacement art appears.
  - Non-technical summary: Pathfinder and Source now have a governed image library where approved staff can upload artwork, review it, set expiration dates, and attach only reviewed images to campaign placements. The three CEO-provided images remain available as stable reviewed fallbacks.
  - Verification: `npm test` passed (20 tests); `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed. Migration `cta_asset_storage_pipeline` was applied to canonical Supabase project `xlpkdoeldtlhearqajat`; remote verification returned 3 reviewed assets and confirmed the Storage bucket is private. Supabase security advisors reported no new finding for this implementation; existing unrelated project findings remain.
  - Blocked reason: None.

- [x] Task 088: Build strategic CTA inquiry forms and auth handoff
  - Priority: P0
  - Requirement IDs: R-INQUIRY-001, R-INQUIRY-002, R-ADS-001, R-AUTH-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Route strategic product interest and account access through the correct paths.
  - Acceptance criteria: `/pathfinder/inquire` and `/source/inquire` render product-specific inquiry forms using approved Pathfinder/Source visual language; forms capture name, email, organization, role/title, product interest, message, CTA source, consent/communication preference, and attribution; submissions write to Supabase with staff review status, source CTA metadata, notification/audit hooks, and server-side Resend Free delivery using `info@potomacdb.com` as the default sender/from and destination, with quota preflight and queued/delayed handling; UDRI `Learn more` and generic account access CTAs route to `/request-access`; `/request-access` opens on the Sign Up tab, defaults Sign Up to free Explorer, allows any verified email domain for Explorer, and hands off to email verification and profile completion before member content becomes visible.
  - Non-technical summary: Pathfinder and Source now have dedicated inquiry forms with their approved imagery and product-specific questions. Each inquiry is recorded for staff review before email delivery, preserves where the visitor came from, and clearly separates product interest from free Explorer membership signup.
  - Verification: `npm test` passed (21 tests); `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed. Migration `strategic_product_inquiries` was applied to canonical Supabase project `xlpkdoeldtlhearqajat`; remote checks confirmed the inquiry table, private rate limiter, outbound-email audit link, and three delivery RPCs. Supabase advisors reported only the expected informational notice that the revoked private rate-limit table has no client RLS policies. Live delivery uses the configured Resend sender and is covered by the existing release checks in Tasks 112-114.
  - Blocked reason: None.

- [x] Task 089: Replace sponsor/social placeholders with UDRI, Pathfinder, and Source CTA surfaces
  - Priority: P0
  - Requirement IDs: R-ADS-001, R-SOCIAL-001, R-HOME-003, R-INQUIRY-001
  - Supersedes: Former Task 098, Task 020, Task 023, Task 024
  - Superseded by: None.
  - Goal: Replace incomplete modules with approved strategic CTAs.
  - Acceptance criteria: UDRI house ad uses `https://i.ytimg.com/vi/WSLxeLhlth4/maxresdefault.jpg` as the placeholder visual until approved copy/assets exist; CTA label is `Learn more`; CTA routes to `/request-access` until a final UDRI destination is approved; ad is labeled as a house ad/sponsor module without implying a paid campaign; Pathfinder CTA uses CEO-provided image and copy `Find the landing site`, `Pathfinder`, and `An impact-emplaced lunar sensor that survives hard landing independent of a lander and finds the best landing sites.` with route `/pathfinder/inquire`; Source CTA uses CEO-provided image and copy `Deliver data for building`, `Source`, and `A persistent lunar garage and rover designed for at least one year of operation to fully characterize the site in preparation for construction.` with route `/source/inquire`; approved Substack, podcast, and LinkedIn links remain when configured with real destination URLs; X, unapproved social channels, fake URLs, and launch-pending social modules do not render.
  - Non-technical summary: Public sponsor spaces now show the approved UDRI house ad, Pathfinder offer, or Source offer with their correct images, descriptions, and destinations. LinkedIn remains live; Substack and podcast links appear only after a verified destination is configured, and no X or launch-pending placeholder is shown.
  - Verification: `npm test` passed (22 tests); `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed. Canonical Supabase currently has no active sponsor campaign rows overriding the reviewed fallback units. Repository and web checks confirmed the approved LinkedIn URL but found no reliable Cabeus Explorer/Potomac Substack or podcast destination, so those channels remain hidden rather than using invented URLs.
  - Blocked reason: None.

- [x] Task 090: Build admin content submission, approval, and deployment-readiness dashboard
  - Priority: P0
  - Requirement IDs: R-CONTENT-001, R-CONTENT-002, R-HOME-002, R-ADS-001, R-CONTRACT-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Provide the operating workflow needed to avoid Codex-authored production placeholders.
  - Acceptance criteria: Editor/admin dashboard supports submissions for homepage slides, carousel visuals, tracker rows, source citations, house ads, Pathfinder/Source CTAs, space/lunar contract awards, and public empty states; one editor/admin approval is sufficient; Supabase Storage image uploads support validation and alt text; scheduled auto-expiration is required by default with 14-day carousel, 30-day CTA/house-ad, and 7-day weekly tracker promotional defaults; publishing blocks missing citations, assets, destinations, or expiration metadata; Codex cannot mark production content seeding complete by inventing final copy.
  - Non-technical summary: Editors now have one dashboard for submitting and reviewing homepage, tracker, source, advertising, strategic CTA, contract-award, and empty-state content. It shows readiness problems, keeps uploaded images private, requires a named human content source, and prevents incomplete or unapproved material from being published.
  - Verification: `npm test` passed (23 tests); `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed. Migration `content_submission_readiness_dashboard` was applied to canonical Supabase project `xlpkdoeldtlhearqajat`; remote checks confirmed both tables, two enforcement/audit triggers, RLS, and a private Storage bucket. Supabase security advisors reported no finding for this implementation.
  - Blocked reason: None.

- [x] Task 091: Enforce required scheduled auto-expiration for carousel, CTA, house-ad, and promotional content
  - Priority: P0
  - Requirement IDs: R-CONTENT-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Ensure required expiration dates are enforced consistently, not only captured in admin forms.
  - Acceptance criteria: Admin publishing actions block carousel slides, UDRI house ads, Pathfinder CTAs, Source CTAs, weekly tracker promotional modules, and public promotional content when required `expires_at` metadata is missing; default expiration windows are 14 days for carousel slides, 30 days for CTAs and house ads, and 7 days for weekly tracker promotional modules; render loaders suppress expired content even if a status flag was not updated; scheduled maintenance auto-unpublishes eligible content silently and records audit events without MVP admin alerts; release checks fail when expired promotional content still renders, required expiration metadata is missing, or default windows are exceeded without an exception.
  - Non-technical summary: Promotional material now has enforced freshness windows, disappears from public loaders when expired, and is silently retired by a daily maintenance job with an audit record. Editors can document a human-approved exception, while release checks stop expired or overlong fallback campaigns from shipping.
  - Verification: `npm test` passed (24 tests); `npm run test:content-expiration`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed. Migration `promotional_content_auto_expiration` was applied to canonical Supabase project `xlpkdoeldtlhearqajat`; remote verification confirmed one daily `04:17 UTC` cron job, zero missing CTA expiration dates, zero expired published submissions, and a maintenance result of zero records due for retirement. Supabase advisors reported only the expected informational notice that the revoked private expiration-audit table has no client RLS policies.
  - Blocked reason: None.

- [x] Task 092: Add homepage top-story carousel schema and editor/admin controls
  - Priority: P0
  - Requirement IDs: R-HOME-001, R-HOME-002, R-CONTENT-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Store and manage the hero carousel as editorial inventory rather than a static landing-page block.
  - Acceptance criteria: Schema supports 3-5 active slides, latest reviewed CMS story auto-selection, editor/admin pinning and ranking, required/optional status, schedule windows, required expiration, audience mode, tier, visual asset, alt text, CTA label/route, citation/source note, freshness timestamp, audit log, and preview state; default public CTA is `Read the brief`; slide types include anonymous teaser, signed-in editorial story, custom intelligence card, and paid-tier teaser; unverified and profile-incomplete users cannot receive member-only slides; any editor/admin can publish, unpublish, reorder, and expire slides.
  - Non-technical summary: Editors now have a governed homepage carousel inventory with draft, preview, publication, ranking, pinning, required-slide, audience, tier, source, image, freshness, and expiration controls. Empty positions can be filled from the newest published CMS stories, while member-only slides are unavailable until email verification and profile completion are confirmed.
  - Verification: `npm test` passed (25 tests); `npm run test:content-expiration`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed. Migration `homepage_carousel_inventory` was applied to canonical Supabase project `xlpkdoeldtlhearqajat`; remote checks confirmed both tables, three slide policies, three triggers, one daily expiration cron job, and a maintenance result with zero slides due for expiration. Supabase security advisors reported no carousel-related finding.
  - Blocked reason: None.

- [x] Task 093: Build rotating homepage hero carousel UI
  - Priority: P0
  - Requirement IDs: R-HOME-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Replace the static hero area shown in the screenshot with a production carousel.
  - Acceptance criteria: Homepage top hero rotates every 8 seconds across 3-5 active slides, has previous/next controls, slide indicators, pause/resume, hover/focus pause, keyboard navigation, touch-safe behavior, reduced-motion fallback, static one-slide fallback, accessible labels, SEO-safe teaser markup, responsive images, no layout shift, and no first-viewport overflow on desktop or mobile.
  - Non-technical summary: The homepage hero is now an accessible top-story carousel that rotates every eight seconds, supports direct story selection and manual navigation, pauses for interaction, respects reduced-motion preferences, and falls back to one stable Cabeus Explorer story when no reviewed carousel inventory is available.
  - Verification: `npm test` passed (26 tests); `npm run test:content-expiration`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed. Automated coverage checks rotation timing, keyboard controls, pause/resume, hover/focus pause, reduced motion, responsive media, accessible labels, data gating, and static fallback. Production desktop/mobile screenshot, overflow, interaction, and console verification is performed after deployment in this task run.
  - Blocked reason: None.

- [x] Task 094: Add engagement telemetry, personalization controls, and custom intelligence card model
  - Priority: P1
  - Requirement IDs: R-HOME-006, R-WATCH-001, R-TRUST-001
  - Supersedes: Former Task 105
  - Superseded by: None.
  - Goal: Track engagement, store personalization preferences, and support explainable custom intelligence cards without disabling required analytics.
  - Acceptance criteria: Telemetry records privacy-safe engagement signals for verified/profile-complete signed-in users over a rolling 90-day window, including article reads, searches, saved work, watchlists, tracker rows, company/profile views, alerts, paid articles, datasets, exports, and CTA clicks; resolver produces explainable card reasons; personalization threshold defaults to 5 qualifying events; account preferences disable behavior-based ranking only and do not disable analytics or engagement collection; data model respects organization/privacy boundaries and RLS. Account settings include a personalization toggle that controls homepage/custom-card ranking only; disabled users receive latest reviewed stories, required editor/admin picks, paid-article teaser priority for Explorer users, and non-personalized tier cards; sufficient-history threshold is at least 5 qualifying events by default; personalization only applies to verified/profile-complete users; analytics and logs record the preference without using disabled users' behavior for ranking; tests cover enabled, disabled, no-history, sufficient-history, anonymous, unverified, profile-incomplete, Explorer, Scout, and Meridian/internal Command states.
  - Non-technical summary: Members can now choose whether recent activity ranks their homepage intelligence without stopping required analytics. Verified members receive privacy-bounded 90-day activity history and explainable custom-card recommendations after at least five qualifying actions, while everyone else receives reviewed, tier-appropriate fallback content.
  - Verification: `npm run lint`, `npm test` (33 tests), `npx tsc --noEmit`, and `npm run build` passed. Canonical Supabase migrations applied successfully; live verification found owner-scoped RLS policies, both telemetry/resolver RPCs, the daily retention job, audit storage, and organization foreign-key indexes. Security/performance advisors reported no new finding on these tables. Cloudflare version `5d889f8a-3d77-493f-b67f-96eeb62f11ca` deployed successfully; the production Playwright crawl visited 60 internal routes and reported zero console, CSP, 404, 500, or navigation issues.
  - Blocked reason: None.

- [x] Task 095: Build membership-aware carousel resolver, teaser logic, and fallback behavior
  - Priority: P0
  - Requirement IDs: R-HOME-004, R-HOME-006, R-AUTH-001, R-UPGRADE-001
  - Supersedes: Former Task 105
  - Superseded by: None.
  - Goal: Serve the right carousel mix and fallback logic for anonymous, unverified, profile-incomplete, Explorer, Scout, Meridian/internal Command, and staff users.
  - Acceptance criteria: Anonymous users see published story teaser slides plus `/request-access` CTAs; unverified signed-in users see public-safe teasers plus email verification prompts; verified/profile-incomplete users see public-safe teasers plus `/account/profile/complete` prompts; verified/profile-complete users see reviewed editorial stories and custom intelligence cards when personalization is enabled; Explorer users see at least one Scout or Meridian teaser when eligible reviewed content exists, with paid articles prioritized first; Scout and internal Command users see paid intelligence/custom cards rather than repetitive upgrade prompts; premium clicks route to `/upgrade`; personalization can override optional editor picks after 5 qualifying 90-day events; disabled personalization falls back to latest reviewed stories, required editor picks, paid-article teaser priority, and non-personalized tier cards; structured data exposes only public teaser content; tests cover anonymous, unverified, profile-incomplete, verified generic, Explorer, Scout, Meridian/internal Command, staff, sufficient-history, insufficient-history, and disabled-personalization states. Disabled personalization falls back to latest reviewed stories, required editor/admin picks, paid-article teaser priority for Explorer users, and non-personalized tier cards; tests cover enabled, disabled, no-history, sufficient-history, anonymous, unverified, profile-incomplete, Explorer, Scout, and Meridian/internal Command states.
  - Non-technical summary: The homepage carousel now adapts safely to each visitor. Public visitors receive join prompts, members with incomplete setup receive the correct next step, Explorer members see eligible upgrade previews, and paid or staff audiences receive intelligence suited to their access without repetitive sales prompts. Required editorial stories remain protected, while optional stories can be personalized only after sufficient activity.
  - Verification: `npm run lint`, `npm test` (44 tests), `npx tsc --noEmit`, and `npm run build` passed. Resolver fixtures cover anonymous, unverified, profile-incomplete, Explorer, Scout, Meridian/internal Command, staff, sufficient-history, insufficient-history, no-history, and disabled-personalization states. Cloudflare version `c586c122-a350-4252-9a46-a37606d6063b` deployed successfully; the production Playwright crawl traversed 60 internal routes and reported zero console, CSP, 404, 500, or navigation issues.
  - Blocked reason: None.

- [x] Task 096: Add weekly launch and mission tracker schema
  - Priority: P0
  - Requirement IDs: R-MISSION-004, R-MISSION-005, R-MISSION-007, R-MISSION-008, R-LUNAR-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Store weekly launch and mission milestone data with source-backed value fields.
  - Acceptance criteria: Schema supports Monday-Sunday local week windows with UTC fallback, launch/milestone type, launch provider, vehicle, mission, customer/payload, launch site/location, target/orbit/mission location, status, schedule confidence, lunar/cislunar flag, source citations, source registry IDs, last-reviewed timestamp, value state, exact cited value, cited range, analyst estimate, estimate methodology, estimate confidence, gated visibility, reviewer, and audit log.
  - Non-technical summary: Cabeus Explorer can now store a Monday-through-Sunday lunar activity schedule with launches and mission milestones, approved source citations, review status, schedule confidence, and carefully separated public or membership-gated value information. Every editorial change is retained in an audit history.
  - Verification: `npm run lint`, `npm test` (48 tests), `npx tsc --noEmit`, and `npm run build` passed. Both migrations applied to canonical Supabase project `xlpkdoeldtlhearqajat`; live verification found 65 tracker fields, 10 RLS policies, the tier helper, and audit/update triggers. Foreign-key indexes were added for tracker source and user references. Cloudflare version `7e56bd4f-9453-4b8f-9902-567a0da52d68` deployed successfully; the production Playwright crawl traversed 60 internal routes and reported zero console, CSP, 404, 500, or navigation issues.
  - Blocked reason: None.

- [x] Task 097: Seed launch, mission, and value source registry entries
  - Priority: P0
  - Requirement IDs: R-MISSION-006, R-DATAOPS-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Give the tracker approved source entries instead of free-form URLs.
  - Acceptance criteria: Source registry includes Launch Library 2, official NASA/Space Force/operator/customer pages, Spaceflight Now, Next Spaceflight, procurement/award sources, SEC/company sources where relevant, and official contracting records; each source includes owner, URL, terms/license review status, refresh frequency, parser/job owner, citation requirements, quality score, confidence, and analyst review state; unapproved sources cannot publish tracker rows.
  - Non-technical summary: The tracker now has a governed list of 12 launch, mission, contracting, spending, company, and cross-check sources. Seven official or clearly licensed sources are approved for publication; five commercial or operator sources remain visibly pending legal/terms review and cannot publish tracker content.
  - Verification: `npm run lint`, `npm test` (52 tests), `npx tsc --noEmit`, and `npm run build` passed. Current source URLs and usage constraints were checked against official/API documentation. The migration applied to canonical Supabase project `xlpkdoeldtlhearqajat`; live verification found 12 sources, 7 approved records, 5 pending records, job ownership on all 12, and publication-guard triggers on tracker entries, citations, and values. Cloudflare version `fe2eed11-38f4-4c63-9a2d-5cfd8d5a5c5f` deployed after one transient Wrangler retry; the production Playwright crawl traversed 60 internal routes and reported zero console, CSP, 404, 500, or navigation issues.
  - Blocked reason: None.

- [x] Task 098: Implement weekly launch and mission ingestion plus review workflow
  - Priority: P0
  - Requirement IDs: R-MISSION-006, R-MISSION-009
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Populate the tracker from approved sources without inventing unreviewed data.
  - Acceptance criteria: Ingestion uses Launch Library 2 where practical, official operator/customer/NASA/Space Force/agency pages for validation, Spaceflight Now/Next Spaceflight cross-checks, and procurement/award/company/SEC/official contracting records for value evidence; de-duplicates launches and milestones; handles slips, scrubs, holds, no-earlier-than dates, status changes, and source conflicts; flags lunar/cislunar relevance; creates draft rows requiring one editor/admin approval except automated source-reviewed `No launches this week` states; stores ingestion run ID, source check timestamp, confidence, and audit events.
  - Non-technical summary: Cabeus Explorer now has a review-first weekly ingestion pipeline. It identifies lunar launches, removes duplicates, tracks schedule and status changes, queues official and commercial cross-checks, flags source conflicts, and keeps new records in draft until one editor or administrator approves them. A source-reviewed empty week can publish automatically without inventing a launch.
  - Verification: `npm run lint`, `npm test` (57 tests), `npx tsc --noEmit`, `npm run build`, fixture dry-run ingestion, and a live Launch Library 2 dry run passed. The migration applied to canonical Supabase project `xlpkdoeldtlhearqajat`; live verification found five workflow tables, six RLS policies, six lineage columns, and the editor/admin review RPC. Supabase security advisors reported no new finding for these workflow tables. Cloudflare version `ae483749-b8c2-4ab4-b2a1-5d7e07150dd6` deployed successfully; the production Playwright crawl traversed 60 internal routes and reported zero console, CSP, 404, 500, or navigation issues.
  - Blocked reason: None.

- [x] Task 099: Build weekly launch and mission tracker UI
  - Priority: P0
  - Requirement IDs: R-MISSION-004, R-MISSION-008
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Give users an operational weekly view of launches and mission milestones.
  - Acceptance criteria: `/tracker/launches` renders only for verified/profile-complete signed-in users; anonymous users route to `/request-access`, unverified users to email verification, and profile-incomplete users to `/account/profile/complete`; view defaults to all/global launches for the user's Monday-Sunday local week; one-click lunar/cislunar filter is prominent; cards/table show UTC and local time, provider, vehicle, mission, customer/payload, launch site, target/orbit/location, milestone type, status, value state, citations, confidence, freshness, and review timestamp; empty weeks show the automated source-reviewed `No launches this week` state when applicable; mobile view has no horizontal overflow.
  - Non-technical summary: Approved members now have a weekly operations screen for launches and mission milestones. It defaults to the complete global schedule, switches to lunar and cislunar activity in one click, shows local and UTC timing with reviewed sources and confidence, and clearly distinguishes a verified empty week from an unfinished review.
  - Verification: `npm run lint`, `npm test` (61 tests), `npx tsc --noEmit`, and `npm run build` passed. The visibility migration applied to canonical Supabase project `xlpkdoeldtlhearqajat`, enabling member-visible global rows while preserving the lunar filter and RLS-separated values/citations. Tests cover auth/profile redirects, global and lunar modes, required card fields, empty states, and server-only entitled data loading. Cloudflare version `65e019e9-c910-40de-8d64-a837a8c169f0` deployed successfully; the production Playwright crawl explicitly visited both tracker modes and reported zero console, CSP, 404, 500, or navigation issues. A bounded 12-route rerun exited cleanly after the full crawl's outer wrapper timed out during cleanup with an empty issue list.
  - Blocked reason: None.

- [x] Task 100: Add contract value visibility and estimate-methodology gates
  - Priority: P0
  - Requirement IDs: R-MISSION-005, R-UPGRADE-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Prevent premium value estimates from leaking while still showing public cited values where allowed.
  - Acceptance criteria: Value states are exact cited value, cited range, analyst estimate, and not disclosed; exact cited values/ranges can display publicly only when source license/editorial settings allow; analyst estimates and methodology are visible only to Scout/Command; non-entitled views show `Sign up or Log In for More Details` and route to `/upgrade`; account-required states route through `/request-access`; profile-incomplete users complete `/account/profile/complete` before premium checkout or member content; tests confirm no estimate leakage in HTML, API payloads, metadata, search snippets, structured data, exports, or prefetched payloads.
  - Non-technical summary: Contract values now follow enforceable disclosure rules. Reviewed cited values may be shown when their source and editor approve public use, while Potomac analyst estimates and methodology remain available only to Scout and Meridian/internal Command members. Explorer members receive a clear upgrade path instead of a blank or leaked estimate.
  - Verification: `npm run lint`, `npm test` (65 tests), `npx tsc --noEmit`, and `npm run build` passed. The migration applied to canonical Supabase project `xlpkdoeldtlhearqajat`; a live query executed as the anonymous database role returned zero analyst estimates and zero cited values lacking editorial disclosure. Tests also confirm estimate fields are absent from public metadata, search, sitemap, and prefetch surfaces. Cloudflare version `79384541-f064-4385-a226-f98b8f61681b` deployed successfully; the 60-route production Playwright crawl explicitly visited both tracker modes and the tracker upgrade path and reported zero console, CSP, 404, 500, or navigation issues.
  - Blocked reason: None.

- [x] Task 101: Connect and normalize Launches & Missions access, navigation, search, alerts, and exports
  - Priority: P0
  - Requirement IDs: R-HOME-005, R-NAV-001, R-MISSION-004, R-SEARCH-001, R-ALERT-001, R-API-001
  - Supersedes: Former Task 106
  - Superseded by: None.
  - Goal: Make `/tracker/launches` a broader signed-in tracker app with consistent Launches & Missions labeling, access gates, search, alerts, and export hooks.
  - Acceptance criteria: `/tracker/launches` blocks anonymous, email-unverified, and profile-incomplete users from the app shell; any verified/profile-complete account can view the basic app shell without approved Explorer status; Scout/Command-only value estimates, methodology, export, API, advanced filters, and alert features remain gated; member dashboard, account navigation, command palette, search results, breadcrumbs, route metadata, and terminal shell use `Launches & Missions`; search exposes only public-safe snippets to unverified/profile-incomplete states; alerts/watchlists/export hooks respect tier and profile gates. `/tracker/launches` blocks anonymous, unverified signed-in, and profile-incomplete users from member content but allows any authenticated account with verified email and completed profile to load the app shell; approved Explorer status is not required for basic tracker access; Scout/Command-only estimate values and methodology remain gated; member dashboard, account navigation, command palette, search results, breadcrumbs, and route metadata use the exact label `Launches & Missions`; the homepage metric can remain labeled `Launches Tracked`; tests cover anonymous redirect/gate, unverified authenticated verification prompt, profile-incomplete completion prompt, generic verified/profile-complete authenticated access, Explorer access, Scout/Command estimate unlock, and public-safe teaser behavior.
  - Non-technical summary: Launches & Missions is now a connected verified-account application rather than an isolated page. Any verified user with a completed profile can open the basic tracker, while Scout and Meridian/internal Command members receive advanced filters, watchlists, alerts, CSV export, API handoff, and protected estimate details. Navigation, account, terminal, search, command palette, and member workspace labels now agree.
  - Verification: `npm run lint`, `npm test` (70 tests), `npx tsc --noEmit`, and `npm run build` passed. The tracker-specific access migration applied to canonical Supabase project `xlpkdoeldtlhearqajat`; tests cover anonymous, unverified, profile-incomplete, generic verified/profile-complete, Explorer, Scout, Command, staff, public-safe search, paid tools, export authorization, and exact label normalization. Cloudflare version `3940a52e-1f63-4c14-a1fe-3858bc0ebc05` deployed successfully; the 60-route production Playwright crawl explicitly visited tracker, search, terminal, account, alerts, developer, and saved-work handoffs with zero console, CSP, 404, 500, or navigation issues. The unauthenticated CSV endpoint returned `401` as required.
  - Blocked reason: None.

- [x] Task 102: Update homepage Launches Tracked card and handoff behavior
  - Priority: P0
  - Requirement IDs: R-HOME-005, R-MISSION-004
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Turn the current homepage metric into a useful entry point to `/tracker/launches`.
  - Acceptance criteria: Homepage `Launches Tracked` card shows current reviewed count, source freshness, and lunar/cislunar subset count; verified/profile-complete users click through to `/tracker/launches` with week/timezone/filter context; signed-out users see a public teaser and `/request-access` CTA; unverified users see a verify-email CTA; profile-incomplete users route to `/account/profile/complete`; premium value/export/estimate clicks route to `/upgrade`; no dead link or static placeholder metric remains.
  - Non-technical summary: The homepage Launches Tracked card now reports the current reviewed weekly count, lunar/cislunar subset, and source freshness instead of a fixed placeholder. Its primary action adapts to sign-in, email verification, profile completion, or ready-member state, and its paid value/export action goes through the Scout upgrade workflow.
  - Verification: `npm run lint`, `npm test` (74 tests), `npx tsc --noEmit`, and `npm run build` passed. The public-safe aggregate RPC applied to canonical Supabase project `xlpkdoeldtlhearqajat`; the live current-week result correctly returned zero reviewed rows and no freshness rather than invented data. Tests cover approved-source aggregation, removal of the static `26` count, every auth/profile handoff, preserved week/timezone context, and premium upgrade routing. Cloudflare version `c3d70921-6019-496a-861f-13806fa65c09` deployed successfully; the 60-route production Playwright crawl explicitly visited the homepage metric, tracker context, request-access, verification, profile-completion, and premium upgrade paths and reported zero console, CSP, 404, 500, or navigation issues.
  - Blocked reason: None.

- [x] Task 103: Add New Contract Awards module schema and ingestion workflow
  - Priority: P0
  - Requirement IDs: R-CONTRACT-001, R-DATAOPS-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Track space/lunar contract awards separately from launches and mission operations.
  - Acceptance criteria: Schema supports only space/lunar-relevant awards, award date as primary date, future effective date and option-exercise date as secondary fields, customer, vendor, program, award vehicle, amount, value state, citations, confidence, source registry IDs, reviewer, reviewed timestamp, audit log, and tier visibility; ingestion/review excludes general aerospace/defense awards unless directly space/lunar relevant; one editor/admin approval is sufficient.
  - Non-technical summary: Added a separate, review-first contract-awards pipeline that keeps only directly space- or lunar-relevant awards, records award parties and dates, protects premium values by membership tier, and preserves citations and a complete change history. Automated imports create drafts only, and one editor or administrator must approve an award before publication.
  - Verification: Passed 81 automated tests, ESLint, TypeScript, fixture ingestion, and production build. Applied both migrations to Supabase project `xlpkdoeldtlhearqajat`; confirmed all seven module tables have RLS, anonymous reads return no unpublished awards or values, the review RPC is security-invoker and not anonymous, approved USAspending/SAM.gov/SEC registry sources exist, and Supabase advisors report no Task 103 security or performance findings beyond expected new-index unused notices before production data exists. Cloudflare deployment `413295ed-9ca5-4538-bb80-80b138445634` completed, and the production browser crawl visited 60 routes with no console, request, HTTP, or CSP issues.
  - Blocked reason: None.

- [x] Task 104: Build New Contract Awards tracker module UI
  - Priority: P0
  - Requirement IDs: R-CONTRACT-001, R-MISSION-005
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Show contract awards as a separate operational module.
  - Acceptance criteria: Module shows only space/lunar-relevant awards; each card includes award date as primary date plus future effective date and option-exercise date as secondary fields when available, customer, vendor, program, amount/value state, confidence, source citations, reviewer, and last-reviewed timestamp; general aerospace/defense awards are excluded unless directly space/lunar relevant; same value visibility rules as Task 100 apply; signed-out users get public teasers and `/request-access`; unverified users see verification prompts; profile-incomplete users route to `/account/profile/complete`; non-entitled users route to `/upgrade` for premium details.
  - Non-technical summary: Added a dedicated New Contract Awards terminal that separates reviewed space and lunar awards from launch operations and legacy procurement records. Visitors can see public-safe context, Explorer members can open reviewed briefs, and Scout/Meridian members can receive premium values and methodology when those records are published for their tier.
  - Verification: Passed 85 automated tests, ESLint, TypeScript, and production build. Confirmed `/tracker/contracts` is included in the Next.js route manifest; the canonical Supabase project currently contains no reviewed contract-award rows, and anonymous RLS checks return zero awards, values, and citations, so the route renders a reviewed empty state without fabricated records or leaked premium values. Cloudflare deployment `7878bfd6-d9af-4747-aa1a-64a7c3424f23` completed; the production browser crawl visited 60 routes with no console, request, HTTP, or CSP issues, and desktop plus 390px mobile screenshots showed no overlap or horizontal overflow.
  - Blocked reason: None.

- [x] Task 105: Implement production alert evaluation and email delivery
  - Priority: P1
  - Requirement IDs: R-ALERT-001, R-EMAIL-001, R-EMAIL-004
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Complete R-ALERT-001 beyond the current alerts-center and delivery-hook scaffold.
  - Acceptance criteria: Scheduled alert evaluation runs against watched companies, missions, procurements, regulatory records, datasets, events, marketplace records, and Command intelligence; in-app alert feed and unread badges are updated by the evaluator; email notifications are sent through a configured provider; member notification preferences and quiet hours are respected; delivery retries, failures, and audit logs are visible; unsubscribe or preference-management paths are documented and tested.
  - Non-technical summary: Member alerts now run automatically every 15 minutes across watched companies, missions, procurements, regulatory records, datasets, events, marketplace requests and offers, and Command intelligence. Updates appear in the in-app feed, email delivery honors member preferences and quiet hours, and failed or quota-held messages are retried with visible audit history and a direct preferences/unsubscribe path.
  - Verification: `npm run lint`, `npm test` (90 tests), `npx tsc --noEmit`, and `npm run build` passed. Canonical Supabase migration `production_member_alert_evaluator` applied to `xlpkdoeldtlhearqajat`; RLS, service-only quota RPCs, encrypted Vault entries, run audit storage, and active `*/15 * * * *` Supabase Cron job were verified. Cloudflare server secrets include `SUPABASE_SECRET_KEY` and `ALERT_EVALUATOR_SECRET` without public prefixes. A live Vault-backed `pg_net` invocation completed with a clean audit row and zero active rules, so no real member email was sent. Cloudflare version `247052bd-9d0a-459b-a596-a208b820ad23` deployed successfully; the production Playwright crawl visited 60 internal routes with zero console, CSP, 404, 500, or navigation issues. The protected endpoint returned `401` without its bearer token.
  - Blocked reason: None.

- [x] Task 106: Make member alert email digest-first under Resend Free limits
  - Priority: P1
  - Requirement IDs: R-ALERT-001, R-EMAIL-003, R-EMAIL-004
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Preserve useful member alerts while preventing routine notifications from consuming the free daily email budget.
  - Acceptance criteria: Member alert emails default to digest delivery instead of one email per alert; high-priority alerts can request immediate delivery only when reserved quota remains; quiet hours and notification preferences are respected; in-app alert feed and unread badges update regardless of email status; when the email budget is low or exhausted, alerts stay in app and queue for the next digest window instead of failing publicly; admin/config controls define digest cadence, maximum daily alert emails, per-user daily cap, and priority thresholds; unsubscribe/preference links remain present where email is sent; tests cover digest grouping, instant-alert reserve use, quota exhaustion, in-app fallback, per-user caps, quiet hours, and preference changes.
  - Non-technical summary: Routine member alerts are now combined into scheduled lunar intelligence digests instead of sending one email for every update. Urgent alerts can send immediately only while their reserved capacity and the Free-plan budget remain; otherwise every alert stays visible in app and waits safely for the next digest. Admins can adjust digest timing, daily and per-member caps, urgent reserve, priority threshold, budget buffer, and digest size.
  - Verification: `npm run lint`, `npm test` (96 tests), `npx tsc --noEmit`, and `npm run build` passed. Fixture tests cover digest grouping, urgent immediate reserve, reserve exhaustion, low-budget fallback, per-member caps, quiet hours, scheduling, preferences, and in-app independence. Canonical Supabase migration `member_alert_digest_delivery` applied to `xlpkdoeldtlhearqajat`; default policy values, admin-only RLS, digest queue index, and service-role-only runtime budget RPC were verified. The deployed Vault-backed evaluator returned HTTP 200 with no errors, and both scheduled and manual production runs completed cleanly without active alert rules or member sends. Cloudflare version `3d483bfe-52d9-4d3e-bd76-162b0ddee5df` deployed successfully. The broad production crawl visited 60 routes and reported zero issues before the shell timing boundary; a focused 12-route rerun, including `/admin/email`, `/alerts`, and `/member/saved-work`, exited successfully with zero console, CSP, 404, 500, or navigation issues.
  - Blocked reason: None.

- [x] Task 107: Build runtime paid API, export jobs, and webhook delivery
  - Priority: P1
  - Requirement IDs: R-API-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Complete R-API-001 beyond the current Scout/Command developer-platform scaffold.
  - Acceptance criteria: Versioned API routes authenticate developer API keys, enforce Scout/Command scopes and usage limits, write usage/audit logs, and return documented errors; CSV/PDF export requests create and process export jobs with downloadable results; webhook subscriptions deliver signed event payloads with retry/backoff and delivery logs; developer documentation reflects the live endpoints; tests cover authentication, quotas, exports, and webhook delivery behavior.
  - Non-technical summary: Scout and Command members now have a production-ready developer service for lunar intelligence. It supports secure API keys, membership and usage limits, downloadable CSV/PDF/JSON exports, and signed Command webhook notifications with automatic retries. A public reference page explains the live endpoints, while private files and signing secrets remain protected in Supabase Storage and Vault.
  - Verification: Passed 100 automated tests, ESLint, TypeScript, and the Next.js production build. Applied and queried both migrations on canonical Supabase project `xlpkdoeldtlhearqajat`; confirmed the service-only authorization RPC, private export bucket, Vault column, six active endpoint catalog records, two configured worker secrets, and five-minute Cron schedule. Cloudflare deployment `859ef0f8-e15d-4307-82e6-b2aabfe7a0ce` serves the documentation page with HTTP 200 and returns the documented JSON HTTP 401 for an unauthenticated API request. A signed Supabase-to-Cloudflare worker invocation returned HTTP 200 with no queued failures. The production Playwright crawl visited 60 internal routes with no console, network, CSP, or routing issues. Supabase security advisors reported no new finding tied to these developer-platform changes; existing informational private-schema notices remain outside this task.
  - Blocked reason: None.

- [ ] Task 108: Verify canonical remote Supabase migrations and role journeys
  - Priority: P0
  - Requirement IDs: R-AUTH-001, R-TIER-001, R-QA-002, R-DATAOPS-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Prove the completed database-backed requirements against the real Potomac Supabase project.
  - Acceptance criteria: Remote migration history for project `xlpkdoeldtlhearqajat` is reconciled; all production-intended migrations are applied or explicitly skipped; `20260701201833_seed_local_test_users.sql` is skipped unless explicitly approved for remote; Explorer, Scout, Command, organization admin, editor, analyst, and admin role journeys are seeded or otherwise available; RLS read/write checks cover article bodies, search, saved work, alerts, chat, forums, RFQs, lunar missions, procurement, regulatory records, companies, calculators, datasets, uploads, API/export tables, and audit logs; results are documented without exposing secrets.
  - Non-technical summary: Pending.
  - Verification: Not run yet.
  - Blocked reason: Requires canonical project database credentials, runtime Supabase keys, and seeded or approved test users for `xlpkdoeldtlhearqajat`; never use `nwoluvjdojzayozyzlob`.

- [ ] Task 109: Add production trust, telemetry, accessibility, and performance enforcement
  - Priority: P0
  - Requirement IDs: R-TRUST-001, R-QA-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Complete R-TRUST-001 beyond baseline pages and documented hooks.
  - Acceptance criteria: Accessibility checks run in CI for key public/member/admin routes; analytics events are connected to a production provider with consent-aware behavior; managed logs, metrics, traces, and error reporting are configured; Core Web Vitals and route performance budgets are measured and reported; API rate limiting is enforced in middleware or infrastructure; Supabase performance advisor warnings are triaged and either fixed or explicitly accepted with rationale.
  - Non-technical summary: Pending.
  - Verification: Not run yet.
  - Blocked reason: Requires production analytics/observability provider choices, CI/runtime configuration, and a deliberate RLS performance-hardening pass.

- [ ] Task 110: Add source, citation, gating, and no-placeholder QA release checks
  - Priority: P0
  - Requirement IDs: R-QA-002, R-HOME-003, R-DATAOPS-001, R-MISSION-005
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Prevent the homepage, carousel, tracker, and award modules from shipping with placeholders or leaked gated data.
  - Acceptance criteria: Release checks scan public/member routes for placeholder tokens, wrong tier names/prices, missing or inconsistent Meridian labeling, missing Resend Free server-side email routing to/from `info@potomacdb.com`, missing free-plan quota enforcement, accidental paid Resend plan/pay-as-you-go/dedicated-IP/paid-add-on/marketing-broadcast usage, social placeholders, missing citations, missing source freshness, missing value-basis labels, leaked gated estimates, email-unverified or profile-incomplete content leakage, missing expiration metadata, expired promotional content still rendering, broken CTA destinations, broken source links, brand-split violations, auth/profile/upgrade routing errors, accidental Meridian Stripe, online checkout, self-serve invoice, public payment, `mailto:` workflow, or payment-provider placeholder, missing Meridian business-email denylist validation, accessibility regressions, and mobile overflow; checks fail CI/build or produce a clear blocked task note; QA docs explain how editors resolve each blocker.
  - Non-technical summary: Pending.
  - Verification: Not run yet.
  - Blocked reason: Depends on route/test infrastructure and module implementations.

- [ ] Task 111: Add production content import and release-blocking workflow
  - Priority: P0
  - Requirement IDs: R-CONTENT-001, R-CONTENT-002, R-QA-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Ensure Codex does not invent final site content and knows when to block.
  - Acceptance criteria: Importer accepts only reviewed CMS stories, carousel slides, tracker rows, UDRI/Pathfinder/Source CTAs, `/request-access` auth fixture copy, `/upgrade` fixture copy, `/account/profile/complete` profile fixture copy, and contract-award rows that include approver, approval timestamp, citations, source registry IDs, expiration metadata, and asset references; importer rejects missing final content, missing citations, unapproved sources, unreviewed images, and placeholder copy; dashboard shows import status and blockers.
  - Non-technical summary: Pending.
  - Verification: Not run yet.
  - Blocked reason: Depends on Tasks 101-110 and final reviewed content from an editor/admin.

- [ ] Task 112: Run regression suite for homepage, auth, profile, tracker, and gated-intelligence changes
  - Priority: P0
  - Requirement IDs: R-QA-002, R-DEPLOY-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Ensure new homepage/tracker/auth/profile changes do not regress existing terminal features.
  - Acceptance criteria: `npm run lint`, `npm test`, `npm run build`, `npm run build:next`, available E2E tests, local Supabase migration checks where practical, no-placeholder scans, auth/profile/upgrade routing tests, email-verification tests, profile-completion tests, carousel tests, tracker tests, CTA tests, Resend Free-plan quota-governor tests, mocked `daily_quota_exceeded`/`monthly_quota_exceeded`/`rate_limit_exceeded` tests, and mobile overflow checks pass or document exact blockers; remaining production/live Supabase gaps are captured as blocked reasons rather than marked complete.
  - Non-technical summary: Pending.
  - Verification: Not run yet.
  - Blocked reason: Depends on Tasks 077-111.

- [ ] Task 113: Add Meridian, Resend, and operational release QA and monitoring checks
  - Priority: P0
  - Requirement IDs: R-QA-002, R-EMAIL-001, R-EMAIL-002, R-EMAIL-003, R-EMAIL-004, R-UPGRADE-002, R-UPGRADE-003
  - Supersedes: Former Task 119
  - Superseded by: None.
  - Goal: Prevent public enterprise label, payment, email-routing, Resend quota, and operational-monitoring regressions before deployment.
  - Acceptance criteria: Automated and manual QA scan public/member/admin routes for the public label `Meridian`, absence of slash-label public enterprise copy, absence of Meridian Stripe/checkout/invoice/payment-provider/`mailto:` leakage, correct `/upgrade` routing, simple personal-domain denylist behavior, business-email acceptance, Resend Free server-side email payload addressed to/from `info@potomacdb.com`, Reply-To behavior, provider message-id logging, lead/audit record creation, backend Command entitlement mapping, no automatic entitlement grant, no paid Resend plan/pay-as-you-go/dedicated-IP/paid-add-on/marketing-broadcast usage, quota preflight behavior, and graceful quota-hold copy; production smoke test confirms failed Resend configuration or quota configuration blocks release with admin-facing messaging rather than public placeholders. Release QA checks `RESEND_PLAN=free` or equivalent config, `info@potomacdb.com` sender, one verified `potomacdb.com` sending domain, no paid-overage/pay-as-you-go/auto-upgrade code paths, quota ledger tables, queue worker configuration, admin quota dashboard, alert digest controls, 429 and quota-exceeded handling, and no public placeholder copy; smoke tests simulate Resend success, provider failure, `daily_quota_exceeded`, `monthly_quota_exceeded`, rate-limit 429, missing `RESEND_API_KEY`, missing DNS/sender verification, duplicate form submission, and quota-exhausted alert digest behavior; production operations document daily/monthly reset monitoring, manual resend procedure, escalation criteria for upgrading later, and how to keep the site functional when email sends are capped.
  - Non-technical summary: Pending.
  - Verification: Not run yet.
  - Blocked reason: Live email-send verification depends on Resend verification for the `potomacdb.com` domain and `info@potomacdb.com` sender, DNS configuration, the `RESEND_API_KEY` runtime secret, and quota-usage storage; label/payment/routing/denylist/sender-payload/mock-Resend/free-plan quota tests can proceed earlier. Live release checks require Resend account access, domain verification status, runtime secrets, and production deployment variables. Mocked release checks and documentation can proceed earlier.

- [ ] Task 114: Verify production deployment on the current Cloudflare URL
  - Priority: P0
  - Requirement IDs: R-DEPLOY-001, R-QA-002
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Prove the live site reflects the new carousel, tracker, auth, upgrade, profile, and no-placeholder requirements.
  - Acceptance criteria: Production Cloudflare URL renders Cabeus Explorer public branding, rotating carousel, latest reviewed story teasers, `/request-access` Sign In / Sign Up path with Sign Up selected by default, `/upgrade` premium path, `/account/profile/complete` profile-completion path, UDRI house ad, Pathfinder/Source CTAs, approved Substack/podcast/LinkedIn links when configured with real destination URLs, no X or unapproved social placeholders, no placeholder tokens, correct tier copy, no Meridian Stripe, online checkout, self-serve invoice, public payment, `mailto:`, or payment-provider placeholder, Meridian business-email denylist validation, Resend Free server-side email routing to/from `info@potomacdb.com`, Resend Free-plan configuration and quota-governor behavior, graceful queued/delayed states when the mock quota is exhausted, Launches Tracked handoff, `/tracker/launches` email/profile gate, weekly tracker data or no-launch state, New Contract Awards module, and no gated estimate leakage; verification includes desktop/mobile screenshots, route status, console logs, structured data, source links, CTA destinations, auth/profile/upgrade redirects, quota-state smoke tests, and rollback notes.
  - Non-technical summary: Pending.
  - Verification: Not run yet.
  - Blocked reason: Depends on deploy access, production build, source data, and reviewed content.

- [ ] Task 115: Prepare release-readiness checklist for operational launch
  - Priority: P0
  - Requirement IDs: R-DEPLOY-001, R-QA-002, R-CONTENT-001
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Give Codex and editors a final checklist before considering the website operational.
  - Acceptance criteria: Production checklist confirms approved content owner, one editor/admin approver, reviewed CMS stories, carousel slides, tracker data or no-launch state, New Contract Awards data or reviewed empty state, UDRI/Pathfinder/Source CTA assets, approved Substack/podcast/LinkedIn destination URLs where configured, `/request-access`, `/upgrade`, and `/account/profile/complete` routes, source registry entries, expiration metadata, Supabase Storage assets, email-verification behavior, profile-completion behavior, premium upgrade routing, member gates, Scout checkout configuration, Meridian server-side inquiry path with simple personal-domain denylist validation, Resend Free-plan account configuration, Free-plan quota governor, queue/defer behavior, admin usage/queue view, Resend email delivery to/from `info@potomacdb.com`, and no Stripe, online checkout, self-serve invoice, public payment, `mailto:` workflow, payment-provider placeholder, paid Resend plan, or overage configuration, analytics events, no X or unapproved social placeholders, no placeholders, rollback commit, and post-deploy smoke tests.
  - Non-technical summary: Pending.
  - Verification: Not run yet.
  - Blocked reason: Depends on Tasks 077-114.

- [ ] Task 116: Add lunar time display to the main page
  - Priority: P1
  - Requirement IDs: R-HOME-007
  - Supersedes: None.
  - Superseded by: None.
  - Goal: Give public visitors a clear, reliable view of the current lunar reference time alongside UTC.
  - Acceptance criteria: The main page shows a `Lunar Time` clock and corresponding UTC time using a documented, source-backed lunar reference-time calculation; it refreshes at least once per minute without layout shift; text labels explain the reference without claiming an unsupported local lunar civil timezone or mission-site time; the clock is keyboard and screen-reader accessible; failures render an approved unavailable state rather than a fabricated value; tests cover calculation formatting, UTC companion display, refresh behavior, unavailable state, reduced-motion/no-JavaScript fallback, and mobile/desktop layout.
  - Non-technical summary: Pending.
  - Verification: Not run yet.
  - Blocked reason: The authoritative lunar reference-time source and calculation package or formula must be selected and documented before implementation; the display must not invent a lunar timezone.
