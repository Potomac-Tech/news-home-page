import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("supabase/migrations/20260712200950_tracker_value_disclosure_gates.sql", "utf8");
const loader = readFileSync("app/_data/weeklyLaunchTracker.ts", "utf8");
const page = readFileSync("app/tracker/launches/page.tsx", "utf8");
const member = readFileSync("app/member/page.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const search = readFileSync("app/_data/search.ts", "utf8");

test("analyst estimates cannot be configured below Scout visibility", () => {
    assert.match(migration, /value_state = 'analyst_estimate' and new\.value_visibility not in \('scout','command'\)/);
    assert.match(migration, /app_private\.can_read_tracker_tier\('scout'\)/);
});
test("public exact values and ranges require editorial and source approval", () => {
    for (const token of ["editorial_public_disclosure", "disclosure_reviewed_by", "disclosure_reviewed_at", "license_status = 'approved'", "analyst_review_state = 'approved'"]) assert.ok(migration.includes(token), `missing ${token}`);
    assert.match(migration, /exact_cited','cited_range/);
});
test("Explorer receives the required upgrade CTA while paid tiers receive returned methodology", () => {
    assert.ok(page.includes("Sign up or Log In for More Details"));
    assert.ok(page.includes("/upgrade?tier=scout"));
    assert.ok(page.includes("access.canUsePremiumTools"));
    assert.ok(loader.includes("estimate_methodology"));
    assert.ok(page.includes("Methodology:"));
});
test("estimate fields are absent from public metadata, search, sitemap, and prefetch surfaces", () => {
    for (const source of [sitemap, search]) {
        assert.ok(!source.includes("analyst_estimate"));
        assert.ok(!source.includes("estimate_methodology"));
    }
    assert.ok(member.includes('robots: { index: false, follow: false }'));
    assert.ok(!member.includes("analyst_estimate"));
    assert.ok(page.includes('export const dynamic = "force-dynamic"'));
    assert.ok(!page.match(/generateMetadata|application\/ld\+json/));
});
