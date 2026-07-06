# Next.js Application

The production application is now the root Next.js App Router app. The previous
Vite site and nested migration scaffold have been removed, so all local,
GitHub, and Cloudflare workflows should use the same root app.

## Commands

- Local development: `npm run dev`
- Production build: `npm run build`
- Local production server: `npm run start`
- Cloudflare Worker preview: `npm run preview`
- Cloudflare Worker deploy: `npm run deploy`

The local Next.js server uses port `3001` by default.

## Deployment Target

Cloudflare deploys the app through OpenNext for Cloudflare:

- `open-next.config.ts` defines the OpenNext adapter config.
- `wrangler.jsonc` points Cloudflare Workers at `.open-next/worker.js`.
- Static assets are emitted into `.open-next/assets`.

No `dist/` folder or Vite build output should be used for deployment.

## Route Sources

| Route | Source |
| --- | --- |
| `/` | `app/page.tsx` |
| `/hardware` | `app/hardware/page.tsx` |
| `/source` | `app/source/page.tsx` |
| `/nexus` | `app/nexus/page.tsx` |
| `/team` | `app/team/page.tsx` |
| `/news` | `app/news/page.tsx` |
| `/news/[slug]` | `app/news/[slug]/page.tsx` |

Shared components, loaders, and brand data live in `app/_components`,
`app/_data`, and `lib`.
