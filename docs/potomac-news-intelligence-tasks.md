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

- [ ] Task 013: Add Command interest form and manual sales/admin workflow
  - Priority: P0
  - Goal: Capture enterprise Command interest without self-serve purchase.
  - Acceptance criteria: Command interest form stores requests, notifies/admin-surfaces leads, and supports manual entitlement grants after offline approval.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 014: Build organization admin portal for seats, members, entitlements, and billing contacts
  - Priority: P0
  - Goal: Give organization admins a place to manage their organization.
  - Acceptance criteria: Org admins can view organization details, members, seats, entitlements, and billing contacts within their permitted scope.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 015: Create editorial CMS schema for articles, authors, tags, versions, citations, and SEO metadata
  - Priority: P0
  - Goal: Store editorial content with public teaser and gated full-body support.
  - Acceptance criteria: CMS schema supports articles, authors, tags, versions, citations, SEO/AEO fields, teaser content, gated body, and publish states.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 016: Build editor workflow for draft, preview, publish, and gated body content
  - Priority: P0
  - Goal: Let editors manage news stories without code changes.
  - Acceptance criteria: Editors can create drafts, preview public/gated content, publish stories, and update gated bodies safely.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 017: Build public news-first homepage with headline feed, snippets, event teasers, tickers, and sponsor slots
  - Priority: P0
  - Goal: Make the homepage function as the public front door for the news/intelligence site.
  - Acceptance criteria: Homepage displays featured and latest stories, short snippets, event teasers, market modules, sponsor slots, and membership CTAs.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 018: Build article page with rich public teaser and gated full story
  - Priority: P0
  - Goal: Balance SEO/AEO visibility with membership gating.
  - Acceptance criteria: Public visitors see headline, summary, key bullets, intro, citations, and signup prompts; approved Members can read the full article.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 019: Add schema.org metadata, canonical URLs, sitemap, and robots configuration
  - Priority: P0
  - Goal: Improve search and answer-engine discoverability for public pages.
  - Acceptance criteria: Public routes include relevant structured data, canonical URLs, sitemap coverage, and robots configuration that does not expose gated content improperly.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 020: Add Substack, podcast, LinkedIn, and X link modules
  - Priority: P1
  - Goal: Make Potomac's external channels easy to find.
  - Acceptance criteria: Header, footer, or content modules include configurable links for Substack, podcast, LinkedIn, and X.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 021: Build public/member event calendar with teaser-gated access
  - Priority: P1
  - Goal: Promote major space conferences, summits, and workshops while reserving details for Members.
  - Acceptance criteria: Public users see event teasers; approved Members see full event details; event data is editable by authorized staff.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 022: Build Potomac internal summit tracker and past-event summary view
  - Priority: P1
  - Goal: Track Potomac's upcoming internal summits and summarize major news from past events.
  - Acceptance criteria: Member-gated tracker shows upcoming internal summits and past-event summaries with dates, status, and editable content.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 023: Add sponsor and ad placement schema/admin controls
  - Priority: P1
  - Goal: Store and manage direct-sold sponsorship and ad inventory.
  - Acceptance criteria: Schema and admin controls support sponsors, placements, campaign dates, discounts, status, and reporting fields.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 024: Implement hybrid direct-sold/programmatic ad placement surfaces
  - Priority: P1
  - Goal: Display sponsor inventory and allow programmatic fallback where appropriate.
  - Acceptance criteria: Public pages can render direct-sold sponsor units and documented fallback slots without breaking layout or gated content.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

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

- [ ] Task 046: Add automated tests for auth, RBAC, article gating, billing, and RLS
  - Priority: P0
  - Goal: Cover critical security and access-control behavior with tests.
  - Acceptance criteria: Automated tests exercise login/session behavior, membership gating, role restrictions, billing entitlement updates, and RLS expectations.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 047: Add end-to-end tests for public teaser, Member article unlock, Scout dashboard, and Command admin flows
  - Priority: P1
  - Goal: Validate the main user journeys from browser-level behavior.
  - Acceptance criteria: E2E tests cover public article teaser, Member full article access, Scout dashboard access, and Command/admin workflows.
  - Non-technical summary:
  - Verification:
  - Blocked reason:

- [ ] Task 048: Run build, lint, tests, and document remaining gaps
  - Priority: P0
  - Goal: Verify the implementation and capture any remaining gaps.
  - Acceptance criteria: Build, lint, and available tests are run; results are recorded; remaining gaps or skipped checks are documented clearly.
  - Non-technical summary:
  - Verification:
  - Blocked reason:
