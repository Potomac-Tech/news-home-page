import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";

export type PublicEconomySummary = {
    scenarioKey: string;
    scenarioLabel: string;
    headlineValue: number;
    rangeLowValue: number | null;
    rangeHighValue: number | null;
    currencyCode: string;
    outputDate: string;
    confidenceScore: number;
    confidenceLabel: string;
    methodologyNote: string;
    sourceCount: number;
    freshnessAt: string;
    isFallback: boolean;
};

type EconomyDailyOutputRow = {
    output_date: string;
    scenario_key: string;
    headline_value: number;
    range_low_value: number | null;
    range_high_value: number | null;
    currency_code: string;
    confidence_score: number;
    confidence_label: string;
    methodology_note: string | null;
    source_count: number;
    freshness_at: string;
};

export const fallbackEconomySummary: PublicEconomySummary = {
    scenarioKey: "baseline_full_nasa_paid_cost",
    scenarioLabel: "Baseline full NASA-paid cost",
    headlineValue: 155_000_000,
    rangeLowValue: 147_300_000,
    rangeHighValue: 155_000_000,
    currencyCode: "USD",
    outputDate: "2026-06-26",
    confidenceScore: 72,
    confidenceLabel: "medium",
    methodologyNote:
        "Public benchmark includes Firefly mission delivery, NASA science payload and PRISM cost basis, and the Blue Ghost data addendum.",
    sourceCount: 4,
    freshnessAt: "2026-06-26T12:00:00.000Z",
    isFallback: true,
};

function titleCaseFromKey(value: string) {
    return value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function mapDailyOutput(row: EconomyDailyOutputRow): PublicEconomySummary {
    return {
        scenarioKey: row.scenario_key,
        scenarioLabel: titleCaseFromKey(row.scenario_key),
        headlineValue: row.headline_value,
        rangeLowValue: row.range_low_value,
        rangeHighValue: row.range_high_value,
        currencyCode: row.currency_code,
        outputDate: row.output_date,
        confidenceScore: row.confidence_score,
        confidenceLabel: row.confidence_label,
        methodologyNote:
            row.methodology_note ??
            "Public headline estimate. Approved members can review methodology details and source tables.",
        sourceCount: row.source_count,
        freshnessAt: row.freshness_at,
        isFallback: false,
    };
}

export async function loadPublicEconomySummary(): Promise<PublicEconomySummary> {
    if (!hasPotomacSupabasePublicConfig()) {
        return fallbackEconomySummary;
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("lunar_economy_daily_outputs")
            .select(
                "output_date,scenario_key,headline_value,range_low_value,range_high_value,currency_code,confidence_score,confidence_label,methodology_note,source_count,freshness_at"
            )
            .eq("publication_status", "published")
            .eq("is_public", true)
            .lte("output_date", new Date().toISOString().slice(0, 10))
            .order("output_date", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data) {
            return fallbackEconomySummary;
        }

        return mapDailyOutput(data as EconomyDailyOutputRow);
    } catch {
        return fallbackEconomySummary;
    }
}
