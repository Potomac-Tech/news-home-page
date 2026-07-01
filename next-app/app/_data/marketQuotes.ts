import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";

export type TickerItem = {
    symbol: string;
    label: string;
    value: string;
    detail: string;
    trend: "up" | "down" | "flat";
};

type QuoteRow = {
    company_id: string;
    company_name_snapshot: string;
    ticker_symbol_snapshot: string;
    exchange_code_snapshot: string;
    quote_as_of_at: string;
    source_name: string;
    source_retrieved_at: string;
    delay_minutes: number;
    currency_code: string;
    last_price: number;
    price_change: number | null;
    price_change_percent: number | null;
};

export const fallbackTickerItems: TickerItem[] = [
    {
        symbol: "TOP20",
        label: "Public company ranking",
        value: "Pending",
        detail: "Curated quote feed not connected",
        trend: "flat",
    },
    {
        symbol: "DATA",
        label: "Mission data rights",
        value: "Watching",
        detail: "Member brief",
        trend: "flat",
    },
    {
        symbol: "PRXY",
        label: "Resource proxy model",
        value: "20 assets",
        detail: "Commodity setup queued",
        trend: "flat",
    },
    {
        symbol: "CMD",
        label: "Command intelligence",
        value: "Org-level",
        detail: "Manual access",
        trend: "flat",
    },
];

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

function quoteToTickerItem(quote: QuoteRow): TickerItem {
    return {
        symbol: quote.ticker_symbol_snapshot,
        label: quote.company_name_snapshot,
        value: `${formatPrice(
            quote.last_price,
            quote.currency_code
        )} ${formatPercent(quote.price_change_percent)}`,
        detail: `${quote.delay_minutes}m delay | ${quote.source_name}`,
        trend: trendFor(quote.price_change),
    };
}

export async function loadPublicTickerItems(limit = 4): Promise<TickerItem[]> {
    if (!hasPotomacSupabasePublicConfig()) {
        return fallbackTickerItems.slice(0, limit);
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("public_space_company_quotes")
            .select(
                "company_id,company_name_snapshot,ticker_symbol_snapshot,exchange_code_snapshot,quote_as_of_at,source_name,source_retrieved_at,delay_minutes,currency_code,last_price,price_change,price_change_percent"
            )
            .eq("is_displayable", true)
            .lte("quote_as_of_at", new Date().toISOString())
            .order("quote_as_of_at", { ascending: false })
            .limit(60);

        if (error || !data?.length) {
            return fallbackTickerItems.slice(0, limit);
        }

        const seenCompanies = new Set<string>();
        const tickerItems: TickerItem[] = [];

        for (const quote of data as QuoteRow[]) {
            if (seenCompanies.has(quote.company_id)) {
                continue;
            }

            seenCompanies.add(quote.company_id);
            tickerItems.push(quoteToTickerItem(quote));

            if (tickerItems.length === limit) {
                break;
            }
        }

        return tickerItems.length
            ? tickerItems
            : fallbackTickerItems.slice(0, limit);
    } catch {
        return fallbackTickerItems.slice(0, limit);
    }
}
