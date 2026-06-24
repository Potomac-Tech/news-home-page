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

- [ ] Task 025: Create public company universe and dynamic top-20 space company ranking
  - Priority: P1
  - Goal: Maintain a ranked list of publicly traded space companies for ticker display.
  - Acceptance criteria: Admin-maintained eligible company universe exists; ranking logic selects top 20 by the chosen metric and records ranking date/source.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 026: Add curated/delayed stock quote ingestion and ticker UI
  - Priority: P1
  - Goal: Show stock data without requiring real-time licensing in MVP.
  - Acceptance criteria: Quote records include source, delay/freshness timestamp, price, change, and ticker display on public/dashboard surfaces.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 027: Create commodity asset and proxy-pricing model schema
  - Priority: P1
  - Goal: Store lunar-resource commodity prices and proxy assumptions.
  - Acceptance criteria: Schema supports commodities, units, proxy formulas, source citations, confidence labels, and update cadence.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 028: Add 20 lunar-resource commodity ticker entries with citations and confidence labels
  - Priority: P1
  - Goal: Seed or configure the commodity ticker with lunar-resource-relevant entries.
  - Acceptance criteria: 20 commodity entries exist with price/proxy source notes, confidence labels, units, and display-ready ticker fields.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 029: Create lunar economy model schema with assumptions, sources, versions, and daily estimates
  - Priority: P0
  - Goal: Store the analytical model behind the daily lunar economy tracker.
  - Acceptance criteria: Schema supports model versions, assumptions, source documents, scenario estimates, confidence scores, and daily output values.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 030: Implement Firefly benchmark using full NASA-paid cost basis
  - Priority: P0
  - Goal: Calculate the Firefly lunar surface data benchmark from the full NASA-paid cost, not only the data addendum.
  - Acceptance criteria: Benchmark includes original `~$100M` mission cost, `$10M` data addendum, `~$45M` PRISM contracts, citations, methodology notes, and versioned assumptions.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 031: Build analyst-facing economy methodology and source table UI
  - Priority: P1
  - Goal: Let analysts inspect and maintain lunar economy methodology inputs.
  - Acceptance criteria: Analyst view shows assumptions, formulas, citations, source tables, confidence labels, and methodology version history.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 032: Build public economy summary widget
  - Priority: P1
  - Goal: Show a simplified public version of the lunar economy tracker.
  - Acceptance criteria: Public widget displays headline estimate, date, scenario/range label, concise methodology note, and membership CTA for details.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 033: Build Scout/Command detailed economy dashboard
  - Priority: P1
  - Goal: Give paid members access to deeper lunar economy analysis.
  - Acceptance criteria: Dashboard shows detailed scenarios, source tables, assumptions, downloads, and update timestamps with Scout/Command access control.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 034: Create data request, data offer, extraction run, and audit log schema
  - Priority: P0
  - Goal: Store the data marketplace and its automated extraction history.
  - Acceptance criteria: Schema supports data requests, data offers, source documents, extraction runs, confidence labels, rationales, and audit logs.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 035: Implement automated data-market extraction pipeline placeholder with confidence labels and citations
  - Priority: P1
  - Goal: Establish the pipeline structure for extracting data requests/offers from news and scholarly sources.
  - Acceptance criteria: Placeholder or initial pipeline can create draft/published marketplace records with citations, confidence labels, extraction rationale, and audit trace.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 036: Build Scout+ data marketplace UI for requests and offers
  - Priority: P1
  - Goal: Let paid members browse data requests and offers.
  - Acceptance criteria: Scout+ users can view request/offer lists, details, sources, confidence labels, locations, instruments, and mission metadata.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 037: Create dataset catalog with public NASA/science data and Potomac proprietary entries
  - Priority: P1
  - Goal: Show available and upcoming datasets in one catalog.
  - Acceptance criteria: Catalog supports public datasets, Potomac proprietary datasets, source metadata, availability state, tier requirement, and sample/demo indicators.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 038: Add tier-based dataset release states and one-year exclusivity logic
  - Priority: P1
  - Goal: Enforce release timing by membership tier.
  - Acceptance criteria: Command-exclusive, Scout-delayed, public/demo, and unavailable states are represented; one-year exclusivity timing is calculated and visible to authorized users.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 039: Add Nexus dashboard card with entitlement status and SSO/deep-link placeholder
  - Priority: P1
  - Goal: Connect the member dashboard to the existing Nexus experience.
  - Acceptance criteria: Dashboard card shows Nexus access status and a safe SSO/deep-link placeholder to `nexus-explore.potomacdb.com`.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 040: Add NASA and large-space-company job alerts schema and dashboard module
  - Priority: P2
  - Goal: Provide useful job alerts for space-sector roles.
  - Acceptance criteria: Schema and dashboard module support employer, role, location, source URL, posting date, and freshness indicators.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 041: Add space weather source schema and dashboard module
  - Priority: P2
  - Goal: Surface space-weather context inside the dashboard.
  - Acceptance criteria: Schema and dashboard module include source attribution, update timestamp, key metrics, and graceful stale-data states.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 042: Add CSV/XLSX upload flow for Scout/Command experimental test data
  - Priority: P1
  - Goal: Let paid members upload Earth test data for comparison.
  - Acceptance criteria: Scout/Command users can upload CSV/XLSX files, files are stored securely, validation errors are shown clearly, and unauthorized users are blocked.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 043: Add comparison dashboard for Earth test data vs approved lunar/public datasets
  - Priority: P1
  - Goal: Help users compare their experimental data against lunar or public reference datasets.
  - Acceptance criteria: Dashboard can select uploaded test data and approved datasets, run a comparison, and display results with clear assumptions/limitations.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 044: Add Command-only real-time/near-real-time intelligence access model
  - Priority: P0
  - Goal: Represent Command-exclusive intelligence access for newly collected lunar data.
  - Acceptance criteria: Data model and access rules support one Command user receiving real-time or near-real-time intelligence exclusive for at least one year after collection.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 045: Add Command perks tracking for analyst support, proposal support, mission briefs, custom alerts, and sponsorship
  - Priority: P1
  - Goal: Track promised Command benefits and service delivery.
  - Acceptance criteria: Admin workflow tracks support requests, mission briefs, custom alerts, executive perks, free sponsorship, and fulfillment status.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 046: Create member-to-member chat schema, RLS, moderation, and audit model
  - Priority: P1
  - Goal: Define the data model and access rules for safe direct chat between approved members.
  - Acceptance criteria: Schema supports conversations, participants, messages, read receipts, muted/blocked participants, report/moderation records, audit events, and RLS that limits access to approved participants and authorized staff.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 047: Build direct member-to-member chat UI and notification surfaces
  - Priority: P1
  - Goal: Let approved Members, Scout users, and Command users start and continue member-to-member conversations.
  - Acceptance criteria: Member dashboard includes chat inbox, conversation detail, compose/reply flow, unread indicators, privacy-constrained member discovery, report/block controls, and graceful empty/error states.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 048: Add moderated member forum schema, RLS, and audit model
  - Priority: P1
  - Goal: Define the data model and access controls for member forums.
  - Acceptance criteria: Schema supports forums, topics, posts, replies, reactions or bookmarks, reports, moderation actions, retained audit events, and RLS for Explorer, Scout, Command, moderator, analyst, editor, and admin access.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 049: Build moderated member forum UI
  - Priority: P1
  - Goal: Let approved members discuss lunar markets, missions, datasets, procurement, regulatory issues, and events.
  - Acceptance criteria: Member dashboard includes forum index, topic list, topic detail, compose/reply flow, reporting controls, moderator states, empty/error states, and clear access messaging for public or unapproved users.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 050: Add RFQ schema, RLS, response workflow, moderation, and audit model
  - Priority: P1
  - Goal: Define the data model for Scout and Command RFQ workflows.
  - Acceptance criteria: Schema supports RFQ posts, organization attribution, categories, due dates, attachments or external links, response submissions, visibility controls, status changes, reports, moderation actions, and audit logs.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 051: Build Scout/Command RFQ posting, browsing, and response UI
  - Priority: P1
  - Goal: Let Scout and Command members post, browse, and respond to lunar industry RFQs.
  - Acceptance criteria: Dashboard includes RFQ list, filters, detail page, post form, response form, organization-aware permissions, moderation/report actions, and graceful states for members without access.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 052: Document Explorer, Scout, and Command tier packaging and gates
  - Priority: P0
  - Goal: Align the product model with Explorer as the free approved base membership, Scout as the professional paid tier, and Command as the enterprise tier.
  - Acceptance criteria: Documentation and access-control notes define tier names, pricing/approval model, limits, included features, upgrade paths, and legacy Member terminology handling.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 053: Build Explorer/Scout/Command pricing and upgrade entry points
  - Priority: P1
  - Goal: Make tier differences and upgrade paths clear to prospects and approved members.
  - Acceptance criteria: Public pricing or membership page explains Explorer, Scout, and Command; member dashboard surfaces relevant upgrade CTAs; Scout checkout and Command interest paths remain connected.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 054: Build lunar industry terminal navigation and dashboard shell
  - Priority: P0
  - Goal: Organize the platform as a lunar industry terminal rather than a generic space site.
  - Acceptance criteria: Navigation and dashboard shell expose lunar news, launches, spacecraft/landers, procurement, regulatory, companies, economy, datasets, marketplace, events, calculators, alerts, and account areas with responsive behavior.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 055: Add lunar launch, spacecraft, lander, payload, and satellite tracker schema
  - Priority: P1
  - Goal: Store lunar mission object tracking data with source-backed status.
  - Acceptance criteria: Schema supports lunar launches, spacecraft, landers, payloads, lunar satellites, operators, mission phases, launch windows, landing sites, instruments, status, timestamps, freshness, and source citations.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

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
