import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync("supabase/migrations/20260712110940_seed_lunar_tracker_sources.sql", "utf8");

test("tracker registry includes required official, commercial, and cross-check sources", () => {
    for (const key of ["launch-library-2", "nasa-launch-schedule", "nasa-clps", "space-force-news", "spaceflight-now-schedule", "next-spaceflight-calendar", "sam-gov-contract-awards", "usaspending-awards-api", "sec-edgar-company-filings", "intuitive-machines-official", "firefly-aerospace-official", "astrobotic-official"]) assert.ok(sql.includes(key), `missing ${key}`);
});

test("every registry seed carries operational ownership and citation metadata", () => {
    for (const token of ["job_owner", "refresh_frequency", "parser_key", "job_name", "citation_required", "citation_format", "quality_score", "confidence_label", "analyst_review_state"]) assert.ok(sql.includes(token), `missing ${token}`);
});

test("commercial cross-check sources stay unpublished pending terms review", () => {
    for (const key of ["spaceflight-now-schedule", "next-spaceflight-calendar"]) {
        const row = sql.slice(sql.indexOf(`('${key}'`), sql.indexOf(`('${key}'`) + 1000);
        assert.ok(row.includes("'queued'"));
        assert.ok(row.includes("'in_review'"));
        assert.ok(row.includes("'draft'"));
    }
});

test("publishing guard and read policies require approved sources", () => {
    assert.ok(sql.includes("enforce_weekly_tracker_approved_sources"));
    assert.match(sql, /license_status = 'approved'/);
    assert.match(sql, /analyst_review_state = 'approved'/);
    assert.match(sql, /publication_status = 'published'/);
    assert.match(sql, /published tracker content requires an approved source registry record/);
});
