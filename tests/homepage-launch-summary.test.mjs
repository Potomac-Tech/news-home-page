import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/page.tsx", "utf8");
const loader = readFileSync("app/_data/homepageLaunchSummary.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260713020958_homepage_launch_summary.sql", "utf8");
const tracker = readFileSync("app/tracker/launches/page.tsx", "utf8");

test("homepage launch metric uses reviewed live aggregate instead of placeholder counts", () => {
    assert.ok(loader.includes("get_homepage_launch_summary"));
    assert.ok(page.includes("launchSummary.reviewedCount"));
    assert.ok(page.includes("launchSummary.lunarCount"));
    assert.ok(page.includes("launchSummary.freshnessAt"));
    assert.ok(!page.includes('{ label: "Launches tracked", value: "26"'));
});
test("aggregate RPC exposes only approved reviewed counts and freshness", () => {
    for (const token of ["publication_status = 'published'", "license_status = 'approved'", "analyst_review_state = 'approved'", "count(*)", "source_checked_at"]) assert.ok(migration.includes(token));
    assert.ok(!migration.includes("analyst_estimate"));
    assert.ok(!migration.includes("estimate_methodology"));
});
test("homepage handoff covers all profile states and preserves week/timezone", () => {
    for (const token of ["Open tracker", "Verify email", "Complete profile", "Request access", "trackerContext", "week=", "timezone="]) assert.ok(page.includes(token), `missing ${token}`);
    assert.ok(tracker.includes("params.week"));
    assert.ok(tracker.includes("params.timezone"));
});
test("premium homepage actions route through upgrade without prefetch", () => {
    assert.ok(page.includes("Values & exports"));
    assert.ok(page.includes("/upgrade?tier=scout&source=homepage&content=launch-tools"));
    assert.ok(page.includes("prefetch={false}"));
});
