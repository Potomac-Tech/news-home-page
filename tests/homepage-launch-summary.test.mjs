import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/page.tsx", "utf8");
const loader = readFileSync("app/_data/homepageLaunchSummary.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260713020958_homepage_launch_summary.sql", "utf8");
const tracker = readFileSync("app/tracker/launches/page.tsx", "utf8");

test("homepage archives Mission Pulse without removing reviewed aggregate infrastructure", () => {
    assert.ok(loader.includes("get_homepage_launch_summary"));
    for (const token of ["Mission pulse", "Lunar economy activity", "launchSummary", "loadHomepageLaunchSummary"]) {
        assert.ok(!page.includes(token), `homepage still contains ${token}`);
    }
});
test("aggregate RPC exposes only approved reviewed counts and freshness", () => {
    for (const token of ["publication_status = 'published'", "license_status = 'approved'", "analyst_review_state = 'approved'", "count(*)", "source_checked_at"]) assert.ok(migration.includes(token));
    assert.ok(!migration.includes("analyst_estimate"));
    assert.ok(!migration.includes("estimate_methodology"));
});
test("launch tracker still accepts preserved week and timezone context", () => {
    assert.ok(tracker.includes("params.week"));
    assert.ok(tracker.includes("params.timezone"));
});

test("homepage keeps the Council introduction while hiding tier cards and publisher promotions", () => {
    assert.ok(page.includes("Intelligence built for your advantage."));
    for (const token of ["membershipTiers.map", "homepageSponsorUnits", "<SponsorUnit"]) {
        assert.ok(!page.includes(token), `homepage still contains ${token}`);
    }
});
