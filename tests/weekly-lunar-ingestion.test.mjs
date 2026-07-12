import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";

const sql = readFileSync("supabase/migrations/20260712140943_weekly_lunar_tracker_ingestion_workflow.sql", "utf8");
const script = readFileSync("scripts/ingest-weekly-lunar-tracker.mjs", "utf8");

test("ingestion schema stores run lineage, source checks, conflicts, and review decisions", () => {
    for (const token of ["weekly_lunar_ingestion_runs", "ingestion_run_id", "source_checked_at", "source_conflict", "weekly_lunar_source_conflicts", "weekly_lunar_ingestion_source_checks", "weekly_lunar_review_decisions", "schedule_change_type", "ingestion_confidence"]) assert.ok(sql.includes(token), `missing ${token}`);
});
test("one editor or admin approval publishes reviewed rows", () => {
    assert.ok(sql.includes("review_weekly_lunar_tracker_entry"));
    assert.match(sql, /\['editor','admin'\]/);
    assert.ok(sql.includes("publication_status = case"));
    assert.ok(sql.includes("resolve source conflicts before approval"));
});
test("automated empty states require completed zero-result approved-source runs", () => {
    for (const token of ["No launches this week", "records_relevant = 0", "source_reviewed", "enforce_source_reviewed_empty_state"]) assert.ok(sql.includes(token));
});
test("fixture dry run deduplicates and flags lunar relevance without writing", () => {
    const output = execFileSync(process.execPath, ["scripts/ingest-weekly-lunar-tracker.mjs", "--input", "scripts/weekly-lunar-ingestion-sample.json"], { encoding: "utf8" });
    const result = JSON.parse(output);
    assert.equal(result.dryRun, true);
    assert.equal(result.fetched, 1);
    assert.equal(result.relevant, 1);
    assert.equal(result.entries[0].publication_status, "draft");
    assert.equal(result.entries[0].is_lunar_or_cislunar, true);
});
test("production apply is pinned to canonical Supabase and drafts all ingested rows", () => {
    assert.ok(script.includes("xlpkdoeldtlhearqajat"));
    assert.ok(script.includes('publication_status: "draft"'));
    for (const token of ["slip", "scrub", "hold", "no_earlier_than", "status_change", "source_conflict"]) assert.ok(sql.includes(token));
});
