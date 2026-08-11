import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("request hosts, callbacks, and checkout redirects use a trusted origin", () => {
    const origin = read("lib/http/request-origin.ts");
    const middleware = read("middleware.ts");
    const checkout = read("app/api/stripe/scout-checkout/route.ts");
    const resend = read("app/api/auth/resend-verification/route.ts");

    assert.match(origin, /isTrustedRequestHostname/);
    assert.match(origin, /isTrustedRequestHostHeader/);
    assert.match(origin, /www\.cabeusexplorer\.com/);
    assert.match(middleware, /status: 421/);
    assert.match(middleware, /headers\.get\("host"\)/);
    assert.match(middleware, /headers\.get\("x-forwarded-host"\)/);
    assert.match(checkout, /trustedRequestOrigin\(request\.url\)/);
    assert.match(resend, /trustedRequestOrigin\(requestUrl\)/);
});

test("security headers block inline event handlers and legacy cross-domain policy files", () => {
    const config = read("next.config.mjs");
    assert.match(config, /script-src-attr 'none'/);
    assert.match(config, /X-Permitted-Cross-Domain-Policies/);
    assert.match(config, /poweredByHeader: false/);
});

test("developer API request identifiers are bounded before logging or response use", () => {
    const runtime = read("lib/developer/api-runtime.ts");
    assert.match(runtime, /\^\[A-Za-z0-9\._:\-\]\{1,100\}\$/);
    assert.match(runtime, /requestIdentifier\(request\)/);
});

test("editorial, Word, and spreadsheet uploads verify file signatures", () => {
    const media = read("lib/editorial/media-assets.ts");
    const documents = read("lib/editorial/source-documents.ts");
    const datasets = read("app/api/member/test-data/uploads/route.ts");

    assert.match(media, /hasExpectedMediaSignature/);
    assert.match(media, /does not match its declared image or video format/);
    assert.match(documents, /contents do not match the \.docx format/);
    assert.match(datasets, /contents do not match the XLSX format/);
    assert.match(datasets, /CSV uploads must contain plain text data/);
});

test("scheduled ingestion endpoints use POST and digest-based secret comparison", () => {
    const shared = read("supabase/functions/_shared/ingestion-auth.ts");
    const stocks = read("supabase/functions/ingest-alpha-vantage-stock-quotes/index.ts");
    const contracts = read("supabase/functions/ingest-usaspending-contract-awards/index.ts");

    assert.match(shared, /crypto\.subtle\.digest\("SHA-256"/);
    assert.match(shared, /difference \|=/);
    for (const source of [stocks, contracts]) {
        assert.match(source, /request\.method !== "POST"/);
        assert.match(source, /ingestionSecretMatches/);
        assert.doesNotMatch(source, /headers\.get\("x-ingestion-secret"\) !==/);
    }
});

test("database hardening removes direct interest inserts and internal-table grants", () => {
    const migration = read("supabase/migrations/20260811120000_security_audit_hardening.sql");
    assert.match(migration, /drop policy if exists "command_interest_insert_public"/);
    assert.match(migration, /revoke all on table public\.command_interest_requests from anon/);
    assert.match(migration, /grant select, update, delete on table public\.command_interest_requests to authenticated/);
    assert.match(migration, /revoke all on table public\.tracker_source_snapshots from anon, authenticated/);
    assert.match(migration, /set search_path = ''/);
});

test("content destinations reject executable and insecure URL schemes", () => {
    const actions = read("app/admin/content/actions.ts");
    assert.match(actions, /Destination URLs must use HTTPS or a local site path/);
    assert.match(actions, /destination_url: destination\(formData\)/);
});
