import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync("supabase/migrations/20260712080937_weekly_lunar_tracker_schema.sql", "utf8");

test("weekly tracker models local Monday-Sunday windows with UTC fallback", () => {
    for (const token of ["week_timezone", "default 'UTC'", "week_start_local", "week_end_local", "extract(isodow", "+ 6"]) assert.ok(sql.toLowerCase().includes(token.toLowerCase()), `missing ${token}`);
});

test("weekly tracker captures mission, source, review, and confidence fields", () => {
    for (const token of ["event_type", "launch_provider", "vehicle", "mission_name", "customer_payload", "launch_site", "event_location", "target_orbit_location", "schedule_confidence", "is_lunar_or_cislunar", "source_registry_id", "citation_url", "last_reviewed_at", "reviewed_by"]) assert.ok(sql.includes(token), `missing ${token}`);
});

test("value records separate cited facts, estimates, and gated disclosure", () => {
    for (const token of ["exact_cited", "cited_range", "analyst_estimate", "estimate_methodology", "estimate_confidence", "value_visibility", "weekly_tracker_value_state_fields"]) assert.ok(sql.includes(token), `missing ${token}`);
});

test("tracker rows, citations, values, and audits are protected with RLS", () => {
    for (const table of ["weekly_lunar_tracker_entries", "weekly_lunar_tracker_sources", "weekly_lunar_tracker_values", "weekly_lunar_tracker_audit"]) assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.ok(sql.includes("audit_weekly_lunar_tracker_change"));
    assert.ok(sql.includes("app_private.can_read_tracker_tier"));
});
