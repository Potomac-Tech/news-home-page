# Global Search and Command Palette UI

Task 064 adds the first usable global search and keyboard command-palette
surface for the lunar intelligence terminal.

## Routes And Entry Points

- `/search` provides global search across terminal intelligence records.
- The shared Next.js shell now includes a Search control in the header.
- `Ctrl+K` / `Cmd+K` opens a keyboard-accessible command palette from any
  Next.js route.
- `/sitemap.xml` includes `/search` as a public terminal route.

## Search Experience

The search page supports:

- A full-text query input.
- Scoped result filters for articles, events, companies, missions, datasets,
  data requests, data offers, jobs, procurement, regulatory records,
  methodology sources, dashboard modules, and calculators.
- Result snippets, source counts, confidence labels, freshness labels, pinned
  labels, result-kind labels, and tier labels.
- Empty states with a clear reset path.
- Entitlement-aware prompts for Explorer, Scout, and Command records where
  public users can see that a result exists but cannot read the full result.

## Data Flow

The UI reads `intelligence_search_records` and `intelligence_command_entries`
when Supabase public configuration is available. Supabase RLS remains the source
of truth for live entitlement-aware visibility.

When Supabase is unavailable, the UI uses local fallback records that mirror the
Task 063 seed model. This keeps the route and command palette testable without
runtime keys.

## Command Palette

The command palette is implemented in
`app/_components/SearchCommandPalette.tsx`.

It supports:

- `Ctrl+K` / `Cmd+K` open behavior.
- Escape-to-close behavior.
- Click-outside close behavior.
- Native links for result navigation.
- Pinned entries.
- Tier labels.
- No-match state.

The first implementation intentionally avoids write actions. Admin actions are
represented as navigation entries until a dedicated search-admin route is built.

## Verification

Build, lint, local route checks, and browser QA results are recorded in
`docs/potomac-news-intelligence-tasks.md`.
