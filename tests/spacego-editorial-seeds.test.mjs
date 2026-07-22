import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const articles = readFileSync("app/news/_data/articles.ts", "utf8");
const homepage = readFileSync("app/_data/homepage.ts", "utf8");
const migration = readFileSync(
    "supabase/migrations/20260722193000_seed_spacego_editorial_stories.sql",
    "utf8"
);

const seeds = [
    {
        slug: "space-collar-workforce-lunar-economy",
        source: "https://mtf.tv/beyond-blue-and-white-the-rise-of-space-collar-jobs",
        image: "public/space-collar-lunar-workforce.png",
    },
    {
        slug: "clps-2-lunar-logistics-market",
        source: "https://mtf.tv/clps-2-0-nasa",
        image: "public/commercial-lunar-delivery-pipeline.webp",
    },
    {
        slug: "crewed-lunar-rover-surface-mobility-market",
        source: "https://mtf.tv/nasa-funds-moon-buggies-for-artemis-program",
        image: "public/crewed-lunar-rover-market.png",
    },
    {
        slug: "artemis-iii-crew-integration-schedule",
        source: "https://mtf.tv/nasa-artemis-rocket-launch",
        image: "public/artemis-iii-crew-integration.png",
    },
];

test("SpaceGo seeds are represented in homepage and article fallbacks", () => {
    for (const seed of seeds) {
        assert.match(homepage, new RegExp(seed.slug));
        assert.match(articles, new RegExp(seed.slug));
        assert.match(articles, new RegExp(seed.source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
        assert.equal(existsSync(seed.image), true, `${seed.image} should exist`);
    }
});

test("SpaceGo seed migration preserves attribution and Explorer gating", () => {
    assert.match(migration, /Meet the Future \/ SPACE <GO>/);
    assert.match(migration, /original_editorial_summary/);
    assert.match(migration, /'member'::public\.membership_tier/);

    for (const seed of seeds) {
        assert.match(migration, new RegExp(seed.slug));
        assert.match(migration, new RegExp(seed.source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
});

test("each seed includes a gated body and public editorial fields", () => {
    const bodySeedCount = (migration.match(/insert into public\.editorial_article_bodies/g) ?? []).length;
    assert.equal(bodySeedCount, 1);

    for (const requiredField of [
        "public_summary",
        "public_teaser_markdown",
        "public_key_points",
        "intro_markdown",
        "body_markdown",
        "seo_description",
        "aeo_summary",
    ]) {
        assert.match(migration, new RegExp(requiredField));
    }
});
