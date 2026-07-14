import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260714023045_operational_telemetry_rate_limits.sql");
const telemetry = read("app/api/telemetry/route.ts");
const reporter = read("app/_components/ConsentTelemetry.tsx");
const quality = read("scripts/audit-production-quality.mjs");
const workflow = read(".github/workflows/quality-gates.yml");

test("telemetry requires consent, redacts email, hashes network identity, and rate limits", () => {
    assert.match(telemetry, /X-Analytics-Consent/i);
    assert.match(telemetry, /\[redacted-email\]/);
    assert.match(telemetry, /createHash\("sha256"\)/);
    assert.match(telemetry, /claim_operational_telemetry_event/);
    assert.match(reporter, /readCookiePreferences\(\)\.analytics/);
    assert.match(migration, /operational_telemetry_staff_read/);
    assert.match(migration, /30 days/);
});

test("paid API minute limits are service-only and audited", () => {
    assert.match(migration, /claim_developer_api_minute/);
    assert.match(migration, /per_minute_rate_exceeded/);
    assert.match(migration, /revoke all on function public\.claim_developer_api_minute/);
    assert.match(read("lib/developer/api-runtime.ts"), /p_limit: 120/);
});

test("CI enforces accessibility, overflow, and Core Web Vitals budgets", () => {
    assert.match(quality, /AxeBuilder/);
    assert.match(quality, /critical.*serious/);
    assert.match(quality, /horizontalOverflow/);
    for (const metric of ["FCP", "LCP", "CLS", "initialJsKb", "documentKb"]) assert.ok(quality.includes(metric));
    assert.match(workflow, /npm run test:quality/);
    assert.match(workflow, /playwright install --with-deps chromium/);
});

test("Cloudflare logs and traces use the approved one-percent budget guard", () => {
    const wrangler = read("wrangler.jsonc");
    const guard = read("workers/observability-budget-guard/src/policy.mjs");
    assert.match(wrangler, /"observability"/);
    assert.match(wrangler, /"logs"/);
    assert.match(wrangler, /"traces"/);
    assert.equal((wrangler.match(/"head_sampling_rate": 0\.01/g) ?? []).length, 2);
    assert.match(guard, /reduceAt: 190_000/);
    assert.match(guard, /pauseAt: 199_000/);
});
