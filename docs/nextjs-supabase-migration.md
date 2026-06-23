# Next.js and Supabase Migration Plan

## Purpose

Potomac is moving from a static Vite marketing site to a news-first lunar intelligence platform. The current site is useful for public brand pages, but the next product direction needs server-rendered editorial pages, member-gated article bodies, paid entitlements, analyst/admin workflows, and Supabase-backed data products.

The migration target is a Next.js App Router application with Supabase Auth, Supabase Postgres, Supabase Storage, and server-side access checks. The existing Potomac visual identity and public routes should be preserved while the application foundation shifts toward authenticated news, intelligence, and member dashboards.

## Current Site Inventory

The current application is a Vite React app using `react-router-dom`, Tailwind CSS, and static assets from `public/`.

Current public routes:

| Route | Current source | Migration note |
| --- | --- | --- |
| `/` | `src/pages/Home.tsx` | Preserve as the public front door, then evolve into the news-first homepage. |
| `/hardware` | `src/pages/Hardware.tsx` | Preserve as an existing product/positioning page. |
| `/source` | Redirect to `/hardware` | Keep redirect behavior in Next.js middleware or route handler. |
| `/nexus` | `src/pages/Nexus.tsx` | Preserve as public/teaser context, then connect member dashboard deep-linking later. |
| `/team` | `src/pages/Team.tsx` | Preserve public team page. |
| `/news` | `src/pages/News.tsx` | Replace with CMS-backed article feed. |
| `/news/vipc-grant-winner` | `src/pages/VipcGrantWinner.tsx` | Preserve as migrated article content or imported seed content. |

Important public assets include Potomac logos, the Nexus screenshot, news logo, team photos, hardware imagery, source rendering imagery, the lunar economy press release PDF, favicon, manifest, and CNAME configuration.

## Target Stack

- Next.js App Router with TypeScript and React.
- Tailwind CSS using the existing Potomac dark gray, gold, cream, and command-center styling.
- Supabase Auth for login, sessions, member identity, and protected routes.
- Supabase Postgres for articles, membership applications, organizations, roles, entitlements, economy models, data marketplace records, event records, sponsor inventory, and audit trails.
- Supabase Storage for uploaded files, downloadable methodology/source files, article attachments, and dataset samples.
- Supabase Edge Functions or scheduled jobs for feed ingestion, economy recalculation, data-market extraction, notifications, and Stripe webhook processing where appropriate.
- Stripe for Scout self-serve annual billing and payment status, with entitlement updates stored in Supabase.

## Migration Rationale

Next.js gives the platform server rendering, metadata control, canonical URLs, sitemap generation, route handlers, protected server components, and a clean path for public SEO/AEO pages alongside authenticated member experiences. Those capabilities are necessary for public article teasers, gated full articles, analyst dashboards, and role-aware organization workflows.

Supabase should be the system of record for user identity, application state, content records, entitlement state, storage objects, and audit history. Keeping authorization rules in Supabase RLS and trusted app metadata reduces reliance on browser-only checks and makes access rules verifiable at the data boundary.

## Ownership Boundaries

Next.js owns:

- Routing, page rendering, layouts, metadata, sitemap, robots configuration, and canonical URLs.
- Server-side request handling for page loads, redirects, and integration endpoints.
- UI composition for public pages, member dashboards, admin workflows, and analyst tools.
- Reading Supabase data through server-safe clients and enforcing page-level redirects.

Supabase owns:

- Auth users, sessions, and trusted identity attributes.
- Postgres tables, migrations, RLS policies, grants, functions, triggers, and audit tables.
- Storage buckets and storage access policies.
- Scheduled or event-driven backend work that belongs close to the data model.

Stripe owns:

- Payment collection, invoices, subscription state, and billing portal behavior.
- Webhook events that the app validates before updating Supabase entitlements.

## Key Risks

- Wrong Supabase project targeting: all tooling must use `xlpkdoeldtlhearqajat` and never use `nwoluvjdojzayozyzlob`.
- Secret exposure: service-role keys must never be placed in `NEXT_PUBLIC_` variables or client bundles.
- Gated content leakage: public article pages may expose summaries, snippets, citations, and metadata, but full bodies must require approved member access.
- RLS drift: authorization must live in normalized tables or trusted app metadata, not user-editable metadata.
- Data API grants: Supabase is moving toward explicit grants for API-exposed tables, so migrations should include grants and RLS together where tables are intended for API access.
- Route parity: existing public routes, redirects, assets, favicon, manifest, and CNAME behavior need to survive the migration.
- Visual regression: brand tokens, typography, logos, and lunar command-center styling should be available before replacing public pages.
- Deployment risk: Next.js hosting behavior may differ from the current static build, especially around redirects, generated metadata, and asset paths.

## Expected Developer Workflow

1. Read `docs/codex-automation-memory.md` and the task list before starting automation work.
2. Confirm Supabase tooling points to `xlpkdoeldtlhearqajat`.
3. Keep the current Vite site working until the Next.js scaffold can build and route-match the existing pages.
4. Add or update environment documentation before introducing Supabase clients. Browser-safe variables should use public/publishable keys only; service-role or secret keys must remain server-only.
5. Create database changes iteratively against Supabase tooling first, then commit clean migration files after verification.
6. For every table exposed through Supabase APIs, pair explicit grants with RLS policies that match the membership model.
7. Verify each task with the narrowest useful check, then run broader build/lint/test checks when shared app behavior changes.
8. Commit completed tasks one at a time with task-specific messages.

## Initial Migration Sequence

1. Add a Next.js scaffold or migration-compatible structure while preserving the Vite app as a reference.
2. Port Tailwind configuration, global styles, fonts, logos, and reusable layout components.
3. Map current routes into the App Router and preserve `/source` redirect behavior.
4. Add Supabase browser/server clients and environment documentation.
5. Introduce Auth, protected routes, and role-aware dashboard shells.
6. Add member, organization, entitlement, editorial CMS, and audit schemas with RLS.
7. Replace static news pages with CMS-backed public teasers and gated full article pages.
