# Editorial Workflow

Task 016 adds a protected editor workflow at `/admin/editorial`.

## What Editors Can Do

- Create a draft article with slug, title, access tier, public summary, public teaser, intro, gated body, SEO fields, and AEO summary.
- Preview public teaser content and gated body content on the same editorial page before publishing.
- Update draft or published article fields and save a new version snapshot.
- Publish an article after required public and gated content exists.

## Access Control

The route and server actions use `next-app/lib/auth/editorial.ts`.

Access requires a signed-in Supabase Auth user with an active `editor` or `admin` role assignment. The database RLS policies from Task 015 still enforce staff-only writes on the editorial tables.

## Versioning

The workflow writes to `editorial_article_versions` when:

- A draft is created.
- Article fields or gated body content are saved.
- An article is published.

Each snapshot stores the article status, slug, title, public teaser fields, gated body markdown, SEO metadata, AEO metadata, authoring user, and change note.

## Current Limits

- The editor uses plain text and markdown text areas rather than a rich text editor.
- Author, tag, and citation management are schema-ready but not exposed in the UI yet.
- Publish scheduling is present in the schema but not exposed in this first workflow.
- Live workflow testing requires the Task 015 migration to be applied to Supabase project `xlpkdoeldtlhearqajat` and an editor/admin test account.

## Verification

- `npm run build:next`
- `npm run build`

Live draft, update, preview, and publish actions were not executed because Supabase keys were unavailable and the editorial schema was not applied to a reachable database.
