import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const output = await mkdtemp(path.join(tmpdir(), "cabeus-alert-digest-"));
await build({
    entryPoints: ["lib/alerts/delivery-policy.ts"],
    outfile: path.join(output, "delivery-policy.mjs"),
    bundle: true,
    platform: "node",
    format: "esm",
});
const policy = await import(pathToFileURL(path.join(output, "delivery-policy.mjs")));
test.after(() => rm(output, { recursive: true, force: true }));

const evaluator = readFileSync("lib/alerts/evaluator.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260713141133_member_alert_digest_delivery.sql", "utf8");
const adminPage = readFileSync("app/admin/email/page.tsx", "utf8");

test("routine alerts default to digest grouping", () => {
    assert.equal(policy.resolveAlertDeliveryMode({ severity: "info", threshold: "urgent", instantUsed: 0, instantReserve: 5, budgetRemaining: 80, lowBudgetBuffer: 10 }), "digest");
    assert.ok(evaluator.includes("digestGroups"));
    assert.ok(evaluator.includes("Cabeus Explorer lunar intelligence digest"));
});

test("urgent alerts use immediate reserve only while budget remains", () => {
    assert.equal(policy.resolveAlertDeliveryMode({ severity: "urgent", threshold: "urgent", instantUsed: 0, instantReserve: 5, budgetRemaining: 80, lowBudgetBuffer: 10 }), "immediate");
    assert.equal(policy.resolveAlertDeliveryMode({ severity: "urgent", threshold: "urgent", instantUsed: 5, instantReserve: 5, budgetRemaining: 80, lowBudgetBuffer: 10 }), "digest");
    assert.equal(policy.resolveAlertDeliveryMode({ severity: "urgent", threshold: "urgent", instantUsed: 0, instantReserve: 5, budgetRemaining: 10, lowBudgetBuffer: 10 }), "digest");
});

test("digest scheduling and quiet hours defer delivery", () => {
    const now = new Date("2026-07-13T14:30:00Z");
    assert.equal(policy.nextDigestAt(now, 24, 13).toISOString(), "2026-07-14T13:00:00.000Z");
    const quietEnd = policy.quietHoursEnd(new Date("2026-07-13T03:00:00Z"), "22:00", "06:00", "UTC");
    assert.equal(quietEnd.toISOString(), "2026-07-13T06:00:00.000Z");
});

test("quota exhaustion and per-member caps queue the next digest", () => {
    assert.equal(policy.digestDeferralReason({ dailyAlertEmailsSent: 70, dailyQuotaSent: 70, dailyQuotaReserved: 0, maxDailyAlertEmails: 80, lowBudgetBuffer: 10, userMessagesSent: 0, perUserDailyCap: 2 }), "budget");
    assert.equal(policy.digestDeferralReason({ dailyAlertEmailsSent: 10, dailyQuotaSent: 10, dailyQuotaReserved: 0, maxDailyAlertEmails: 80, lowBudgetBuffer: 10, userMessagesSent: 2, perUserDailyCap: 2 }), "member_cap");
    assert.ok(evaluator.includes("Queued for next digest window"));
});

test("in-app delivery and preference checks remain independent from email budget", () => {
    assert.ok(evaluator.indexOf('channel: "in_app"') < evaluator.indexOf("globalBudgetRemaining"));
    assert.ok(evaluator.includes("member_notification_preferences"));
    assert.ok(evaluator.includes("notification-preferences"));
});

test("admins can control digest cadence, caps, reserve, threshold, and batch size", () => {
    for (const token of ["digest_cadence_hours", "max_daily_alert_emails", "per_user_daily_email_cap", "instant_daily_reserve", "instant_priority_threshold", "low_budget_buffer", "max_digest_items"]) {
        assert.ok(migration.includes(token), `migration missing ${token}`);
        assert.ok(adminPage.includes(token), `admin page missing ${token}`);
    }
    assert.ok(migration.includes("get_member_alert_runtime_config"));
});
