import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const output = await mkdtemp(path.join(tmpdir(), "cabeus-carousel-"));
await build({ entryPoints: ["app/_data/homepageCarousel.ts"], outfile: path.join(output, "resolver.mjs"), bundle: true, platform: "node", format: "esm", external: ["next/*"] });
const { resolveCarouselSlides } = await import(pathToFileURL(path.join(output, "resolver.mjs")));
test.after(() => rm(output, { recursive: true, force: true }));

const slide = (id, minimumTier = "public", extras = {}) => ({ id, articleId: null, slideType: "signed_in_editorial_story", title: id, summary: "Reviewed story summary for carousel testing.", visualAssetUrl: "/hero.png", visualAssetAlt: "Lunar surface intelligence image", ctaLabel: "Read", ctaRoute: `/news/${id}`, minimumTier, isRequired: false, isPinned: false, displayRank: 10, sourceNote: "Reviewed fixture.", freshnessAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 10000).toISOString(), ...extras });
const inventory = [
    slide("required", "public", { isRequired: true }), slide("latest"),
    slide("premium", "scout", { slideType: "paid_tier_teaser", ctaRoute: "/upgrade" }),
    slide("scout-intel", "scout"), slide("command-intel", "command"),
];
const custom = [slide("custom", "member", { slideType: "custom_intelligence_card" })];
const viewer = (audience, extras = {}) => ({ audience, userId: audience === "anonymous" ? null : "user", personalizationEnabled: true, qualifyingEvents: 5, ...extras });

test("anonymous teasers lead through request access", () => {
    const result = resolveCarouselSlides({ inventory, viewer: viewer("anonymous") });
    assert.ok(result.some((item) => item.id === "access:anonymous"));
    assert.ok(result.filter((item) => !item.isRequired).every((item) => item.ctaRoute.startsWith("/request-access")));
});
for (const [audience, prompt] of [["unverified", "access:unverified"], ["profile_incomplete", "access:profile_incomplete"]]) {
    test(`${audience} receives a public-safe completion prompt`, () => {
        const result = resolveCarouselSlides({ inventory, viewer: viewer(audience) });
        assert.ok(result.some((item) => item.id === prompt));
        assert.ok(result.every((item) => item.minimumTier === "public"));
    });
}
test("Explorer prioritizes a paid article teaser", () => {
    const result = resolveCarouselSlides({ inventory, customCards: custom, viewer: viewer("explorer") });
    assert.ok(result.some((item) => item.id === "premium"));
    assert.ok(result.findIndex((item) => item.id === "premium") < result.findIndex((item) => item.id === "latest"));
});
for (const audience of ["scout", "command", "staff"]) {
    test(`${audience} receives custom intelligence without an upgrade teaser`, () => {
        const result = resolveCarouselSlides({ inventory, customCards: custom, viewer: viewer(audience) });
        assert.ok(result.some((item) => item.id === "custom"));
        assert.ok(!result.some((item) => item.id === "premium"));
    });
}
test("five events allow custom cards to override optional editor picks", () => {
    const result = resolveCarouselSlides({ inventory, customCards: custom, viewer: viewer("scout") });
    assert.ok(result.findIndex((item) => item.id === "custom") < result.findIndex((item) => item.id === "latest"));
    assert.equal(result[0].id, "required");
});
for (const state of [{ qualifyingEvents: 0 }, { qualifyingEvents: 4 }, { personalizationEnabled: false, qualifyingEvents: 20 }]) {
    test(`fallback excludes behavior cards for ${JSON.stringify(state)}`, () => {
        const result = resolveCarouselSlides({ inventory, customCards: custom, viewer: viewer("scout", state) });
        assert.ok(!result.some((item) => item.id === "custom"));
        assert.ok(result.some((item) => item.id === "latest"));
    });
}
