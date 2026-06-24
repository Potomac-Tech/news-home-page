# Editorial CMS Schema

Task 015 adds the first editorial content schema for the Next.js and Supabase migration.

## Core Tables

- `editorial_articles`: public article record with slug, title, publish status, public summary, public teaser, key points, intro, SEO metadata, AEO metadata, hero image fields, canonical URL, and publish/schedule/archive timestamps.
- `editorial_article_bodies`: gated full-body content split from the public article row so anonymous public article reads cannot request member-only body text.
- `editorial_authors`: author profiles that can optionally link to Supabase Auth users.
- `editorial_tags`: reusable topic tags.
- `editorial_article_authors`: multi-author article assignments with ordering and role labels.
- `editorial_article_tags`: article/tag assignments.
- `editorial_article_versions`: staff-only snapshots of public and gated content for draft, review, and publish history.
- `editorial_article_citations`: ordered source, quote, data, background, and correction citations for articles and optional versions.

## Publish And Access Model

Article status is tracked with `editorial_article_status`:

- `draft`
- `in_review`
- `scheduled`
- `published`
- `archived`

Published public rows require `published_at`, `public_summary`, and `public_teaser_markdown`. Scheduled rows require `scheduled_for`.

Full gated bodies are stored separately and protected by RLS. The article row declares `access_tier_required` using the existing `membership_tier` enum:

- `member`: Member, Scout, and Command users may read the full body.
- `scout`: Scout and Command users may read the full body.
- `command`: Command users may read the full body.

Editors, analysts, and admins can inspect editorial content according to their staff role.

## RLS Boundary

Public visitors can select published article metadata, active authors, tags, article-author links, article-tag links, and citations. They cannot select `editorial_article_bodies` or `editorial_article_versions`.

Authenticated members can read full bodies only when their assigned role satisfies the article tier. Staff manage policies are limited to `editor` and `admin` roles, with `analyst` granted read access for review and intelligence workflows.

## Verification

- `npm run build:next`
- `npm run build`
- Static migration checks confirmed the schema includes article, author, tag, version, citation, SEO/AEO, teaser, gated-body, publish-state, and RLS definitions.

Live migration execution was not run because Supabase keys were not available and no local database was reachable.
