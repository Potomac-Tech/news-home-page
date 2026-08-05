import { createClient } from "npm:@supabase/supabase-js@2.110.0";

const ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query";
const BATCH_SIZE = 5;
const DAILY_CALL_CAP = 20;
const REQUEST_SPACING_MS = 12_000;

declare const Deno: {
    env: { get(name: string): string | undefined };
    serve(handler: (request: Request) => Response | Promise<Response>): void;
};

type RankingRow = {
    company_id: string;
    company_name_snapshot: string;
    ticker_symbol_snapshot: string;
    exchange_code_snapshot: string;
};

type Quote = {
    "01. symbol"?: string;
    "05. price"?: string;
    "07. latest trading day"?: string;
    "08. previous close"?: string;
    "09. change"?: string;
    "10. change percent"?: string;
};

function numberValue(value: string | undefined) {
    const parsed = Number(value?.replace("%", ""));
    return Number.isFinite(parsed) ? parsed : null;
}

function wait(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchQuote(symbol: string, apiKey: string) {
    const url = new URL(ALPHA_VANTAGE_URL);
    url.searchParams.set("function", "GLOBAL_QUOTE");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("apikey", apiKey);
    const response = await fetch(url, {
        headers: {
            accept: "application/json",
            "user-agent": "CabeusExplorer/1.0 info@potomacdb.com",
        },
    });
    if (!response.ok) throw new Error(`provider_http_${response.status}`);

    const payload = await response.json() as {
        "Global Quote"?: Quote;
        Information?: string;
        Note?: string;
        "Error Message"?: string;
    };
    if (payload.Note) throw new Error("provider_rate_limit");
    if (payload.Information) throw new Error("provider_information");
    if (payload["Error Message"]) throw new Error("provider_symbol");

    const quote = payload["Global Quote"];
    const returnedSymbol = quote?.["01. symbol"]?.toUpperCase();
    const price = numberValue(quote?.["05. price"]);
    const previousClose = numberValue(quote?.["08. previous close"]);
    const tradingDate = quote?.["07. latest trading day"];
    if (
        returnedSymbol !== symbol.toUpperCase() ||
        price == null ||
        price < 0 ||
        !tradingDate ||
        !/^\d{4}-\d{2}-\d{2}$/.test(tradingDate)
    ) {
        throw new Error("provider_invalid_quote");
    }
    return {
        price,
        previousClose,
        change: numberValue(quote?.["09. change"]),
        changePercent: numberValue(quote?.["10. change percent"]),
    };
}

Deno.serve(async (request) => {
    const ingestionSecret = Deno.env.get("ALPHA_VANTAGE_INGESTION_SECRET")?.trim();
    if (!ingestionSecret || request.headers.get("x-ingestion-secret") !== ingestionSecret) {
        return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const apiKey = Deno.env.get("ALPHA_VANTAGE_API_KEY")?.trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    if (!apiKey || !supabaseUrl || !serviceRoleKey) {
        return Response.json({ error: "Server configuration unavailable." }, { status: 500 });
    }

    const body = await request.json().catch(() => null) as { batch?: unknown } | null;
    const batch = Number(body?.batch);
    if (!Number.isInteger(batch) || batch < 0 || batch > 1) {
        return Response.json({ error: "Batch must be 0 or 1." }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: rankingRun, error: rankingRunError } = await supabase
        .from("public_space_company_ranking_runs")
        .select("id")
        .eq("publication_status", "published")
        .eq("ranking_metric", "market_cap_usd")
        .order("ranking_date", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(1)
        .single();
    if (rankingRunError || !rankingRun) {
        return Response.json({ error: "Published stock ranking is unavailable." }, { status: 503 });
    }

    const { data: rankingData, error: rankingError } = await supabase
        .from("public_space_company_rankings")
        .select("company_id,company_name_snapshot,ticker_symbol_snapshot,exchange_code_snapshot")
        .eq("ranking_run_id", rankingRun.id)
        .order("rank_number", { ascending: true })
        .range(batch * BATCH_SIZE, batch * BATCH_SIZE + BATCH_SIZE - 1);
    if (rankingError || !rankingData?.length) {
        return Response.json({ error: "Stock quote batch is unavailable." }, { status: 503 });
    }

    const rankings = rankingData as RankingRow[];
    const symbols = rankings.map((row) => row.ticker_symbol_snapshot.toUpperCase());
    const { data: runId, error: claimError } = await supabase.rpc(
        "claim_alpha_vantage_stock_refresh",
        { p_symbols: symbols, p_daily_cap: DAILY_CALL_CAP },
    );
    if (claimError) return Response.json({ error: claimError.message }, { status: 500 });
    if (!runId) {
        return Response.json({
            skipped: true,
            reason: "daily_call_cap",
            batch,
            requested: symbols.length,
            dailyCallCap: DAILY_CALL_CAP,
        });
    }

    const retrievedAt = new Date().toISOString();
    const rows = [];
    const failures = [];
    for (const [index, ranking] of rankings.entries()) {
        try {
            const quote = await fetchQuote(ranking.ticker_symbol_snapshot, apiKey);
            rows.push({
                company_id: ranking.company_id,
                company_name_snapshot: ranking.company_name_snapshot,
                ticker_symbol_snapshot: ranking.ticker_symbol_snapshot,
                exchange_code_snapshot: ranking.exchange_code_snapshot,
                quote_as_of_at: retrievedAt,
                source_name: "Alpha Vantage end-of-day quote",
                source_url: `${ALPHA_VANTAGE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ranking.ticker_symbol_snapshot)}`,
                source_retrieved_at: retrievedAt,
                delay_minutes: 1440,
                currency_code: "USD",
                last_price: quote.price,
                price_change: quote.change ??
                    (quote.previousClose == null ? null : quote.price - quote.previousClose),
                price_change_percent: quote.changePercent,
                market_state: "end_of_day",
                is_displayable: true,
            });
        } catch (error) {
            failures.push({
                symbol: symbols[index],
                error: error instanceof Error ? error.message : "provider_unavailable",
            });
        }
        if (index < rankings.length - 1) await wait(REQUEST_SPACING_MS);
    }

    let writeError: string | null = null;
    if (rows.length) {
        const { error } = await supabase.from("public_space_company_quotes").insert(rows);
        writeError = error?.message ?? null;
    }
    const status = writeError
        ? "failed"
        : failures.length
          ? rows.length ? "partial" : "failed"
          : "completed";
    await supabase
        .from("stock_quote_ingestion_runs")
        .update({
            status,
            calls_completed: rankings.length,
            symbols_updated: writeError ? 0 : rows.length,
            completed_at: new Date().toISOString(),
            error_summary: writeError ??
                (failures.length ? `${failures.length} provider quote(s) unavailable.` : null),
            metadata: { batch, failures, runtime: "supabase_edge" },
        })
        .eq("id", runId);

    return Response.json({
        skipped: false,
        runId,
        batch,
        calls: rankings.length,
        updated: writeError ? 0 : rows.length,
        failed: failures.length,
        source: "Alpha Vantage end-of-day quote",
    });
});
