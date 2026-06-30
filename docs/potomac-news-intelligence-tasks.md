# Potomac News & Intelligence Automation Tasks

This task list is edited by the recurring Codex automation. The automation should read `docs/codex-automation-memory.md` first, then work from the first unchecked task downward.

Task format:

```md
Task NNN: Short title
Priority:
Goal:
Acceptance criteria:
Non-technical summary:
Verification:
Blocked reason:
```

- [x] Task 001: Confirm Supabase MCP target uses `xlpkdoeldtlhearqajat`
  - Priority: P0
  - Goal: Ensure Codex and any Supabase tooling target the correct Potomac Supabase project.
  - Acceptance criteria: MCP configuration points to project ref `xlpkdoeldtlhearqajat`; any reference to `nwoluvjdojzayozyzlob` is removed or clearly marked as wrong; authentication status is documented.
  - Non-technical summary: Supabase tooling is now documented and project-scoped to the correct Potomac backend.
  - Verification: Confirmed local Codex config uses `https://mcp.supabase.com/mcp?project_ref=xlpkdoeldtlhearqajat`; added matching project `.mcp.json`; confirmed the Supabase MCP endpoint is reachable with the expected unauthenticated HTTP `401` response; authenticated tool access could not be verified because Supabase MCP tools were not exposed in this session.
  - Blocked reason: None.

- [x] Task 002: Add project documentation for the Next.js + Supabase migration
  - Priority: P0
  - Goal: Document the intended migration from the current Vite site to a Next.js + Supabase architecture.
  - Acceptance criteria: Documentation explains the migration rationale, target stack, key risks, Supabase ownership boundaries, and expected developer workflow.
  - Non-technical summary: The migration path is now documented so the team can move from the current site to the future news and member platform with clearer guardrails.
  - Verification: Reviewed the current Vite routes, public assets, Tailwind brand tokens, and package setup; added migration documentation covering rationale, stack, risks, ownership boundaries, and developer workflow. No build was run because this was a documentation-only task.
  - Blocked reason: None.

- [x] Task 003: Create initial Next.js app structure or migration scaffold
  - Priority: P0
  - Goal: Establish the first usable Next.js structure for the future site.
  - Acceptance criteria: Project contains a working Next.js scaffold or migration-compatible structure; existing Potomac routes/assets are accounted for; build instructions are documented.
  - Non-technical summary: A separate Next.js scaffold now exists so the future platform can be built without disrupting the current live Vite site.
  - Verification: `npm run build:next` passed for the `next-app` scaffold and generated the preserved route set; `npm run build` passed for the existing Vite app. Both builds reported the existing Browserslist data warning. Installing Next reported 20 npm audit findings that were not changed because dependency remediation is outside this scaffold task.
  - Blocked reason: None.

- [x] Task 004: Preserve Potomac brand tokens, typography, colors, and assets
  - Priority: P0
  - Goal: Carry the current Potomac visual identity into the new platform foundation.
  - Acceptance criteria: Brand colors, typography choices, logo assets, and lunar command-center styling are available to new pages/components without regressions.
  - Non-technical summary: The Next.js scaffold now has Potomac brand colors, fonts, styling utilities, and synced logo/media assets ready for new pages.
  - Verification: Added a Next brand module, documented the token and asset workflow, synced `public/` assets into `next-app/public/`, and confirmed `npm run build:next` and `npm run build` pass after the brand updates.
  - Blocked reason: None.

- [x] Task 005: Add Supabase client/server integration
  - Priority: P0
  - Goal: Connect the app to Supabase safely from browser and server contexts.
  - Acceptance criteria: Supabase clients are configured with the correct project ref, environment variable documentation exists, and no secret keys are exposed to the browser.
  - Non-technical summary: The Next.js scaffold now has safe Supabase browser and server connection helpers pointed at the correct Potomac project.
  - Verification: Installed current Supabase SSR/client packages; added browser, server, and proxy client helpers; documented environment variables and secret-key handling; confirmed `npm run build:next` and `npm run build` pass; ran a hidden-file search for project refs and secret exposure patterns. Authenticated Supabase calls were not run because no publishable key was available in this session.
  - Blocked reason: None.

- [x] Task 006: Add Supabase Auth login, logout, session handling, and protected routes
  - Priority: P0
  - Goal: Let users sign in and route them based on authentication status.
  - Acceptance criteria: Login, logout, session refresh, protected route handling, and unauthenticated redirects work in the app.
  - Non-technical summary: The scaffold now has sign-in, sign-out, session refresh, and a protected member area ready for Supabase credentials.
  - Verification: Added login, callback, logout, and protected member routes; protected routes use server-side `getClaims()` and redirect signed-out users to login; confirmed `npm run build:next` and `npm run build` pass. Live login/logout could not be exercised because no Supabase publishable key was available in this session.
  - Blocked reason: None.

- [x] Task 007: Create member profile, application, organization, role, and entitlement schema
  - Priority: P0
  - Goal: Define the core data model for members, organizations, approvals, roles, and paid access.
  - Acceptance criteria: Schema supports pending applicants, approved Members, Scout users, Command organizations, org admins, and entitlement records.
  - Non-technical summary: The initial database model now defines member applications, profiles, organizations, roles, org admins, and paid-access entitlements.
  - Verification: Created a Supabase migration with the CLI for the workspace and documented the schema coverage; static search confirmed the required tables, roles, entitlements, and RLS enablement are present. `supabase migration list --local` could not run because no local Supabase Postgres was listening on `127.0.0.1:54322`. Remote application was not run because authenticated Supabase MCP tools were unavailable and no database credentials were available.
  - Blocked reason: None.

- [x] Task 008: Add RLS policies for public, pending applicant, Member, Scout, Command, org admin, editor, analyst, and admin access
  - Priority: P0
  - Goal: Protect Supabase data according to the membership and staff access model.
  - Acceptance criteria: RLS policies exist for relevant tables; each role can access only the expected rows/actions; policies avoid user-editable metadata for authorization.
  - Non-technical summary: The member access tables now have a documented RLS policy migration for public applications, members, paid tiers, organization admins, staff, and admins.
  - Verification: Added private-schema authorization helpers, explicit grants, and RLS policies for the member access tables; static search confirmed helper functions, grants, policies, and required role names are present. Local or remote SQL execution was not possible because no local Supabase database was running and authenticated Supabase MCP/CLI database access was unavailable.
  - Blocked reason: None.

- [x] Task 009: Build free Member application flow with manual approval state
  - Priority: P0
  - Goal: Let public visitors apply for free membership and enter a pending review state.
  - Acceptance criteria: Application form captures required fields, creates a pending application, shows confirmation, and does not grant full access before approval.
  - Non-technical summary: Public visitors can now submit a free Member application that stays pending until an admin reviews it.
  - Verification: Added the `/apply` form route, pending application insert logic, confirmation messaging, and documentation; confirmed `npm run build:next` and `npm run build` pass. Live insert verification was not possible because no Supabase publishable key was available and the schema migration was not applied to a reachable database.
  - Blocked reason: None.

- [x] Task 010: Build admin approval workflow for free Members
  - Priority: P0
  - Goal: Let authorized admins review, approve, or reject membership applications.
  - Acceptance criteria: Admin workflow lists pending applications, records decisions, updates member status, and keeps an audit trail.
  - Non-technical summary: Admins now have a protected review workflow for approving or rejecting free Member applications.
  - Verification: Added the protected `/admin/applications` route, admin role guard, approve/reject server actions, member profile/role updates for linked users, audit-event inserts, and workflow documentation; confirmed `npm run build:next` and `npm run build` pass. Live approval/rejection could not be exercised because no Supabase publishable key was available and the schema migration was not applied to a reachable database.
  - Blocked reason: None.

- [x] Task 011: Add Stripe Scout checkout at `$25k/user/year`
  - Priority: P0
  - Goal: Support self-serve annual Scout upgrades for approved Members.
  - Acceptance criteria: Stripe product/price or documented configuration supports `$25k/user/year`; checkout starts only for eligible users; payment status is captured.
  - Non-technical summary: Approved Members now have a server-side Stripe Checkout path for the annual Scout upgrade.
  - Verification: Installed the current Stripe SDK; documented the `$25k/user/year` recurring Price configuration; added the server-only checkout route and member upgrade button; confirmed `npm run build:next` and `npm run build` pass. Live Stripe checkout was not run because no Stripe secret key, Price ID, or authenticated Supabase session was available.
  - Blocked reason: None.

- [x] Task 012: Add Scout entitlement activation after successful payment
  - Priority: P0
  - Goal: Grant Scout access after successful Stripe payment or subscription activation.
  - Acceptance criteria: Stripe webhook or equivalent process updates entitlements, handles failures/idempotency, and records audit history.
  - Non-technical summary: Stripe webhook handling now activates Scout entitlements after payment and records duplicate-safe audit history.
  - Verification: Added a webhook idempotency migration, server-only Supabase service client, shared Stripe server helper, webhook route for successful checkout/subscription updates/deletions/payment failures, role/entitlement updates, and audit-event writes; confirmed `npm run build:next` and `npm run build` pass. Live webhook delivery was not exercised because Stripe secrets, a Supabase service secret, and an applied reachable schema were unavailable.
  - Blocked reason: None.

- [x] Task 013: Add Command interest form and manual sales/admin workflow
  - Priority: P0
  - Goal: Capture enterprise Command interest without self-serve purchase.
  - Acceptance criteria: Command interest form stores requests, notifies/admin-surfaces leads, and supports manual entitlement grants after offline approval.
  - Non-technical summary: Enterprise Command interest can now be captured publicly and reviewed by admins for manual organization-level access grants.
  - Verification: Added Command interest schema/RLS, public `/command` form, protected `/admin/command` workflow, manual Command organization/entitlement grant action, audit-event writes, and documentation; confirmed `npm run build:next` and `npm run build` pass. Live database inserts and grants could not be exercised because Supabase keys were unavailable and the schema migration was not applied to a reachable database.
  - Blocked reason: None.

- [x] Task 014: Build organization admin portal for seats, members, entitlements, and billing contacts
  - Priority: P0
  - Goal: Give organization admins a place to manage their organization.
  - Acceptance criteria: Org admins can view organization details, members, seats, entitlements, and billing contacts within their permitted scope.
  - Non-technical summary: Organization admins now have a protected workspace to review their permitted organizations, seats, members, billing contact, and active entitlements.
  - Verification: Added `/organization`, an organization-admin auth helper, scoped Supabase reads, navigation, and documentation; confirmed `npm run build:next` and `npm run build` pass. Live database reads could not be exercised because Supabase keys were unavailable and the schema migration was not applied to a reachable database.
  - Blocked reason: None.

- [x] Task 015: Create editorial CMS schema for articles, authors, tags, versions, citations, and SEO metadata
  - Priority: P0
  - Goal: Store editorial content with public teaser and gated full-body support.
  - Acceptance criteria: CMS schema supports articles, authors, tags, versions, citations, SEO/AEO fields, teaser content, gated body, and publish states.
  - Non-technical summary: Editorial content now has a CMS-ready database design for public teasers, protected full stories, authors, tags, source citations, version history, and search metadata.
  - Verification: Added the editorial CMS migration and schema documentation, including public article rows, separate gated bodies, authors, tags, versions, citations, SEO/AEO fields, publish states, indexes, grants, and RLS policies; confirmed `npm run build:next` and `npm run build` pass. Live migration execution could not be run because Supabase keys were unavailable and no local database was reachable.
  - Blocked reason: None.

- [x] Task 016: Build editor workflow for draft, preview, publish, and gated body content
  - Priority: P0
  - Goal: Let editors manage news stories without code changes.
  - Acceptance criteria: Editors can create drafts, preview public/gated content, publish stories, and update gated bodies safely.
  - Non-technical summary: Editors now have a protected workspace for creating drafts, previewing public and member-only story content, saving versions, and publishing articles.
  - Verification: Added `/admin/editorial`, editorial staff auth, draft/create/update/publish server actions, inline public and gated previews, version snapshot writes, and workflow documentation; confirmed `npm run build:next` and `npm run build` pass. Live editor actions could not be exercised because Supabase keys were unavailable and the editorial schema was not applied to a reachable database.
  - Blocked reason: None.

- [x] Task 017: Build public news-first homepage with headline feed, snippets, event teasers, tickers, and sponsor slots
  - Priority: P0
  - Goal: Make the homepage function as the public front door for the news/intelligence site.
  - Acceptance criteria: Homepage displays featured and latest stories, short snippets, event teasers, market modules, sponsor slots, and membership CTAs.
  - Non-technical summary: The public homepage now works as a news-first front door with a lead brief, latest-story snippets, event previews, market/ticker modules, sponsor placements, and Member/Command access calls to action.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --check` passed. Browser QA on `http://127.0.0.1:3001/` confirmed the homepage title, lead story, ticker, event teasers, market modules, sponsor slots, and CTA navigation to `/apply`. The Browser screenshot API timed out with `Page.captureScreenshot`, so desktop `1280x720` and mobile `390x844` screenshot evidence was captured with bundled Playwright using local Microsoft Edge; both viewports rendered without horizontal overflow. Live Supabase CMS feed reads could not be exercised because no Supabase public key was available, so QA covered the safe fallback path and the code still rejects any non-`xlpkdoeldtlhearqajat` Supabase URL.
  - Blocked reason: None.

- [x] Task 018: Build article page with rich public teaser and gated full story
  - Priority: P0
  - Goal: Balance SEO/AEO visibility with membership gating.
  - Acceptance criteria: Public visitors see headline, summary, key bullets, intro, citations, and signup prompts; approved Members can read the full article.
  - Non-technical summary: Article pages now show rich public teasers with key points, intro text, citations, and access prompts, while full bodies are requested only for signed-in users with an approved Member-or-higher role.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --check` passed. Browser QA on `http://127.0.0.1:3001/news/vipc-grant-winner` confirmed the headline, public summary, intro, source citations, gated full-story panel, and sign-in CTA navigation. Desktop `1280x720` and mobile `390x844` screenshot evidence was captured with bundled Playwright using local Microsoft Edge; both viewports rendered without horizontal overflow. Live approved-member unlock could not be exercised because no Supabase public key, signed-in test member, or applied remote schema was available; the implementation uses normalized role assignments and the existing RLS-protected body table for the live path.
  - Blocked reason: None.

- [x] Task 019: Add schema.org metadata, canonical URLs, sitemap, and robots configuration
  - Priority: P0
  - Goal: Improve search and answer-engine discoverability for public pages.
  - Acceptance criteria: Public routes include relevant structured data, canonical URLs, sitemap coverage, and robots configuration that does not expose gated content improperly.
  - Non-technical summary: Public pages now publish canonical URLs, structured data, sitemap entries, and robots rules that expose public teaser content while keeping protected areas out of crawler paths.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --check` passed. Local checks confirmed `/robots.txt` disallows `/admin/`, `/api/`, `/auth/`, `/member`, and `/organization`; `/sitemap.xml` lists public routes and the public article teaser URL only; the homepage HTML includes canonical, WebSite, and ItemList JSON-LD; the VIPC article HTML includes canonical, NewsArticle JSON-LD, a gated-content selector, and does not include the member-only fallback body in public markup. Implementation was checked against current official Next.js metadata-file/JSON-LD docs and schema.org NewsArticle guidance.
  - Blocked reason: None.

- [x] Task 020: Add Substack, podcast, LinkedIn, and X link modules
  - Priority: P1
  - Goal: Make Potomac's external channels easy to find.
  - Acceptance criteria: Header, footer, or content modules include configurable links for Substack, podcast, LinkedIn, and X.
  - Non-technical summary: The site footer now has a reusable external-channel module for Substack, podcast, LinkedIn, and X, with LinkedIn live and the other channels clearly marked as launch pending until public URLs exist.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --check` passed. Search and existing-code review found a verified Potomac LinkedIn company URL but no reliable public Potomac Substack, podcast, or X URL, so those configurable channel entries intentionally render as launch-pending placeholders rather than invented links. Local HTML checks confirmed the homepage and article page render all four channel labels, include the verified LinkedIn URL, and add the live channel to organization `sameAs` structured data.
  - Blocked reason: None.

- [x] Task 021: Build public/member event calendar with teaser-gated access
  - Priority: P1
  - Goal: Promote major space conferences, summits, and workshops while reserving details for Members.
  - Acceptance criteria: Public users see event teasers; approved Members see full event details; event data is editable by authorized staff.
  - Non-technical summary: The site now has a public event calendar with conference and workshop teasers, member-only detail gates, and a staff editor for maintaining event data.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --cached --check` passed. Browser QA on `http://127.0.0.1:3002/events` confirmed the page title, event cards, public teaser labels, member-gated detail panels, no public leak of fallback member detail text, no console errors, and CTA navigation to `/apply`. Desktop `1280x720` and mobile `390x844` screenshots were captured with bundled Playwright after the in-app Browser screenshot API timed out with `Page.captureScreenshot`; both viewports rendered without horizontal overflow. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`; live remote schema/RLS checks were not run because authenticated Supabase database tooling was not exposed.
  - Blocked reason: None.

- [x] Task 022: Build Potomac internal summit tracker and past-event summary view
  - Priority: P1
  - Goal: Track Potomac's upcoming internal summits and summarize major news from past events.
  - Acceptance criteria: Member-gated tracker shows upcoming internal summits and past-event summaries with dates, status, and editable content.
  - Non-technical summary: Approved members now have a dedicated internal summit tracker for upcoming summit plans and past-event summaries, with a staff editor for maintaining the content.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --cached --check` passed. Browser QA on `http://127.0.0.1:3002/member/summits` confirmed the safe no-env member gate, no internal fallback summit content exposure, no console errors, and CTA navigation to `/apply`. Desktop `1280x720` and mobile `390x844` screenshots were captured with bundled Playwright after the in-app Browser screenshot API timed out with `Page.captureScreenshot`; both viewports rendered without horizontal overflow. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`; live approved-member tracker reads, staff edits, and remote RLS checks were not run because authenticated Supabase database tooling and a signed-in test member were unavailable.
  - Blocked reason: None.

- [x] Task 023: Add sponsor and ad placement schema/admin controls
  - Priority: P1
  - Goal: Store and manage direct-sold sponsorship and ad inventory.
  - Acceptance criteria: Schema and admin controls support sponsors, placements, campaign dates, discounts, status, and reporting fields.
  - Non-technical summary: Staff can now manage sponsor accounts, sellable ad placements, campaign date windows, discount terms, and delivery reporting fields from a protected admin workflow.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --check` passed. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`. Live sponsor create/edit flows were not exercised because authenticated Supabase database tooling, applied schema, and signed-in editor/admin test users were unavailable.
  - Blocked reason: None.

- [x] Task 024: Implement hybrid direct-sold/programmatic ad placement surfaces
  - Priority: P1
  - Goal: Display sponsor inventory and allow programmatic fallback where appropriate.
  - Acceptance criteria: Public pages can render direct-sold sponsor units and documented fallback slots without breaking layout or gated content.
  - Non-technical summary: Public pages now render sponsor units from live direct-sold campaign data when available, with stable Potomac-branded fallback slots when no campaign is active.
  - Verification: `npm run build` passed; `git diff --check` passed with only LF-to-CRLF warnings. Root Vite preview QA on `http://127.0.0.1:4173/` confirmed `/`, `/events`, and `/news/vipc-grant-winner` render the news-first homepage, event calendar, article gate, and Potomac-branded sponsor units in the app that Cloudflare Pages currently builds. Browser DOM and console checks passed with no framework overlay or app warnings/errors; Browser screenshot and locator-click calls timed out, so bundled Playwright using local Microsoft Edge captured desktop `1280x720` and mobile `390x844` screenshot evidence and clicked the homepage Calendar link through to `/events`. Live direct-sold campaign rendering from Supabase could not be exercised because the schema is not applied to a reachable authenticated project in this session.
  - Blocked reason: None.

- [x] Task 025: Create public company universe and dynamic top-20 space company ranking
  - Priority: P1
  - Goal: Maintain a ranked list of publicly traded space companies for ticker display.
  - Acceptance criteria: Admin-maintained eligible company universe exists; ranking logic selects top 20 by the chosen metric and records ranking date/source.
  - Non-technical summary: Analysts now have a protected company universe and dated top-20 ranking workflow for public space-company ticker coverage.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --check` passed. Added an explicit-grant/RLS Supabase migration for public company records, ranking runs, top-20 ranking snapshots, and the staff-checked ranking function; added `/admin/companies` for maintaining companies and generating/publishing snapshots; documented the workflow. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`; live remote migration/RLS verification was not run because authenticated Supabase database tooling was unavailable in this session.
  - Blocked reason: None.

- [x] Task 026: Add curated/delayed stock quote ingestion and ticker UI
  - Priority: P1
  - Goal: Show stock data without requiring real-time licensing in MVP.
  - Acceptance criteria: Quote records include source, delay/freshness timestamp, price, change, and ticker display on public/dashboard surfaces.
  - Non-technical summary: Staff can now curate delayed public-company quote rows, and the homepage plus member workspace can show the latest displayable ticker data without real-time market feeds.
  - Verification: `npm run build:next` passed; `npm run build` passed; `git diff --check` passed. A local `next start` smoke test on `http://127.0.0.1:3004/` confirmed the public homepage renders the safe quote-feed fallback when no displayable Supabase quote rows are available. Added the delayed quote schema/RLS migration, quote maintenance controls in `/admin/companies`, a shared quote-backed ticker loader, public homepage ticker rendering, member workspace ticker rendering, and workflow documentation. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`; live quote insertion/RLS verification was not run because authenticated Supabase database tooling and an applied reachable schema were unavailable.
  - Blocked reason: None.

- [x] Task 027: Create commodity asset and proxy-pricing model schema
  - Priority: P1
  - Goal: Store lunar-resource commodity prices and proxy assumptions.
  - Acceptance criteria: Schema supports commodities, units, proxy formulas, source citations, confidence labels, and update cadence.
  - Non-technical summary: Lunar-resource commodity pricing now has a database foundation for assets, proxy formulas, source-backed observations, citations, confidence labels, and update cadence.
  - Verification: `git diff --check` passed. Added a Supabase migration for commodities, proxy-pricing models, price observations, source citations, explicit grants, RLS policies, confidence labels, update cadence fields, and workflow documentation. App builds were not rerun because this task only changed SQL and docs. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`; live migration/RLS verification was not run because authenticated Supabase database tooling and an applied reachable schema were unavailable.
  - Blocked reason: None.

- [x] Task 028: Add 20 lunar-resource commodity ticker entries with citations and confidence labels
  - Priority: P1
  - Goal: Seed or configure the commodity ticker with lunar-resource-relevant entries.
  - Acceptance criteria: 20 commodity entries exist with price/proxy source notes, confidence labels, units, and display-ready ticker fields.
  - Non-technical summary: The lunar-resource ticker now has 20 display-ready commodity entries with proxy values, units, confidence labels, source notes, and citations.
  - Verification: Added a Supabase seed migration plus documentation for 20 lunar-resource commodities, each with an active commodity row, `Public ticker proxy v1` model, displayable price/proxy observation, and citation. Static verification counted 20 seed rows, confirmed no unexpected wrong-project Supabase references were introduced, and `git diff --check` passed with only the existing LF-to-CRLF warning. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`; live remote migration/RLS verification was not run because authenticated Supabase database tooling was unavailable in this session.
  - Blocked reason: None.

- [x] Task 029: Create lunar economy model schema with assumptions, sources, versions, and daily estimates
  - Priority: P0
  - Goal: Store the analytical model behind the daily lunar economy tracker.
  - Acceptance criteria: Schema supports model versions, assumptions, source documents, scenario estimates, confidence scores, and daily output values.
  - Non-technical summary: The lunar economy tracker now has a database design for model versions, assumptions, reviewed sources, scenario estimates, confidence scoring, and daily published outputs.
  - Verification: Added a Supabase migration and schema documentation for six economy-model tables with enums, constraints, indexes, explicit grants, RLS enabled on all tables, and public/staff/manage policies. Static checks confirmed six `lunar_economy_*` tables, six RLS enablements, eighteen policies, confidence-score fields, source review status, publication status, and no unexpected wrong-project Supabase references. `git diff --check` passed. App builds were not rerun because this task only changed SQL and docs. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`; live remote migration/RLS verification was not run because authenticated Supabase database tooling was unavailable in this session.
  - Blocked reason: None.

- [x] Task 030: Implement Firefly benchmark using full NASA-paid cost basis
  - Priority: P0
  - Goal: Calculate the Firefly lunar surface data benchmark from the full NASA-paid cost, not only the data addendum.
  - Acceptance criteria: Benchmark includes original `~$100M` mission cost, `$10M` data addendum, `~$45M` PRISM contracts, citations, methodology notes, and versioned assumptions.
  - Non-technical summary: The Firefly lunar data benchmark now uses the full NASA-paid cost basis, not just the later data addendum.
  - Verification: Added a Supabase seed migration and documentation for `firefly-blue-ghost-full-cost-benchmark-v1`, including four public source documents, seven versioned assumptions, a published baseline scenario, and a published daily output. Static checks confirmed the benchmark includes `$101M` mission delivery, `$93.3M` original award reference, `$44M` PRISM/science payload cost basis, `$10M` data addendum, `$155M` baseline, `$147.3M` lower reference, and the `baseline_full_nasa_paid_cost` scenario key. Source review used NASA, Firefly, NASA Science CLPS delivery, and Associated Press pages. `git diff --check` passed with only the existing LF-to-CRLF warning. App builds were not rerun because this task only changed SQL and docs. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`; live remote migration/RLS verification was not run because authenticated Supabase database tooling was unavailable in this session.
  - Blocked reason: None.

- [x] Task 031: Build analyst-facing economy methodology and source table UI
  - Priority: P1
  - Goal: Let analysts inspect and maintain lunar economy methodology inputs.
  - Acceptance criteria: Analyst view shows assumptions, formulas, citations, source tables, confidence labels, and methodology version history.
  - Non-technical summary: Analysts now have a protected economy admin workspace for reviewing methodology versions, assumptions, source records, evidence links, confidence labels, and output history.
  - Verification: Added `/admin/economy`, an editor/analyst/admin guard, server actions for methodology versions, assumptions, source documents, and assumption-source evidence links, plus workflow documentation. `npm run build:next` passed and registered `/admin/economy` as a dynamic route; `npm run build` passed for the legacy Vite site; `git diff --check` passed; project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about the wrong project. `npm run lint` could not run because the repo has no ESLint configuration file. Live protected-route and Supabase edit-flow verification could not be exercised because no Supabase publishable key, applied reachable schema, or seeded analyst/editor/admin test account was available in this session.
  - Blocked reason: None.

- [x] Task 032: Build public economy summary widget
  - Priority: P1
  - Goal: Show a simplified public version of the lunar economy tracker.
  - Acceptance criteria: Public widget displays headline estimate, date, scenario/range label, concise methodology note, and membership CTA for details.
  - Non-technical summary: The homepage now shows a public lunar economy tracker with the headline estimate, date, range, confidence, source count, methodology note, and access prompts.
  - Verification: Added a public economy summary loader, Firefly full-cost fallback, reusable homepage widget, and workflow documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with only existing LF-to-CRLF warnings; project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing docs that warn against the wrong project. In-app Browser QA on `http://localhost:3002/` confirmed page identity, no console errors/warnings, `$155M` headline, `$147.3M - $155M` range, `Jun 26, 2026` date with no stale `Jun 25, 2026` display, methodology note, CTA text, CTA navigation to `/apply`, and no mobile horizontal overflow at `390x844`. Browser screenshot capture timed out with `Page.captureScreenshot`, so desktop `1280x720` and mobile `390x844` screenshot evidence was captured with bundled Playwright using local Microsoft Edge. Live Supabase reads were not exercised because no Supabase publishable key or applied reachable schema was available, so QA covered the safe fallback path.
  - Blocked reason: None.

- [x] Task 033: Build Scout/Command detailed economy dashboard
  - Priority: P1
  - Goal: Give paid members access to deeper lunar economy analysis.
  - Acceptance criteria: Dashboard shows detailed scenarios, source tables, assumptions, downloads, and update timestamps with Scout/Command access control.
  - Non-technical summary: Paid Scout and Command users now have a protected lunar economy dashboard with scenario analysis, methodology assumptions, reviewed sources, update history, and CSV downloads.
  - Verification: Added Scout/Command RLS read policies for active published economy records, a gated `/member/economy` route, protected CSV download routes, member/homepage entry points, and workflow documentation. `npm run build:next` passed and registered `/member/economy` plus `/member/economy/downloads/[kind]`; `npm run build` passed for the legacy Vite site; `git diff --check` passed with only existing LF-to-CRLF warnings. Local route checks on the existing `http://127.0.0.1:3001` Next dev server confirmed `/member/economy` renders the no-config paid-data gate and `/member/economy/downloads/scenarios` returns `503` without Supabase configuration. Project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about the wrong project. `npm run lint` could not run because the repo has no ESLint configuration file. `npx supabase migration list --local` could not run because no local Supabase Postgres was listening on `127.0.0.1:54322`. Live Scout/Command data reads could not be exercised because no Supabase publishable key, applied reachable schema, or seeded paid test user was available.
  - Blocked reason: None.

- [x] Task 034: Create data request, data offer, extraction run, and audit log schema
  - Priority: P0
  - Goal: Store the data marketplace and its automated extraction history.
  - Acceptance criteria: Schema supports data requests, data offers, source documents, extraction runs, confidence labels, rationales, and audit logs.
  - Non-technical summary: The database now has a foundation for a Scout+ data marketplace, including data requests, data offers, reviewed sources, extraction job history, citations, confidence labels, rationale fields, and audit logs.
  - Verification: Added `supabase/migrations/20260626193529_data_marketplace_extraction_schema.sql` with marketplace enums, data request/offer tables, source documents, request/offer citation joins, extraction runs, audit logs, indexes, triggers, grants, and RLS policies; added schema documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed; static search confirmed required tables, RLS enablement, policies, grants, source/citation joins, confidence labels, and audit logs are present. Project-ref search found the correct `xlpkdoeldtlhearqajat` reference in the new doc and no wrong project reference in the new migration/doc. `npm run lint` could not run because the repo has no ESLint configuration file. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not run because no local Supabase Postgres was listening on `127.0.0.1:54322`; remote application was not run because authenticated Supabase database access is unavailable in this session.
  - Blocked reason: None.

- [x] Task 035: Implement automated data-market extraction pipeline placeholder with confidence labels and citations
  - Priority: P1
  - Goal: Establish the pipeline structure for extracting data requests/offers from news and scholarly sources.
  - Acceptance criteria: Placeholder or initial pipeline can create draft/published marketplace records with citations, confidence labels, extraction rationale, and audit trace.
  - Non-technical summary: A dry-run-first extraction pipeline placeholder now turns reviewed source notes into draft or publish-ready marketplace requests and offers with citations, confidence labels, rationale, and audit records.
  - Verification: Added `npm run extract:data-marketplace`, a local placeholder extraction script, sample input, and workflow documentation. Dry run generated one extraction run, one source document, one data request, one data offer, confidence labels, extraction rationales, and source-linked payloads without writing to Supabase. Publish-mode dry run confirmed planned records switch to approved/open/available states. `node --check scripts/data-market-extraction-placeholder.mjs` passed; `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with only existing LF-to-CRLF warnings. Apply-mode wrong-project verification with `https://nwoluvjdojzayozyzlob.supabase.co` failed before any write with the expected canonical-project error for `xlpkdoeldtlhearqajat`. Live apply-mode writes were not run because no Supabase service key or reachable applied schema was available in this session.
  - Blocked reason: None.

- [x] Task 036: Build Scout+ data marketplace UI for requests and offers
  - Priority: P1
  - Goal: Let paid members browse data requests and offers.
  - Acceptance criteria: Scout+ users can view request/offer lists, details, sources, confidence labels, locations, instruments, and mission metadata.
  - Non-technical summary: Scout and Command users now have a protected data marketplace page for approved requests and offers with mission context, location and instrument fields, confidence labels, analyst rationale, and source evidence.
  - Verification: Added `/member/marketplace`, a Scout/Command/staff access guard, a live Supabase data loader for approved marketplace requests/offers/source evidence, a member workspace link, and workflow documentation. `npm run build:next` passed and registered `/member/marketplace`; `npm run build` passed for the legacy Vite site; `git diff --check` passed with the recurring LF-to-CRLF warning on a touched file. Project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about the wrong project. Browser QA on `http://127.0.0.1:3001/member/marketplace` confirmed the no-config paid-data gate, page title, no framework overlay, no console errors, `/apply` navigation, and no mobile horizontal overflow at `390x844`. Browser screenshot capture timed out, so production-mode screenshot evidence was captured with bundled Playwright against `http://127.0.0.1:3010/member/marketplace` at `1280x720` and `390x844`; both had no console errors, no framework overlay, and no horizontal overflow. `npm run lint` still cannot run because the repo has no ESLint configuration file. Live Scout/Command marketplace reads were not exercised because no Supabase publishable key, applied reachable schema, or seeded paid test user was available.
  - Blocked reason: None.

- [x] Task 037: Create dataset catalog with public NASA/science data and Potomac proprietary entries
  - Priority: P1
  - Goal: Show available and upcoming datasets in one catalog.
  - Acceptance criteria: Catalog supports public datasets, Potomac proprietary datasets, source metadata, availability state, tier requirement, and sample/demo indicators.
  - Non-technical summary: The site now has a dataset catalog for public lunar science archives and Potomac proprietary previews, including availability, access tier, source, sample, and demo details.
  - Verification: Added `supabase/migrations/20260629130558_dataset_catalog.sql` with dataset catalog enums, entries, source metadata, sample/demo fields, tier requirements, availability states, seed records, explicit grants, and RLS policies; added `/datasets`, a live Supabase/fallback catalog loader, sitemap/nav/current-route entries, DataCatalog/Dataset structured metadata, and catalog documentation. Static migration checks confirmed catalog entry/source tables, public science and Potomac proprietary kinds, availability, tier, sample/demo, source metadata, RLS, explicit grants, and seed records are present. `npm run build:next` passed and registered `/datasets`; `npm run build` passed for the legacy Vite site; `git diff --check` passed. Project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about the wrong project. Browser QA on `http://127.0.0.1:3001/datasets` confirmed fallback catalog content, DataCatalog/Dataset JSON-LD, sample/source/marketplace links, no framework overlay, no console errors, and no horizontal overflow at desktop or `390x844` mobile after tightening header nav spacing. Browser screenshot capture remains unreliable, so production-mode screenshot evidence was captured with bundled Playwright against `http://127.0.0.1:3010/datasets` at `1280x720` and `390x844`; both had no console errors, no framework overlay, and no horizontal overflow. `npm run lint` still cannot run because the repo has no ESLint configuration file. Live Supabase catalog reads and migration application were not exercised because no Supabase publishable key, applied reachable schema, local Postgres, or authenticated database tooling was available.
  - Blocked reason: None.

- [x] Task 038: Add tier-based dataset release states and one-year exclusivity logic
  - Priority: P1
  - Goal: Enforce release timing by membership tier.
  - Acceptance criteria: Command-exclusive, Scout-delayed, public/demo, and unavailable states are represented; one-year exclusivity timing is calculated and visible to authorized users.
  - Non-technical summary: Dataset catalog entries now show whether data is Command-exclusive, Scout-delayed, public/demo, or unavailable, including one-year exclusivity timing where applicable.
  - Verification: Added `supabase/migrations/20260629131559_dataset_release_states.sql` with release-state enum values for Command-exclusive, Scout-delayed, public/demo, and unavailable records; added exclusivity, Scout release, public release, release note, and unavailable-reason fields; added one-year Command exclusivity and unavailable-reason constraints; updated catalog seed records and added the near-real-time polar volatiles unavailable placeholder. Updated the `/datasets` loader and fallback records to include release-state fields, and the catalog UI now renders release-state labels, exclusivity windows, Scout/public release dates, unavailable reasons, release notes, and calculated days remaining for Command-exclusive records. Static migration checks confirmed all four states, release columns, one-year constraint, unavailable-reason constraint, release index, and seeded state coverage. `npm run build:next` passed; `npm run build` passed; project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about the wrong project. Browser QA on `http://127.0.0.1:3001/datasets` confirmed all four release states, the `Jun 29, 2026 - Jun 29, 2027` one-year window, calculated days remaining, the unavailable placeholder and reason, no framework overlay, no console errors, and no horizontal overflow at desktop or `390x844` mobile. Browser screenshot capture remains unreliable, so production-mode screenshot evidence was captured with bundled Playwright against `http://127.0.0.1:3010/datasets` at `1280x720` and `390x844`; both had no console errors, no framework overlay, and no horizontal overflow. `npm run lint` still cannot run because the repo has no ESLint configuration file. Live Supabase release-state reads and migration application were not exercised because no Supabase publishable key, applied reachable schema, local Postgres, or authenticated database tooling was available.
  - Blocked reason: None.

- [x] Task 039: Add Nexus dashboard card with entitlement status and SSO/deep-link placeholder
  - Priority: P1
  - Goal: Connect the member dashboard to the existing Nexus experience.
  - Acceptance criteria: Dashboard card shows Nexus access status and a safe SSO/deep-link placeholder to `nexus-explore.potomacdb.com`.
  - Non-technical summary: The member workspace now shows Nexus access status and a safe placeholder link for Scout, Command, and staff users.
  - Verification: Added a `/member` Nexus access card that checks active normalized roles and user-scoped active entitlements, shows role/entitlement status, and renders `https://nexus-explore.potomacdb.com` as a placeholder link for Scout, Command, and staff roles without appending any SSO token or session material. Added workflow documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files. Static checks confirmed the Nexus card, status loader, placeholder domain, and SSO-safety documentation are present. Project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about the wrong project. Local `/member` route rendering could not exercise the signed-in card because the existing dev server has no Supabase public configuration and returns the pre-existing missing-config server error for `/member`; live signed-in Nexus status reads were not exercised because no Supabase publishable key, applied reachable schema, or seeded Scout/Command test user was available.
  - Blocked reason: None.

- [x] Task 040: Add NASA and large-space-company job alerts schema and dashboard module
  - Priority: P2
  - Goal: Provide useful job alerts for space-sector roles.
  - Acceptance criteria: Schema and dashboard module support employer, role, location, source URL, posting date, and freshness indicators.
  - Non-technical summary: Members now have a dashboard job-alert card for NASA and major space-company hiring sources, backed by a curated Supabase schema with source links, posting dates, locations, and freshness labels.
  - Verification: Added `supabase/migrations/20260629220305_job_alerts_schema.sql` with job-alert enums, `space_sector_job_alerts`, employer/role/location/source/posting-date/freshness fields, seed alerts for official NASA, SpaceX, Blue Origin, and Lockheed Martin career sources, explicit authenticated grants, RLS, and staff manage policies. Added `/member` job-alert rendering plus a safe fallback loader and documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with the recurring LF-to-CRLF warning on `next-app/app/member/page.tsx`; static checks confirmed required schema fields, RLS/grants, loader, UI card, and source labels. Project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about `nwoluvjdojzayozyzlob`. `npm run lint` still cannot run because the repo has no ESLint configuration file. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`. Live member reads were not exercised because no Supabase publishable key, applied reachable schema, or signed-in member test account was available.
  - Blocked reason: None.

- [x] Task 041: Add space weather source schema and dashboard module
  - Priority: P2
  - Goal: Surface space-weather context inside the dashboard.
  - Acceptance criteria: Schema and dashboard module include source attribution, update timestamp, key metrics, and graceful stale-data states.
  - Non-technical summary: Members now have a dashboard space-weather card that shows official NOAA/NASA source conditions, update times, compact metrics, attribution, and current/stale labels.
  - Verification: Added `supabase/migrations/20260629220633_space_weather_sources.sql` with space-weather freshness/publication enums, `space_weather_source_snapshots`, source attribution, source update/retrieval timestamps, stale-after thresholds, risk labels, JSON key metrics, official NOAA SWPC and NASA DONKI seed snapshots, explicit authenticated grants, RLS, and staff manage policies. Added `/member` space-weather rendering plus a safe fallback loader and documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with the recurring LF-to-CRLF warning on `next-app/app/member/page.tsx`; static checks confirmed required source fields, update timestamps, key metrics, freshness states, RLS/grants, loader, UI card, and source labels. Current source pages checked included NOAA SWPC current conditions, Planetary K-index, Real-Time Solar Wind, Alerts/Watches/Warnings, and NASA CCMC DONKI. Project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about `nwoluvjdojzayozyzlob`. `npm run lint` still cannot run because the repo has no ESLint configuration file. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`. Live member reads were not exercised because no Supabase publishable key, applied reachable schema, or signed-in member test account was available.
  - Blocked reason: None.

- [x] Task 042: Add CSV/XLSX upload flow for Scout/Command experimental test data
  - Priority: P1
  - Goal: Let paid members upload Earth test data for comparison.
  - Acceptance criteria: Scout/Command users can upload CSV/XLSX files, files are stored securely, validation errors are shown clearly, and unauthorized users are blocked.
  - Non-technical summary: Scout and Command members now have a protected test-data upload page for CSV/XLSX files, with private storage, clear validation messages, and locked access for unpaid or signed-out users.
  - Verification: Added `supabase/migrations/20260630030304_experimental_test_data_uploads.sql` with a private `experimental-test-data` Storage bucket, upload metadata table, explicit grants, RLS policies, owner/org/staff read rules, and paid-role upload policies. Added `/member/test-data`, a server-side paid access guard, an upload API route with CSV/XLSX extension, MIME, size, and empty-file validation, recent upload history, member workspace navigation, and workflow documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with the recurring LF-to-CRLF warning on `next-app/app/member/page.tsx`; local production render check on `http://127.0.0.1:3011/member/test-data` returned `200` and showed the expected no-config Supabase gate. Static search confirmed the private bucket/table, validation copy, and correct `xlpkdoeldtlhearqajat` project references while only existing docs warn against `nwoluvjdojzayozyzlob`. `npm run lint` still cannot run because the repo has no ESLint configuration file. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`. Live file uploads were not exercised because no Supabase publishable key, applied reachable schema, Storage bucket, or signed-in Scout/Command test user was available.
  - Blocked reason: None.

- [x] Task 043: Add comparison dashboard for Earth test data vs approved lunar/public datasets
  - Priority: P1
  - Goal: Help users compare their experimental data against lunar or public reference datasets.
  - Acceptance criteria: Dashboard can select uploaded test data and approved datasets, run a comparison, and display results with clear assumptions/limitations.
  - Non-technical summary: Paid members can now select an uploaded Earth test file and an approved reference dataset, save a preliminary comparison, and see the assumptions and limitations clearly.
  - Verification: Added `supabase/migrations/20260630030735_experimental_test_data_comparisons.sql` with comparison status enum, comparison result table, explicit grants, RLS policies, owner/staff read rules, paid-role insert rules, upload ownership checks, and approved dataset checks. Added `/api/member/test-data/comparisons`, a comparison form on `/member/test-data`, reference dataset selection, recent comparison history, result summaries, compatibility scores, assumptions, and visible limitations that state row parsing/unit normalization/statistical fit are not implemented yet. Updated workflow documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files; local production render check on `http://127.0.0.1:3012/member/test-data` returned `200` and showed the expected no-config Supabase gate. Static search confirmed comparison table/API/UI strings and correct `xlpkdoeldtlhearqajat` project references while only existing docs warn against `nwoluvjdojzayozyzlob`. `npm run lint` still cannot run because the repo has no ESLint configuration file. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`. Live comparisons were not exercised because no Supabase publishable key, applied reachable schema, Storage bucket, uploaded test file, approved dataset records, or signed-in Scout/Command test user was available.
  - Blocked reason: None.

- [x] Task 044: Add Command-only real-time/near-real-time intelligence access model
  - Priority: P0
  - Goal: Represent Command-exclusive intelligence access for newly collected lunar data.
  - Acceptance criteria: Data model and access rules support one Command user receiving real-time or near-real-time intelligence exclusive for at least one year after collection.
  - Non-technical summary: Command-exclusive lunar intelligence can now be allocated to one Command user with real-time or near-real-time access for a required one-year exclusivity window.
  - Verification: Added `supabase/migrations/20260630031059_command_exclusive_intelligence_access.sql` with real-time/near-real-time access modes, allocation statuses, `command_intelligence_allocations`, collection and exclusive-access timestamps, one-year exclusivity constraints, one active allocation per dataset, allocated-user role checks, Command-exclusive dataset checks, explicit grants, and RLS policies for allocated users, organization admins, analysts, and admins. Added workflow documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed; static checks confirmed the allocation table, one-active-dataset index, one-year constraint, allocated Command-user role check, and split insert/update/delete policies. Project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing documentation warnings about `nwoluvjdojzayozyzlob`. `npm run lint` still cannot run because the repo has no ESLint configuration file. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`. Live allocation checks were not exercised because no Supabase publishable key, applied reachable schema, Command-exclusive dataset, seeded Command user, or authenticated database tooling was available.
  - Blocked reason: None.

- [x] Task 045: Add Command perks tracking for analyst support, proposal support, mission briefs, custom alerts, and sponsorship
  - Priority: P1
  - Goal: Track promised Command benefits and service delivery.
  - Acceptance criteria: Admin workflow tracks support requests, mission briefs, custom alerts, executive perks, free sponsorship, and fulfillment status.
  - Non-technical summary: Admins can now track Command customer benefits, due dates, fulfillment progress, blocked items, and sponsorship notes from the Command pipeline.
  - Verification: Added `supabase/migrations/20260630080208_command_perks_tracking.sql` with Command perk type/status/priority enums, `command_perk_commitments`, fulfillment fields, explicit grants, RLS policies for organization visibility and staff management, active Command entitlement checks, and admin-only deletion. Extended `/admin/command` with active Command organization selection, perk creation, perk update, fulfillment status, due/fulfilled dates, next steps, blocked reasons, sponsorship notes, and audit-event writes. Added workflow documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files; static search confirmed Command perk schema/UI/action coverage and correct `xlpkdoeldtlhearqajat` project references while only existing docs warn against `nwoluvjdojzayozyzlob`. `npm run lint` still cannot run because the repo has no ESLint configuration file. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`. Live perk creation/update verification was not exercised because no Supabase publishable key, applied reachable schema, active Command organization, or signed-in admin test user was available.
  - Blocked reason: None.

- [x] Task 046: Create member-to-member chat schema, RLS, moderation, and audit model
  - Priority: P1
  - Goal: Define the data model and access rules for safe direct chat between approved members.
  - Acceptance criteria: Schema supports conversations, participants, messages, read receipts, muted/blocked participants, report/moderation records, audit events, and RLS that limits access to approved participants and authorized staff.
  - Non-technical summary: Approved members now have a database foundation for safe direct chat with read state, muting, blocking, reporting, moderation, and audit records.
  - Verification: Added `supabase/migrations/20260630080656_member_chat_schema.sql` with chat conversations, participants, messages, read receipts, blocks, reports, moderation actions, audit events, enum states, indexes, updated-at triggers, explicit grants, private authorization helpers, and RLS policies for approved Explorer/Scout/Command participants plus analyst/admin moderation. Added workflow documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed; static search confirmed the required chat tables, block/report/moderation/audit tables, helper functions, RLS policies, and correct `xlpkdoeldtlhearqajat` project references while only existing docs warn against `nwoluvjdojzayozyzlob`. `npm run lint` still cannot run because the repo has no ESLint configuration file. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`. Live RLS behavior was not exercised because no Supabase publishable key, applied reachable schema, or seeded Explorer/Scout/Command/moderator test users were available.
  - Blocked reason: None.

- [x] Task 047: Build direct member-to-member chat UI and notification surfaces
  - Priority: P1
  - Goal: Let approved Members, Scout users, and Command users start and continue member-to-member conversations.
  - Acceptance criteria: Member dashboard includes chat inbox, conversation detail, compose/reply flow, unread indicators, privacy-constrained member discovery, report/block controls, and graceful empty/error states.
  - Non-technical summary: Approved members now have a protected chat workspace for direct conversations, replies, unread status, member discovery, reporting, and blocking.
  - Verification: Added `/member/chat`, server actions for starting conversations, replies, read receipts, reports, and blocks, a member dashboard link, workflow documentation, and `supabase/migrations/20260630130336_member_chat_profile_discovery.sql` for chat profile discovery plus conversation timestamp updates. `npm run build:next` passed and registered `/member/chat`; `npm run build` passed; `git diff --check` passed with the recurring LF-to-CRLF warning on `next-app/app/member/page.tsx`; static search confirmed chat UI/action/migration coverage and correct `xlpkdoeldtlhearqajat` project references while only existing docs warn against `nwoluvjdojzayozyzlob`. Browser QA against `http://127.0.0.1:3017/member/chat` confirmed the no-config member-chat gate, page title, no framework overlay, no console errors, `/apply` navigation, and no mobile horizontal overflow at `390x844`; Browser screenshot capture timed out with `Page.captureScreenshot`. `npm run lint` still cannot run because the repo has no ESLint configuration file. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`. Live compose/reply/report/block verification was not exercised because no Supabase publishable key, applied reachable schema, or seeded approved member test users were available.
  - Blocked reason: None.

- [x] Task 048: Add moderated member forum schema, RLS, and audit model
  - Priority: P1
  - Goal: Define the data model and access controls for member forums.
  - Acceptance criteria: Schema supports forums, topics, posts, replies, reactions or bookmarks, reports, moderation actions, retained audit events, and RLS for Explorer, Scout, Command, moderator, analyst, editor, and admin access.
  - Non-technical summary: The platform now has a database foundation for moderated member forums with tier-gated access, posts, replies, reports, moderation records, and audit history.
  - Verification: Added `supabase/migrations/20260630131146_member_forum_schema.sql` with forum, topic, post/reply, reaction, bookmark, report, moderation action, and audit-event tables; added forum enum states, a normalized `moderator` role, private tier/moderation helpers, explicit authenticated/service grants, and RLS policies for Explorer, Scout, Command, moderator, analyst, editor, and admin access. Added schema documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed; static search confirmed required forum tables, helpers, grants, RLS enablement, moderation policies, and retained audit records. `npm run lint` still cannot run because the repo has no ESLint configuration file. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`. Live RLS behavior was not exercised because no Supabase publishable key, applied reachable schema, or seeded Explorer/Scout/Command/moderator/staff test users were available.
  - Blocked reason: None.

- [x] Task 049: Build moderated member forum UI
  - Priority: P1
  - Goal: Let approved members discuss lunar markets, missions, datasets, procurement, regulatory issues, and events.
  - Acceptance criteria: Member dashboard includes forum index, topic list, topic detail, compose/reply flow, reporting controls, moderator states, empty/error states, and clear access messaging for public or unapproved users.
  - Non-technical summary: Approved members now have a protected forum workspace for browsing channels, opening discussion topics, replying, saving discussions, marking useful posts, and reporting content for moderation.
  - Verification: Added the `/member/forums` route, protected member-forum auth helpers, forum server actions, member dashboard navigation, and forum UI documentation. `npm run build:next` passed and registered `/member/forums`; `npm run build` passed; `git diff --check` passed with the existing line-ending warning for `next-app/app/member/page.tsx`; browser QA on `http://127.0.0.1:3018/member/forums` confirmed the Supabase access gate renders, the main `Apply for access` link navigates to `/apply`, desktop and mobile widths have no horizontal overflow, and no browser console warnings or errors were captured. `npm run lint` still cannot run because the repo has no ESLint configuration file. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was listening on `127.0.0.1:54322`. Live approved-member forum posting was not exercised because no Supabase publishable key, applied reachable schema, or seeded member/moderator users were available.
  - Blocked reason: None.

- [x] Task 050: Add RFQ schema, RLS, response workflow, moderation, and audit model
  - Priority: P1
  - Goal: Define the data model for Scout and Command RFQ workflows.
  - Acceptance criteria: Schema supports RFQ posts, organization attribution, categories, due dates, attachments or external links, response submissions, visibility controls, status changes, reports, moderation actions, and audit logs.
  - Non-technical summary: Scout and Command RFQs now have a database foundation for posting opportunities, inviting organizations, attaching links/files, receiving responses, tracking status changes, handling reports, moderating content, and preserving audit history.
  - Verification: Added `supabase/migrations/20260630180219_rfq_schema_rls_moderation.sql` with RFQ posts, invited organizations, RFQ/response resource links, responses, status events, reports, moderation actions, audit events, enum states, indexes, updated-at triggers, explicit grants, private authorization helpers, and RLS policies for Scout/Command users, organization admins, moderators, analysts, and admins. Added schema documentation. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed; static search confirmed the required RFQ tables, response workflow, visibility helpers, grants, RLS enablement, moderation policies, and retained audit records. Supabase guidance was checked against current RLS/API docs and the 2026 breaking change that new tables may not be exposed to Data/GraphQL APIs automatically. `npm run lint` still cannot run because the repo has no ESLint configuration file. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was reachable. Live RLS behavior was not exercised because no Supabase publishable key, applied reachable schema, or seeded Scout/Command/organization-admin/moderator/staff test users were available.
  - Blocked reason: None.

- [x] Task 051: Build Scout/Command RFQ posting, browsing, and response UI
  - Priority: P1
  - Goal: Let Scout and Command members post, browse, and respond to lunar industry RFQs.
  - Acceptance criteria: Dashboard includes RFQ list, filters, detail page, post form, response form, organization-aware permissions, moderation/report actions, and graceful states for members without access.
  - Non-technical summary: Scout and Command members now have a protected RFQ workspace for viewing opportunities, posting requests, submitting responses, updating statuses, and reporting items for moderation.
  - Verification: Added `/member/rfqs`, RFQ access helpers, server actions for RFQ creation, status updates, response submission, and reporting, plus a member dashboard link and workflow documentation. `npm run build:next` passed and registered `/member/rfqs`; `npm run build` passed; `git diff --check` passed with the recurring LF-to-CRLF warning on `next-app/app/member/page.tsx`; static search confirmed RFQ route/action/auth coverage. Browser QA used local Microsoft Edge through Playwright because the in-app Browser tool was unavailable and bundled Playwright Chromium was not installed; `http://127.0.0.1:3020/member/rfqs` returned `200`, rendered the no-config Supabase gate with RFQ workspace copy, had no framework overlay, no console errors, `/apply` navigation, and no horizontal overflow at desktop `1280x720` or mobile `390x844`. `npm run lint` still cannot run because the repo has no ESLint configuration file. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was reachable. Live RFQ posting, browsing, response, organization attribution, moderation, and report verification was not exercised because no Supabase publishable key, applied reachable RFQ schema, or seeded Scout/Command/organization-admin/moderator test users were available.
  - Blocked reason: None.

- [x] Task 052: Document Explorer, Scout, and Command tier packaging and gates
  - Priority: P0
  - Goal: Align the product model with Explorer as the free approved base membership, Scout as the professional paid tier, and Command as the enterprise tier.
  - Acceptance criteria: Documentation and access-control notes define tier names, pricing/approval model, limits, included features, upgrade paths, and legacy Member terminology handling.
  - Non-technical summary: The Explorer, Scout, and Command packaging model is now documented in one place, including who each tier is for, how access is granted, what each tier includes, and how the older Member terminology should be used.
  - Verification: Added `docs/tier-packaging-and-gates.md` with tier names, internal role mappings, free/manual/self-serve billing model, `$25,000/user/year` Scout pricing, Command sales-led approval, included features, initial limits, upgrade paths, access-control notes, and legacy Member terminology guidance. Updated `docs/member-access-schema.md` to link the schema model back to the canonical tier packaging doc. `git diff --check` passed with the recurring LF-to-CRLF warning on `docs/member-access-schema.md`; static search confirmed Explorer, Scout, Command, pricing, upgrade path, access-control, and legacy terminology coverage. No app build was run because this was documentation-only.
  - Blocked reason: None.

- [x] Task 053: Build Explorer/Scout/Command pricing and upgrade entry points
  - Priority: P1
  - Goal: Make tier differences and upgrade paths clear to prospects and approved members.
  - Acceptance criteria: Public pricing or membership page explains Explorer, Scout, and Command; member dashboard surfaces relevant upgrade CTAs; Scout checkout and Command interest paths remain connected.
  - Non-technical summary: Prospects and approved members now have a public pricing page and dashboard entry point that explain Explorer, Scout, and Command access and route users to the right application, checkout, or sales path.
  - Verification: Added `/pricing`, public and member navigation links, homepage CTA, sitemap coverage, metadata/JSON-LD, and `docs/pricing-upgrade-entry-points.md`. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files; `npm run lint` still cannot run because the repo has no ESLint configuration file. Browser QA used local Microsoft Edge through Playwright CLI because the in-app Browser setup timed out and the Playwright test runner was not installed in the repo; desktop `1280x720` and mobile `390x844` screenshots of `/pricing` rendered the tier page without visible first-viewport overflow. Local route checks confirmed `/pricing`, `/apply`, `/command`, and `/sitemap.xml` return `200`, `/pricing` includes the Explorer/Scout/Command headline, `$25,000` Scout price, `/apply`, `/member`, `/command` links, JSON-LD, and sitemap inclusion. Live Scout checkout and `/member` workspace verification could not be exercised because the dev server has no `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
  - Blocked reason: None.

- [x] Task 054: Build lunar industry terminal navigation and dashboard shell
  - Priority: P0
  - Goal: Organize the platform as a lunar industry terminal rather than a generic space site.
  - Acceptance criteria: Navigation and dashboard shell expose lunar news, launches, spacecraft/landers, procurement, regulatory, companies, economy, datasets, marketplace, events, calculators, alerts, and account areas with responsive behavior.
  - Non-technical summary: The site now presents Potomac as a lunar industry terminal, with public navigation and dashboard cards for news, missions, markets, datasets, events, calculators, alerts, and account paths.
  - Verification: Added a shared terminal module map, responsive global terminal navigation, `/terminal`, lightweight route shells for launches, spacecraft/landers, procurement, regulatory, companies, calculators, alerts, and account, a member dashboard terminal map, sitemap entries, and `docs/lunar-terminal-navigation-shell.md`. `npm run build:next` passed and registered the new routes; `npm run build` passed; `git diff --check` passed with recurring LF-to-CRLF warnings on touched files; `npm run lint` still cannot run because the repo has no ESLint configuration file. Browser QA used local Microsoft Edge through Playwright CLI because the in-app Browser setup timed out earlier in the run; desktop `1280x720` and mobile `390x844` screenshots of `/terminal` rendered the terminal shell and responsive navigation. Local route checks confirmed `/terminal`, `/launches`, `/spacecraft`, `/procurement`, `/regulatory`, `/companies`, `/calculators`, `/alerts`, and `/account` return `200`; sitemap checks confirmed each new public shell route is included. Live member workspace verification could not be exercised because the dev server has no `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
  - Blocked reason: None.

- [x] Task 055: Add lunar launch, spacecraft, lander, payload, and satellite tracker schema
  - Priority: P1
  - Goal: Store lunar mission object tracking data with source-backed status.
  - Acceptance criteria: Schema supports lunar launches, spacecraft, landers, payloads, lunar satellites, operators, mission phases, launch windows, landing sites, instruments, status, timestamps, freshness, and source citations.
  - Non-technical summary: The database now has a planned structure for tracking lunar missions, operators, launches, spacecraft, landers, satellites, payloads, instruments, status history, landing sites, freshness, and source citations.
  - Verification: Created `supabase/migrations/20260630231101_lunar_mission_object_tracking.sql` with operator, mission, mission-object, launch-window, landing-site, payload/instrument, status-event, and source-citation tables; added mission/object/status/visibility/confidence/source-review enums, timestamps, freshness fields, source review fields, explicit grants, RLS enablement, and public/member/Scout/Command/staff access policies using normalized roles. Added `docs/lunar-mission-object-tracking-schema.md`. Supabase guidance was checked against the current RLS/API docs and the 2026 changelog note that new public tables may not be exposed to Data/GraphQL APIs automatically. `npm run build:next` passed; `npm run build` passed; `git diff --check` passed; static search confirmed required tracking tables, object/phase enums, freshness, grants, RLS, helper function, and policies are present; project-ref search found only the correct `xlpkdoeldtlhearqajat` references and existing docs that warn against the wrong project. `npm run lint` still cannot run because the repo has no ESLint configuration file. `npx supabase migration list --local --workdir "C:\Users\JacobMatthews\Documents\Potomac Website"` could not connect because no local Supabase Postgres was reachable. Live migration application and RLS behavior were not exercised because no Supabase publishable key, applied reachable schema, authenticated database tooling, or seeded public/Explorer/Scout/Command/staff test users were available.
  - Blocked reason: None.

- [ ] Task 056: Build lunar launch, spacecraft, lander, and satellite tracker modules
  - Priority: P1
  - Goal: Let members track lunar missions and objects in the terminal.
  - Acceptance criteria: Dashboard modules show upcoming launches, active spacecraft/landers/satellites, mission status, source freshness, filters, detail pages, and gated detail levels by tier.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 057: Add lunar procurement and regulatory intelligence schema
  - Priority: P1
  - Goal: Store lunar-relevant procurement and regulatory records.
  - Acceptance criteria: Schema supports procurements, awards, SBIR/STTR items, regulatory filings, comment periods, policy milestones, compliance notes, agencies, due dates, source URLs, confidence labels, and analyst review state.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 058: Build lunar procurement and regulatory hub UI
  - Priority: P1
  - Goal: Give Scout and Command members a practical hub for lunar opportunities and policy risk.
  - Acceptance criteria: Hub includes searchable/filterable procurement and regulatory lists, detail pages, due-date/status indicators, citations, watchlist hooks, and upgrade prompts for users without access.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 059: Create lunar company profile and comparison schema
  - Priority: P1
  - Goal: Store profiles for companies participating in the lunar industry.
  - Acceptance criteria: Schema supports company sectors, programs, contracts, facilities, leadership, public financials or licensed financial fields, news links, relationships, source citations, and comparison attributes.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 060: Build lunar company directory, profile, and comparison UI
  - Priority: P1
  - Goal: Let members discover, inspect, and compare lunar companies.
  - Acceptance criteria: UI includes searchable directory, company profile pages, comparison table, source/freshness labels, public teaser behavior, and Scout/Command detail gates where appropriate.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 061: Add lunar mission calculator framework
  - Priority: P1
  - Goal: Establish a reusable structure for lunar mission planning calculators.
  - Acceptance criteria: Framework supports named calculators, assumptions, formulas, source citations, units, confidence notes, version history, input validation, saved runs, and tier-based access.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 062: Build initial lunar mission calculators
  - Priority: P1
  - Goal: Provide practical calculators for lunar mission planning workflows.
  - Acceptance criteria: Initial calculators cover lunar mission cost, launch window assumptions, RF link budget, thermal budget, radiation exposure, and power budget with clear limitations and citations.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 063: Add global search, command palette, and related intelligence index
  - Priority: P0
  - Goal: Let members quickly find content and jump across the terminal.
  - Acceptance criteria: Search/index model covers articles, events, companies, lunar missions, datasets, data requests/offers, jobs, procurements, regulatory records, methodology sources, and dashboard modules; command palette supports keyboard navigation and admin-pinned results.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 064: Build global search and command palette UI
  - Priority: P1
  - Goal: Make search and fast navigation usable from public and member surfaces.
  - Acceptance criteria: UI includes search page, scoped filters, result snippets, source/tier labels, no-result states, keyboard-accessible command palette, and entitlement-aware result visibility.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 065: Add watchlists, saved searches, reading list, and preference schema
  - Priority: P1
  - Goal: Store user-specific monitoring and saved-work preferences.
  - Acceptance criteria: Schema supports watched companies, missions, procurements, regulatory records, events, datasets, marketplace records, saved searches, reading-list items, notification preferences, dashboard defaults, and audit-safe ownership.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 066: Build watchlists, saved searches, reading list, and preference UI
  - Priority: P1
  - Goal: Let Scout and Command members personalize what they monitor.
  - Acceptance criteria: Dashboard includes watchlist controls, saved search creation, reading-list save/remove actions, notification settings, dashboard defaults, and graceful states for unsupported objects or lower tiers.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 067: Add alerts center, email notifications, in-app notifications, and freshness indicators
  - Priority: P1
  - Goal: Notify members about changes to watched lunar intelligence and important platform events.
  - Acceptance criteria: System supports alert rules, alert feed, unread badges, email delivery hooks, notification preferences, stale-data indicators, delivery audit logs, and tier-aware limits for Explorer, Scout, and Command.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 068: Add data source registry, license review, freshness, and quality scoring
  - Priority: P0
  - Goal: Build the trust layer for source-backed lunar intelligence.
  - Acceptance criteria: Schema/admin workflow tracks source owner, URL, license/terms review, refresh frequency, parser/job, health, freshness, citation requirements, quality score, confidence label, and analyst review state.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 069: Add reusable table, chart, and export framework for intelligence modules
  - Priority: P0
  - Goal: Standardize how data-heavy modules display, cite, filter, and export information.
  - Acceptance criteria: Framework supports filtering, sorting, pagination, column picker, source columns, freshness labels, confidence labels, chart tooltips, data-table fallback, CSV/PDF export where entitled, and responsive behavior.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 070: Add Scout/Command API, exports, webhooks, and developer portal scaffold
  - Priority: P1
  - Goal: Provide paid workflow infrastructure for Scout and Command users.
  - Acceptance criteria: Scaffold includes API key model, endpoint catalog, quota fields, usage logs, webhook subscriptions, export jobs, developer documentation route, and tier-aware access controls.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 071: Add legal, trust, account lifecycle, and consent surfaces
  - Priority: P0
  - Goal: Support membership, ads, analytics, uploads, and paid tiers with baseline public trust pages and controls.
  - Acceptance criteria: Public/member surfaces include Terms, Privacy, Cookies, Accessibility, Data Safety, account deletion request flow, cookie preference controls, and clear support/contact paths.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 072: Add security, accessibility, analytics, observability, and performance baseline
  - Priority: P0
  - Goal: Define and verify non-functional requirements for a production-ready intelligence platform.
  - Acceptance criteria: Implementation includes security headers, rate limiting or documented controls, input validation, CSRF/session protections where applicable, accessibility checks, analytics events, logs/metrics/traces hooks, performance budgets, and documented error/empty/stale/offline states.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 073: Add automated tests for auth, RBAC, article gating, billing, member chat, forums, RFQs, lunar terminal modules, and RLS
  - Priority: P0
  - Goal: Cover critical security and access-control behavior with tests.
  - Acceptance criteria: Automated tests exercise login/session behavior, membership gating, role restrictions, billing entitlement updates, direct chat/forum/RFQ access and moderation rules, lunar terminal module gates, exports/API gates, and RLS expectations.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 074: Add end-to-end tests for public teaser, Explorer article unlock, Scout dashboard, chat/forums/RFQs, and Command admin flows
  - Priority: P1
  - Goal: Validate the main user journeys from browser-level behavior.
  - Acceptance criteria: E2E tests cover public article teaser, Explorer full article access, Scout dashboard access, direct chat inbox/conversation flows, forum posting, RFQ browsing/responding, lunar terminal navigation, and Command/admin workflows.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 075: Run build, lint, tests, and document remaining gaps
  - Priority: P0
  - Goal: Verify the implementation and capture any remaining gaps.
  - Acceptance criteria: Build, lint, and available tests are run; results are recorded; remaining gaps or skipped checks are documented clearly.
  - Non-technical summary:
  - Verification:
  - Blocked reason:
