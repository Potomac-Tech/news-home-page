import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("Alpha Vantage refresh uses a server-only key and validated end-of-day quotes", () => {
    const source = read("lib/trackers/alpha-vantage.ts");
    assert.match(source, /process\.env\.ALPHA_VANTAGE_API_KEY/);
    assert.doesNotMatch(source, /NEXT_PUBLIC_ALPHA_VANTAGE/);
    assert.match(source, /function.*GLOBAL_QUOTE/s);
    assert.match(source, /Alpha Vantage end-of-day quote/);
    assert.match(source, /returnedSymbol !== symbol\.toUpperCase\(\)/);
    assert.match(source, /REQUEST_SPACING_MS = 12_000/);
    assert.match(source, /for \(const \[index, ranking\] of rankings\.entries\(\)\)/);
    assert.match(source, /await wait\(REQUEST_SPACING_MS\)/);
    assert.match(source, /DAILY_CALL_CAP = 20/);
});

test("free-tier schedule uses two five-symbol weekday batches and a hard quota guard", () => {
    const migration = read(
        "supabase/migrations/20260722153519_alpha_vantage_stock_refresh.sql"
    );
    assert.match(migration, /calls_reserved between 1 and 20/);
    assert.match(migration, /pg_advisory_xact_lock/);
    assert.match(migration, /v_reserved \+ v_requested > p_daily_cap/);
    assert.match(migration, /15 22 \* \* 1-5/);
    assert.match(migration, /17 22 \* \* 1-5/);
    assert.match(migration, /jsonb_build_object\('batch', p_batch\)/);
    assert.match(migration, /revoke all on function public\.claim_alpha_vantage_stock_refresh[\s\S]*anon, authenticated/);
});

test("internal tracker route accepts the protected stock quote job", () => {
    const route = read("app/api/internal/trackers/ingest/route.ts");
    const ingestion = read("lib/trackers/production-ingestion.ts");
    assert.match(route, /value === "stock-quotes"/);
    assert.match(ingestion, /ingestAlphaVantageStockQuotes\(payload\)/);
});

test("production stock refresh runs through a protected Supabase Edge Function", () => {
    const edgeFunction = read(
        "supabase/functions/ingest-alpha-vantage-stock-quotes/index.ts"
    );
    const migration = read(
        "supabase/migrations/20260723194855_route_alpha_vantage_refresh_through_edge_function.sql"
    );
    const config = read("supabase/config.toml");
    assert.match(edgeFunction, /ALPHA_VANTAGE_INGESTION_SECRET/);
    assert.match(edgeFunction, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.match(edgeFunction, /claim_alpha_vantage_stock_refresh/);
    assert.match(edgeFunction, /REQUEST_SPACING_MS = 12_000/);
    assert.doesNotMatch(edgeFunction, /NEXT_PUBLIC_ALPHA_VANTAGE/);
    assert.match(migration, /alpha_vantage_ingestion_url/);
    assert.match(migration, /alpha_vantage_ingestion_secret/);
    assert.match(migration, /timeout_milliseconds := 55000/);
    assert.match(config, /\[functions\.ingest-alpha-vantage-stock-quotes\][\s\S]*verify_jwt = false/);
});
