import "server-only";

import { createServiceClient } from "../supabase/service";

const ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query";
const BATCH_SIZE = 5;
const DAILY_CALL_CAP = 20;

type RankingRow = {
    company_id: string;
    rank_number: number;
    company_name_snapshot: string;
    ticker_symbol_snapshot: string;
    exchange_code_snapshot: string;
};

type GlobalQuote = {
    "01. symbol"?: string;
    "05. price"?: string;
    "07. latest trading day"?: string;
    "08. previous close"?: string;
    "09. change"?: string;
    "10. change percent"?: string;
};

type GlobalQuoteResponse = {
    "Global Quote"?: GlobalQuote;
    Information?: string;
    Note?: string;
    "Error Message"?: string;
};

function numberValue(value: string | undefined) {
    const parsed = Number(value?.replace("%", ""));
    return Number.isFinite(parsed) ? parsed : null;
}

async function fetchQuote(symbol: string) {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY?.trim();
    if (!apiKey) throw new Error("Missing ALPHA_VANTAGE_API_KEY.");

    const url = new URL(ALPHA_VANTAGE_URL);
    url.searchParams.set("function", "GLOBAL_QUOTE");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("apikey", apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    let response: Response;
    try {
        response = await fetch(url, {
            headers: { accept: "application/json" },
            signal: controller.signal,
            cache: "no-store",
        });
    } catch {
        throw new Error(`Alpha Vantage request failed for ${symbol}.`);
    } finally {
        clearTimeout(timeout);
    }
    if (!response.ok) throw new Error(`Alpha Vantage returned ${response.status} for ${symbol}.`);

    const payload = (await response.json()) as GlobalQuoteResponse;
    if (payload.Information || payload.Note || payload["Error Message"]) {
        throw new Error(`Alpha Vantage did not return a quote for ${symbol}.`);
    }

    const quote = payload["Global Quote"];
    const returnedSymbol = quote?.["01. symbol"]?.toUpperCase();
    const price = numberValue(quote?.["05. price"]);
    const previousClose = numberValue(quote?.["08. previous close"]);
    const change = numberValue(quote?.["09. change"]);
    const changePercent = numberValue(quote?.["10. change percent"]);
    const tradingDate = quote?.["07. latest trading day"];

    if (
        returnedSymbol !== symbol.toUpperCase() ||
        price == null ||
        price < 0 ||
        !tradingDate ||
        !/^\d{4}-\d{2}-\d{2}$/.test(tradingDate)
    ) {
        throw new Error(`Alpha Vantage returned an invalid quote for ${symbol}.`);
    }

    return { price, previousClose, change, changePercent, tradingDate };
}

export async function ingestAlphaVantageStockQuotes(payload?: unknown) {
    const batch =
        payload && typeof payload === "object" && "batch" in payload
            ? Number((payload as { batch?: unknown }).batch)
            : 0;
    if (!Number.isInteger(batch) || batch < 0 || batch > 1) {
        throw new Error("Alpha Vantage stock batch must be 0 or 1.");
    }
    if (!process.env.ALPHA_VANTAGE_API_KEY?.trim()) {
        throw new Error("Missing ALPHA_VANTAGE_API_KEY.");
    }

    const supabase = createServiceClient();
    const { data: rankingRun, error: rankingRunError } = await supabase
        .from("public_space_company_ranking_runs")
        .select("id")
        .eq("publication_status", "published")
        .eq("ranking_metric", "market_cap_usd")
        .order("ranking_date", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(1)
        .single();
    if (rankingRunError || !rankingRun) throw new Error("Published stock ranking is unavailable.");

    const { data: rankingData, error: rankingError } = await supabase
        .from("public_space_company_rankings")
        .select(
            "company_id,rank_number,company_name_snapshot,ticker_symbol_snapshot,exchange_code_snapshot"
        )
        .eq("ranking_run_id", rankingRun.id)
        .order("rank_number", { ascending: true })
        .range(batch * BATCH_SIZE, batch * BATCH_SIZE + BATCH_SIZE - 1);
    if (rankingError || !rankingData?.length) throw new Error("Stock quote batch is unavailable.");

    const rankings = rankingData as RankingRow[];
    const symbols = rankings.map((row) => row.ticker_symbol_snapshot.toUpperCase());
    const { data: runId, error: claimError } = await supabase.rpc(
        "claim_alpha_vantage_stock_refresh",
        { p_symbols: symbols, p_daily_cap: DAILY_CALL_CAP }
    );
    if (claimError) throw new Error(claimError.message);
    if (!runId) {
        return {
            skipped: true,
            reason: "daily_call_cap",
            batch,
            requested: symbols.length,
            dailyCallCap: DAILY_CALL_CAP,
        };
    }

    const retrievedAt = new Date().toISOString();
    const results = await Promise.allSettled(
        rankings.map(async (ranking) => ({
            ranking,
            quote: await fetchQuote(ranking.ticker_symbol_snapshot),
        }))
    );
    const rows = results.flatMap((result) => {
        if (result.status !== "fulfilled") return [];
        const { ranking, quote } = result.value;
        return [{
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
            price_change:
                quote.change ??
                (quote.previousClose == null ? null : quote.price - quote.previousClose),
            price_change_percent: quote.changePercent,
            market_state: "end_of_day",
            is_displayable: true,
        }];
    });
    const failures = results.flatMap((result, index) => {
        if (result.status !== "rejected") return [];
        const error =
            result.reason instanceof Error && result.reason.message.startsWith("Alpha Vantage")
                ? result.reason.message
                : "Provider quote unavailable.";
        return [{ symbol: symbols[index], error }];
    });

    let writeError: string | null = null;
    if (rows.length) {
        const { error } = await supabase.from("public_space_company_quotes").insert(rows);
        writeError = error?.message ?? null;
    }

    const status = writeError
        ? "failed"
        : failures.length
          ? rows.length
              ? "partial"
              : "failed"
          : "completed";
    const { error: finishError } = await supabase
        .from("stock_quote_ingestion_runs")
        .update({
            status,
            calls_completed: results.length,
            symbols_updated: writeError ? 0 : rows.length,
            completed_at: new Date().toISOString(),
            error_summary: writeError ?? (failures.length ? `${failures.length} provider quote(s) unavailable.` : null),
            metadata: { batch, failures },
        })
        .eq("id", runId);
    if (finishError) throw new Error(finishError.message);
    if (writeError) throw new Error(writeError);

    return {
        skipped: false,
        runId,
        batch,
        calls: results.length,
        updated: rows.length,
        failed: failures.length,
        source: "Alpha Vantage end-of-day quote",
    };
}
