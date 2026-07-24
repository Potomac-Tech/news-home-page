import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { build } from "esbuild";

const sql = readFileSync("supabase/migrations/20260713051127_contract_awards_ingestion_workflow.sql", "utf8");
const hardeningSql = readFileSync("supabase/migrations/20260713052000_contract_awards_rls_performance_hardening.sql", "utf8");
const script = readFileSync("scripts/ingest-contract-awards.mjs", "utf8");
const relevanceOutput = path.join(mkdtempSync(path.join(tmpdir(), "contract-relevance-")), "contract-relevance.mjs");
await build({
    entryPoints: ["lib/trackers/contract-relevance.ts"],
    outfile: relevanceOutput,
    bundle: true,
    platform: "node",
    format: "esm",
});
const { isDirectLunarContract } = await import(pathToFileURL(relevanceOutput).href);

test("contract award schema captures dates, parties, vehicle, value state, review, lineage, and tier visibility", () => {
    for (const token of ["award_date", "effective_date", "option_exercise_date", "customer_name", "vendor_name", "program_name", "award_vehicle", "contract_award_values", "value_state", "tier_visibility", "value_visibility", "source_registry_id", "confidence_label", "reviewed_by", "reviewed_at", "contract_award_audit_log"]) assert.ok(sql.includes(token), `missing ${token}`);
});

test("publication requires direct relevance, an approved registry source, citation, and one editor or admin review", () => {
    for (const token of ["is_space_or_lunar_relevant", "published contract award requires an approved source registry entry", "published contract award requires a primary citation", "review_contract_award", "array['editor','admin']"]) assert.ok(sql.includes(token), `missing ${token}`);
});

test("contract award tables use RLS and entitlement-aware visibility", () => {
    for (const table of ["contract_award_ingestion_runs", "contract_awards", "contract_award_values", "contract_award_citations", "contract_award_source_checks", "contract_award_review_decisions", "contract_award_audit_log"]) assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    assert.ok(sql.includes("app_private.can_read_tracker_tier"));
});

test("review workflow uses RLS-backed security invoker and indexed foreign keys", () => {
    assert.ok(hardeningSql.includes("security invoker"));
    assert.ok(hardeningSql.includes("Editors and admins insert contract award review decisions"));
    for (const token of ["contract_award_runs_source_idx", "contract_awards_reviewed_by_idx", "contract_award_values_reviewed_by_idx", "contract_award_citations_created_by_idx", "contract_award_reviews_reviewer_idx", "contract_award_audit_actor_idx"]) assert.ok(hardeningSql.includes(token), `missing ${token}`);
    assert.ok(hardeningSql.includes("Authenticated read entitled or staff contract awards"));
});

test("dry run includes lunar award and excludes unrelated defense award", () => {
    const output = execFileSync(process.execPath, ["scripts/ingest-contract-awards.mjs", "--input", "scripts/contract-awards-sample.json"], { encoding: "utf8" });
    const result = JSON.parse(output);
    assert.equal(result.dryRun, true);
    assert.equal(result.fetched, 3);
    assert.equal(result.relevant, 1);
    assert.equal(result.excluded, 2);
    assert.equal(result.awards[0].award.publication_status, "draft");
    assert.equal(result.awards[0].award.relevance_scope, "lunar");
});

test("Gateway-only awards require NASA or explicit space context", () => {
    assert.equal(
        isDirectLunarContract(
            "NATIONAL INSTITUTES OF HEALTH GATEWAY TO RESEARCH OPPORTUNITIES FOR THE WORKFORCE",
            "Department of Health and Human Services"
        ),
        false
    );
    assert.equal(
        isDirectLunarContract(
            "Gateway logistics and habitation systems",
            "National Aeronautics and Space Administration"
        ),
        true
    );
    assert.equal(
        isDirectLunarContract("Artemis III suit ancillary hardware", "National Aeronautics and Space Administration"),
        true
    );
});

test("production writes are pinned to canonical Supabase and approved source keys", () => {
    assert.ok(script.includes("xlpkdoeldtlhearqajat"));
    for (const token of ["usaspending-awards-api", "sam-gov-contract-awards", "sec-edgar-company-filings", "strict_space_relevance", 'publication_status: "draft"']) assert.ok(script.includes(token), `missing ${token}`);
});

test("exact contract values require a citation URL", () => {
    assert.ok(script.includes("citationUrl && Number.isFinite(exact)"));
    assert.ok(sql.includes("value_state = 'exact_cited' and exact_cited_amount is not null and source_registry_id is not null and source_citation_url is not null"));
});
