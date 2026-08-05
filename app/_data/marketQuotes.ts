import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";

export type TickerItem = {
    rank: number;
    symbol: string;
    label: string;
    value: string;
    detail: string;
    trend: "up" | "down" | "flat";
    quoteAsOfAt: string;
    marketCapUsd: number;
    sourceName: string;
    sourceUrl: string | null;
};

type RankingRow = {
    company_id: string;
    rank_number: number;
    ranking_metric_value: number;
};

type QuoteRow = {
    company_id: string;
    company_name_snapshot: string;
    ticker_symbol_snapshot: string;
    exchange_code_snapshot: string;
    quote_as_of_at: string;
    source_name: string;
    source_url: string | null;
    source_retrieved_at: string;
    delay_minutes: number;
    currency_code: string;
    last_price: number;
    price_change: number | null;
    price_change_percent: number | null;
};

function formatPrice(value: number, currencyCode: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

function formatPercent(value: number | null) {
    if (value == null) {
        return "No change";
    }

    const sign = value > 0 ? "+" : "";

    return `${sign}${value.toFixed(2)}%`;
}

function trendFor(value: number | null): TickerItem["trend"] {
    if (value == null || value === 0) {
        return "flat";
    }

    return value > 0 ? "up" : "down";
}

function quoteToTickerItem(quote: QuoteRow, ranking: RankingRow): TickerItem {
    return {
        rank: ranking.rank_number,
        symbol: quote.ticker_symbol_snapshot,
        label: quote.company_name_snapshot,
        value: `${formatPrice(
            quote.last_price,
            quote.currency_code
        )} ${formatPercent(quote.price_change_percent)}`,
        detail: `${quote.delay_minutes}m delay | ${quote.source_name}`,
        trend: trendFor(quote.price_change),
        quoteAsOfAt: quote.quote_as_of_at,
        marketCapUsd: Number(ranking.ranking_metric_value),
        sourceName: quote.source_name,
        sourceUrl: quote.source_url,
    };
}

export async function loadPublicTickerItems(limit = 4): Promise<TickerItem[]> {
    if (!hasPotomacSupabasePublicConfig()) {
        return [];
    }

    try {
        const supabase = await createClient();
        const { data: rankingRun, error: rankingRunError } = await supabase
            .from("public_space_company_ranking_runs")
            .select("id")
            .eq("publication_status", "published")
            .eq("ranking_metric", "market_cap_usd")
            .order("ranking_date", { ascending: false })
            .order("published_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (rankingRunError || !rankingRun) return [];

        const { data: rankings, error: rankingsError } = await supabase
            .from("public_space_company_rankings")
            .select("company_id,rank_number,ranking_metric_value")
            .eq("ranking_run_id", rankingRun.id)
            .order("rank_number", { ascending: true })
            .limit(limit);

        if (rankingsError || !rankings?.length) return [];

        const companyIds = rankings.map((ranking) => ranking.company_id);
        const { data, error } = await supabase
            .from("public_space_company_quotes")
            .select(
                "company_id,company_name_snapshot,ticker_symbol_snapshot,exchange_code_snapshot,quote_as_of_at,source_name,source_url,source_retrieved_at,delay_minutes,currency_code,last_price,price_change,price_change_percent"
            )
            .in("company_id", companyIds)
            .eq("is_displayable", true)
            .lte("quote_as_of_at", new Date().toISOString())
            .order("quote_as_of_at", { ascending: false })
            .limit(60);

        if (error || !data?.length) {
            return [];
        }

        const quotesByCompany = new Map<string, QuoteRow>();

        for (const quote of data as QuoteRow[]) {
            if (!quotesByCompany.has(quote.company_id)) {
                quotesByCompany.set(quote.company_id, quote);
            }
        }

        return (rankings as RankingRow[])
            .map((ranking) => {
                const quote = quotesByCompany.get(ranking.company_id);
                return quote ? quoteToTickerItem(quote, ranking) : null;
            })
            .filter((item): item is TickerItem => item !== null);
    } catch {
        return [];
    }
}
