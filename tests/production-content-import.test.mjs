import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

const result = await build({
    entryPoints: ["lib/content/production-import.ts"],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`;
const { applyApprovedEditorialApprovers, applyApprovedSourceRegistry, validateProductionImportManifest } = await import(moduleUrl);

const now = new Date("2026-07-14T20:00:00Z");
const sourceId = "11111111-1111-4111-8111-111111111111";
const approverId = "22222222-2222-4222-8222-222222222222";

function record(overrides = {}) {
    return {
        record_key: "story:lunar-brief",
        content_type: "cms_story",
        title: "Reviewed lunar market brief",
        body_copy: "Final reviewed production copy for the lunar market brief.",
        approved_by: approverId,
        approved_at: "2026-07-14T19:00:00Z",
        citation_urls: ["https://www.nasa.gov/reference"],
        source_registry_ids: [sourceId],
        expires_at: "2026-08-14T20:00:00Z",
        assets: [{ reference: "content-submissions/story/hero.webp", review_status: "reviewed", alt_text: "Reviewed lunar surface mission image" }],
        payload: { slug: "lunar-brief", public_summary: "Reviewed summary", public_teaser_markdown: "Reviewed teaser", body_markdown: "Reviewed full story body" },
        ...overrides,
    };
}

test("accepts a complete reviewed production manifest", () => {
    const validated = validateProductionImportManifest({ manifest_version: "1.0", records: [record()] }, now);
    const checked = applyApprovedSourceRegistry(
        applyApprovedEditorialApprovers(validated, new Set([approverId])),
        new Set([sourceId]),
    );
    assert.deepEqual(checked.records[0].blockers, []);
});

test("rejects an approver without an active editor or admin role", () => {
    const validated = validateProductionImportManifest({ manifest_version: "1.0", records: [record()] }, now);
    const checked = applyApprovedEditorialApprovers(validated, new Set());
    assert.ok(checked.records[0].blockers.includes("approver_not_editor_or_admin"));
});

test("rejects placeholder copy, unreviewed images, and unapproved sources", () => {
    const validated = validateProductionImportManifest({ manifest_version: "1.0", records: [record({
        body_copy: "Placeholder content for launch.",
        assets: [{ reference: "https://example.com/image.png", review_status: "pending", alt_text: "short" }],
    })] }, now);
    const checked = applyApprovedSourceRegistry(validated, new Set());
    assert.ok(checked.records[0].blockers.includes("placeholder_copy_prohibited"));
    assert.ok(checked.records[0].blockers.includes("unreviewed_or_incomplete_asset"));
    assert.ok(checked.records[0].blockers.includes("source_not_approved_for_publication"));
});

test("rejects missing approval, citations, expiration, and fixture route mismatch", () => {
    const validated = validateProductionImportManifest({ manifest_version: "1.0", records: [record({
        content_type: "auth_request_access",
        approved_by: "",
        citation_urls: [],
        expires_at: "2026-07-14T19:00:00Z",
        payload: { route: "/upgrade" },
    })] }, now);
    const blockers = validated.records[0].blockers;
    for (const expected of ["valid_approver_required", "https_citations_required", "future_expiration_required", "fixture_route_mismatch"]) {
        assert.ok(blockers.includes(expected), expected);
    }
});
