# Cabeus Explorer Brand Foundation

The production app uses the Cabeus Explorer identity system: industrial
graphite surfaces, regolith tan, safety amber, steel white, oxide red, machine
gray, condensed display type, technical data labels, and lunar infrastructure
imagery.

## Brand Tokens

| Token | Value | Use |
| --- | --- | --- |
| `cabeus.graphite` | `#1E2227` | Page and navigation surfaces. |
| `cabeus.regolith` | `#B9A98B` | Secondary text, borders, muted industrial accents. |
| `cabeus.amber` | `#F3A712` | Primary actions, highlights, signal states. |
| `cabeus.steel` | `#EEF1F3` | High-contrast foreground text. |
| `cabeus.oxide` | `#A34A32` | Risk and disruption accents. |
| `cabeus.machine` | `#6D747D` | Technical labels and subdued UI chrome. |

The root `tailwind.config.js` and `app/globals.css` define the production
tokens and supporting global utilities.

## Assets

Runtime assets live directly in `public/` and are served by Next.js and
Cloudflare OpenNext. There is no asset sync step and no nested public folder.

Important brand data is exposed through `app/_data/brand.ts`.

## Usage

New surfaces should use:

- `app/_data/brand.ts` for named colors, fonts, assets, and shared class groups.
- `app/_components` for reusable production UI.
- Root public paths for logos, PDFs, and visual media.
