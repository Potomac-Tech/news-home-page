# Next.js and Supabase Architecture

The production Cabeus Explorer site is a root Next.js App Router application
with Supabase-backed identity, data products, member workflows, and admin
tools. The old static Vite application has been removed from the deploy path.

## Stack

- Next.js App Router with TypeScript and React.
- Tailwind CSS using the Cabeus Explorer lunar industrial visual system.
- Supabase Auth for login, sessions, member identity, and protected routes.
- Supabase Postgres for articles, membership applications, organizations,
  roles, entitlements, economy models, data marketplace records, event records,
  sponsor inventory, and audit trails.
- Supabase Storage for uploaded files, methodology/source files, article
  attachments, and dataset samples.
- Supabase Edge Functions or scheduled jobs for feed ingestion, economy
  recalculation, data-market extraction, notifications, and Stripe webhook
  processing where backend work belongs close to the data model.
- Stripe for Scout self-serve annual billing and payment status, with
  entitlement updates stored in Supabase.

## Deployment

Cloudflare should build and deploy the root app with OpenNext for Cloudflare.
The deployment entry is `.open-next/worker.js`, configured in `wrangler.jsonc`.
Do not deploy a Vite `dist/` build or GitHub Pages artifact.

## Supabase Project Safety

All tooling must target `xlpkdoeldtlhearqajat`. The project
`nwoluvjdojzayozyzlob` must not be used.

Service-role keys must never be placed in `NEXT_PUBLIC_` variables or client
bundles. Browser-safe variables should use public/publishable keys only.

## Authorization Boundaries

Next.js owns routing, rendering, metadata, redirects, route handlers, page-level
access checks, and UI composition.

Supabase owns Auth users, sessions, trusted identity attributes, migrations,
RLS policies, grants, functions, triggers, storage policies, and audit tables.

Stripe owns payment collection, invoices, subscription state, and webhook events
that the app validates before updating Supabase entitlements.

## Verification Workflow

Use the narrowest useful check for small changes, then broaden when shared
behavior changes:

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:e2e`
- `npm run preview` or `npm run deploy` for Cloudflare Worker verification
