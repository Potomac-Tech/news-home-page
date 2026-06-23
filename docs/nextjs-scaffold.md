# Next.js Migration Scaffold

Task 003 added a first App Router scaffold in `next-app/` alongside the existing Vite app. The current Vite site remains the default development and build path while the Next.js structure is filled in.

## Commands

- Current Vite dev server: `npm run dev`
- Current Vite production build: `npm run build`
- Next.js dev server: `npm run dev:next`
- Next.js production build: `npm run build:next`
- Next.js production server: `npm run start:next`

The Next.js dev server uses port `3001` so it does not collide with the existing Vite server on port `3000`.

## Scaffolded Routes

| Next.js route | Current route/source accounted for | Status |
| --- | --- | --- |
| `/` | `src/pages/Home.tsx` | Public homepage scaffold. |
| `/hardware` | `src/pages/Hardware.tsx` | Route reserved for the existing hardware page. |
| `/source` | Vite redirect to `/hardware` | Redirect preserved with `next/navigation`. |
| `/nexus` | `src/pages/Nexus.tsx` | Route reserved for the Nexus migration. |
| `/team` | `src/pages/Team.tsx` | Route reserved for the public team page. |
| `/news` | `src/pages/News.tsx` | Route reserved for the future CMS-backed article feed. |
| `/news/vipc-grant-winner` | `src/pages/VipcGrantWinner.tsx` | Article route reserved for migration. |

## Asset Handling

The scaffold reuses the existing `public/` directory. That keeps Potomac logos, team images, hardware imagery, Nexus imagery, the press release PDF, favicon, manifest, and CNAME available to both Vite and Next.js during the migration.

## Notes

- `next.config.mjs` currently keeps the default Next runtime with React strict mode enabled.
- `next-app/app/layout.tsx` imports `next-app/app/globals.css`, which mirrors the current Potomac Tailwind tokens and global utilities for the scaffold.
- Existing `react-router-dom` components are not imported into the Next.js scaffold. Route content is intentionally separated until each page is ported.
- Supabase integration is not part of this task; it starts in Task 005 after the scaffold and brand foundation are in place.
