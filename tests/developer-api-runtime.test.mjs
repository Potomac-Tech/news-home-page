import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseSafeWebhookDestination } from "../lib/developer/webhook-destination.ts";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/20260713232940_runtime_paid_developer_api.sql");
const apiRuntime = read("lib/developer/api-runtime.ts");
const worker = read("lib/developer/worker.ts");
const formats = read("lib/developer/formats.ts");
const docs = read("docs/developer-api.md");
const webhookRoute = read("app/api/member/developer/webhooks/route.ts");
const webhookDestination = read("lib/developer/webhook-destination.ts");

test("API keys are hashed and claims enforce scopes, tiers, and quota", () => {
    assert.match(apiRuntime, /createHash\("sha256"\)/);
    assert.match(migration, /scope_not_allowed/);
    assert.match(migration, /tier_not_entitled/);
    assert.match(migration, /monthly_quota_exceeded/);
    assert.match(migration, /for update/);
    assert.match(migration, /revoke all on function public\.claim_developer_api_request/);
});

test("exports support private CSV, PDF, JSON jobs and signed downloads", () => {
    assert.match(migration, /'developer-exports'/);
    assert.match(migration, /false,\s*52428800/);
    assert.match(formats, /export function toCsv/);
    assert.match(formats, /%PDF-1\.4/);
    assert.match(worker, /export_format === "pdf"/);
    assert.match(read("app/api/v1/exports/[id]/download/route.ts"), /createSignedUrl\(job\.storage_path, 300/);
});

test("webhooks use Vault, HMAC signatures, and bounded retry backoff", () => {
    assert.match(migration, /vault\.create_secret/);
    assert.match(migration, /attempt_count >= 8/);
    assert.match(migration, /power\(2, delivery\.attempt_count\)/);
    assert.match(worker, /createHmac\("sha256"/);
    assert.match(worker, /X-Cabeus-Signature/);
    assert.match(worker, /AbortSignal\.timeout\(10000\)/);
    assert.match(worker, /redirect: "manual"/);
    assert.match(worker, /parseSafeWebhookDestination/);
    assert.match(webhookRoute, /parseSafeWebhookDestination/);
    assert.match(webhookDestination, /isBlockedIpv4/);
    assert.match(webhookDestination, /isBlockedIpv6/);
});

test("webhook destinations reject internal networks, unsafe ports, credentials, and redirects", () => {
    assert.equal(
        parseSafeWebhookDestination("https://hooks.example.org/cabeus#fragment"),
        "https://hooks.example.org/cabeus"
    );

    for (const endpoint of [
        "http://hooks.example.org/cabeus",
        "https://localhost/cabeus",
        "https://127.0.0.1/cabeus",
        "https://10.1.2.3/cabeus",
        "https://169.254.169.254/latest/meta-data",
        "https://[::1]/cabeus",
        "https://service.internal/cabeus",
        "https://user:password@hooks.example.org/cabeus",
        "https://hooks.example.org:8443/cabeus",
    ]) {
        assert.throws(() => parseSafeWebhookDestination(endpoint), /public HTTPS URL/);
    }
});

test("developer documentation lists every live versioned route and error contract", () => {
    for (const route of ["/api/v1/articles", "/api/v1/lunar-missions", "/api/v1/procurement-regulatory", "/api/v1/companies", "/api/v1/command/briefs", "/api/v1/exports"]) {
        assert.ok(docs.includes(route), `missing ${route}`);
    }
    assert.match(docs, /invalid_api_key/);
    assert.match(docs, /HMAC-SHA256/);
});
