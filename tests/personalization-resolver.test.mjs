import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const output = await mkdtemp(path.join(tmpdir(), "cabeus-personalization-"));
await build({ entryPoints: ["lib/personalization/resolver.ts"], outfile: path.join(output, "resolver.mjs"), bundle: true, platform: "node", format: "esm" });
const { resolvePersonalization } = await import(pathToFileURL(path.join(output, "resolver.mjs")));

test.after(() => rm(output, { recursive: true, force: true }));

for (const audience of ["anonymous", "unverified", "profile_incomplete"]) {
    test(`${audience} never receives behavior ranking`, () => {
        assert.equal(resolvePersonalization({ audience, qualifyingEvents: 50 }).behaviorRanking, false);
    });
}

test("enabled members need at least five qualifying events", () => {
    assert.equal(resolvePersonalization({ audience: "explorer", qualifyingEvents: 4 }).mode, "latest_reviewed");
    assert.equal(resolvePersonalization({ audience: "explorer", qualifyingEvents: 5 }).mode, "personalized");
});

test("disabled ranking uses required, paid teaser, and latest fallbacks", () => {
    const result = resolvePersonalization({ audience: "explorer", enabled: false, qualifyingEvents: 20 });
    assert.equal(result.behaviorRanking, false);
    assert.deepEqual(result.priorities, ["required_picks", "paid_article_teasers", "latest_reviewed"]);
});

for (const audience of ["scout", "command"]) {
    test(`${audience} receives tier intelligence without repetitive upgrade priority`, () => {
        const result = resolvePersonalization({ audience, enabled: false });
        assert.ok(result.priorities.includes("tier_intelligence"));
        assert.ok(!result.priorities.includes("paid_article_teasers"));
    });
}
