# Potomac Brand Foundation

Task 004 preserves the current Potomac visual system for the Next.js migration scaffold.

## Brand Tokens

The canonical colors remain:

| Token | Value | Use |
| --- | --- | --- |
| `potomac.primary` | `#2D3038` | Headers, command bands, navigation surfaces. |
| `potomac.secondary` | `#2E3138` | Page backgrounds and dark lunar surfaces. |
| `potomac.gold` | `#D4AF37` | Primary accent, borders, calls to action, highlights. |
| `potomac.cream` | `#EAE5D7` | Body text and light foreground elements. |

The canonical type choices remain:

| Token | Font | Use |
| --- | --- | --- |
| `font-sans` | `Source Sans 3` | Body copy, labels, navigation, controls. |
| `font-serif` | `Cinzel` | Potomac display headings and formal labels. |

The Next scaffold defines these tokens in `next-app/tailwind.config.js` and keeps matching global utilities in `next-app/app/globals.css`.

## Asset Availability

The Vite site keeps canonical assets in `public/`. The Next scaffold has its own runtime public directory at `next-app/public/`, so `scripts/sync-next-public-assets.mjs` copies the canonical files into that folder before Next dev, build, or start commands.

Run manually when needed:

```bash
npm run sync:next-public
```

The synced Next public folder is intentionally ignored except for `.gitkeep`, so large binary assets are not duplicated in Git.

Important brand assets exposed through `next-app/app/_data/brand.ts`:

- `/Potomac Logo.png`
- `/Potomac Logo Transparent.png`
- `/News_Logo.png`
- `/Nexus Screenshot.png`
- `/Source Rendering.png`
- `/potomac-lunar-economy-press-release-05182026.pdf`

## Component Usage

New Next pages should use:

- `next-app/app/_data/brand.ts` for named colors, fonts, assets, and surface classes.
- Tailwind classes such as `bg-potomac-primary`, `text-potomac-gold`, `font-serif`, `bg-grid-pattern`, and `glass-card`.
- The synced public asset paths for logos, screenshots, PDFs, and visual media.

This keeps new Next work aligned with the current lunar command-center design while the Vite pages are migrated route by route.
