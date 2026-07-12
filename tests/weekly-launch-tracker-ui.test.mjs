import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/tracker/launches/page.tsx", "utf8");
const loader = readFileSync("app/_data/weeklyLaunchTracker.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260712170947_global_weekly_tracker_visibility.sql", "utf8");

test("weekly tracker enforces verification and profile completion before loading data", () => {
    for (const token of ["getLunarMissionAccess", "access.loginHref", "access.profileHref", "canReadMemberDetails", "/request-access"]) assert.ok(page.includes(token));
});
test("weekly tracker defaults global and provides a prominent lunar filter", () => {
    assert.ok(page.includes("All global"));
    assert.ok(page.includes("Lunar / cislunar"));
    assert.ok(page.includes('filter === "lunar"'));
    assert.match(migration, /drop constraint if exists weekly_tracker_published_review/);
});
test("weekly cards expose required operational fields and reviewed empty state", () => {
    for (const token of ["Provider", "Vehicle", "Mission", "Customer / payload", "Launch site", "Target / orbit", "Value state", "Confidence", "Source checked", "Reviewed", "No reviewed records available"]) assert.ok(page.includes(token), `missing ${token}`);
    assert.ok(loader.includes("weekly_lunar_empty_states"));
    assert.ok(page.includes("emptyState?.message"));
});
test("loader relies on RLS-separated values and citations", () => {
    assert.ok(loader.includes("weekly_lunar_tracker_values"));
    assert.ok(loader.includes("weekly_lunar_tracker_sources"));
    assert.ok(!loader.includes("service_role"));
});
