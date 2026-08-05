import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const access = readFileSync("lib/auth/weekly-tracker.ts", "utf8");
const page = readFileSync("app/tracker/launches/page.tsx", "utf8");
const migration = readFileSync("supabase/migrations/20260712230954_verified_profile_tracker_access.sql", "utf8");
const exportRoute = readFileSync("app/api/member/tracker/launches/export/route.ts", "utf8");
const nav = readFileSync("app/_components/MigrationShell.tsx", "utf8");
const terminal = readFileSync("app/_data/terminal.ts", "utf8");
const search = readFileSync("app/_data/search.ts", "utf8");
const member = readFileSync("app/member/page.tsx", "utf8");
const account = readFileSync("app/account/page.tsx", "utf8");

test("verified complete generic accounts receive the basic tracker shell", () => {
    assert.ok(access.includes('state: "authorized"'));
    assert.ok(access.includes("canReadBasic: true"));
    assert.ok(access.includes('tier: WeeklyTrackerTier'));
    assert.match(migration, /when 'member' then true/);
});
test("anonymous, unverified, and incomplete accounts are routed before tracker queries", () => {
    assert.ok(page.indexOf("getWeeklyTrackerAccess") < page.indexOf("loadWeeklyTracker"));
    assert.ok(page.includes('access.state === "signed_out"'));
    assert.ok(page.includes('access.state === "email_unverified"'));
    assert.ok(page.includes('access.state === "profile_incomplete"'));
});
test("premium tracker hooks require Scout, Command, or staff", () => {
    assert.ok(access.includes('["scout","command","staff"].includes(tier)'));
    for (const token of ["Advanced filters", "Watchlist", "Alerts", "Export", "API", "canUsePremiumTools"]) assert.ok(page.includes(token), `missing ${token}`);
    assert.ok(exportRoute.includes("if (!access.canUsePremiumTools)"));
    assert.ok(exportRoute.includes('"cache-control": "private, no-store"'));
});
test("search, terminal, account navigation, and metadata use Launches & Missions", () => {
    for (const source of [terminal, search, account, page]) assert.ok(source.includes("Launches & Missions"));
    assert.ok(member.includes("Your account."));
    assert.ok(!nav.includes('aria-label="Platform routes"'));
    assert.ok(search.includes('href: "/tracker/launches"'));
    assert.ok(terminal.includes('href: "/tracker/launches"'));
});
test("public search fallback contains only safe tracker summary fields", () => {
    const result = search.slice(search.indexOf('id: "missions"'), search.indexOf('id: "companies"'));
    assert.ok(!result.includes("analyst_estimate"));
    assert.ok(!result.includes("estimate_methodology"));
    assert.ok(!result.includes("contract value"));
    assert.ok(result.includes('tier: "public"'));
});
