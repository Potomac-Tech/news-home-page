import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("production content loaders do not substitute local launch content", async () => {
    const [fallbackPolicy, homepage, events, datasets, archives, archiveLoader, article] =
        await Promise.all([
            read("app/_data/contentFallbacks.ts"),
            read("app/page.tsx"),
            read("app/events/page.tsx"),
            read("app/_data/datasets.ts"),
            read("app/archives/page.tsx"),
            read("app/_data/editorialArchive.ts"),
            read("app/news/[slug]/page.tsx"),
        ]);

    assert.match(fallbackPolicy, /NODE_ENV !== "production"/);
    assert.match(homepage, /allowLocalContentFallbacks\(\) \? fallbackStories : \[\]/);
    assert.match(events, /allowLocalContentFallbacks\(\) \? publicEventTeasers\(\) : \[\]/);
    assert.match(datasets, /allowLocalContentFallbacks\(\)[\s\S]*fallbackDatasetCatalogEntries[\s\S]*: \[\]/);
    assert.match(archives, /loadEditorialArchive/);
    assert.match(archiveLoader, /\.eq\("status", "published"\)/);
    assert.match(archiveLoader, /\.not\("primary_author_id", "is", null\)/);
    assert.doesNotMatch(archiveLoader, /allowLocalContentFallbacks/);
    assert.match(article, /allowLocalContentFallbacks\(\)[\s\S]*findFallbackArticle/);
});

test("launch inventory records approval and withholds unapproved modules", async () => {
    const [migration, visibility, inventory] = await Promise.all([
        read("supabase/migrations/20260724014752_approve_launch_content_inventory.sql"),
        read("app/_data/launchVisibility.ts"),
        read("docs/launch-content-inventory-2026-07-24.md"),
    ]);

    assert.match(migration, /jake@potomacdb\.com/);
    assert.match(migration, /Expected 4 approved editorial launch records/);
    assert.match(migration, /Expected 3 approved public launch datasets/);
    assert.match(migration, /Expected 3 proprietary placeholders to be archived/);
    assert.doesNotMatch(
        visibility,
        /"events"|"\/events"/,
        "published event pages must remain reachable from the masthead"
    );
    assert.match(inventory, /Supabase project: `xlpkdoeldtlhearqajat`/);
    assert.match(inventory, /production shows an explicit unavailable or empty state/);
});

test("search uses Cabeus Council visibility and fails closed in production", async () => {
    const [search, palette, migration, releaseAudit] = await Promise.all([
        read("app/_data/search.ts"),
        read("app/_components/SearchCommandPalette.tsx"),
        read("supabase/migrations/20260724020354_fix_meridian_search_visibility.sql"),
        read("scripts/audit-release-readiness.mjs"),
    ]);

    assert.match(
        search,
        /SearchTier = "public" \| "explorer" \| "scout" \| "meridian" \| "staff"/
    );
    assert.doesNotMatch(search, /SearchTier = [^\n]*"command"/);
    assert.match(search, /if \(!allowLocalContentFallbacks\(\)\) \{\s*return \[\]/);
    assert.match(palette, /"meridian"/);
    assert.match(migration, /target_tier = 'meridian'/);
    assert.doesNotMatch(releaseAudit, /\{ path: "\/events", kind: "public" \}/);
});
