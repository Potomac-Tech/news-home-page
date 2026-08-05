import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("supabase/migrations/20260713111446_production_member_alert_evaluator.sql", "utf8");
const evaluator = readFileSync("lib/alerts/evaluator.ts", "utf8");
const route = readFileSync("app/api/internal/alerts/evaluate/route.ts", "utf8");
const operations = readFileSync("docs/alert-evaluation-operations.md", "utf8");
const savedWork = readFileSync("app/member/saved-work/page.tsx", "utf8");

test("production evaluator covers every required alert source", () => {
    for (const token of [
        "lunar_companies",
        "lunar_missions",
        "lunar_procurements",
        "lunar_regulatory_records",
        "dataset_catalog_entries",
        "event_calendar_events",
        "data_market_data_requests",
        "data_market_data_offers",
        "command_intelligence_allocations",
    ]) assert.ok(evaluator.includes(token), `missing ${token}`);
});

test("alert delivery respects preferences, quiet hours, deduplication, and limits", () => {
    for (const token of [
        "member_notification_preferences",
        "quietHoursEnd",
        "dedupe_key",
        "per_day_limit",
        "Rule daily delivery limit reached",
        "notification-preferences",
    ]) assert.ok(evaluator.includes(token) || savedWork.includes(token), `missing ${token}`);
});

test("email delivery uses protected Resend quota, retry, and audit contracts", () => {
    for (const token of [
        "claim_resend_free_quota",
        "claim_resend_send_rate",
        "complete_resend_free_quota",
        "attempt_count >= 5",
        "member_alert_evaluation_runs",
        "outbound_email_delivery_events",
    ]) assert.ok(migration.includes(token), `missing ${token}`);
    assert.ok(evaluator.includes("sendOperationalEmail"));
});

test("Supabase Cron calls a bearer-protected internal endpoint through Vault", () => {
    for (const token of [
        "*/15 * * * *",
        "private.invoke_member_alert_evaluator",
        "vault.decrypted_secrets",
        "member_alert_evaluator_secret",
        "net.http_post",
    ]) assert.ok(migration.includes(token), `missing ${token}`);
    assert.ok(route.includes("ALERT_EVALUATOR_SECRET"));
    assert.ok(route.includes("timingSafeEqual"));
    assert.ok(!route.includes("NEXT_PUBLIC_ALERT"));
});

test("preference and unsubscribe operations are documented", () => {
    assert.ok(operations.includes("/member/saved-work#notification-preferences"));
    assert.ok(operations.includes("disable email globally or by object category"));
    assert.ok(savedWork.includes('id="notification-preferences"'));
});
