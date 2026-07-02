# Watchlists, Saved Work, And Preferences UI

Task 066 adds the Scout and Command saved-work workspace at
`/member/saved-work`.

## Scope

The page gives paid members a single place to manage the Task 065
personalization tables:

- Create and archive watchlists.
- Add and remove watched articles, companies, lunar missions, procurements,
  regulatory records, events, datasets, marketplace records, methodology
  sources, calculators, RFQs, and forum threads.
- Save searches with object scope and alert frequency.
- Add reading-list items, mark them read, and archive them.
- Save in-app and email notification preferences.
- Save terminal dashboard defaults for pinned, hidden, and scoped modules.

## Access Model

`next-app/lib/auth/saved-work.ts` protects the route and server actions with
normalized roles. Scout, Command, editor, analyst, and admin roles can use the
workspace. Explorer users see an upgrade gate instead of write controls.

The UI reads and writes through the Potomac Supabase public client, so Supabase
RLS remains the row boundary. The page does not render local saved-work
fallback data because saved work is user-owned.

## Graceful States

When Potomac Supabase public credentials are missing, the page shows a
configuration gate. When the Task 065 schema is not applied or unavailable, the
route still renders the controls and displays the Supabase read error so the
operator can apply the migration chain.

Unsupported object types are rejected by the server actions and explained on
the page. New object types should be added to the schema enum, RLS policy
coverage, and UI option list together.
