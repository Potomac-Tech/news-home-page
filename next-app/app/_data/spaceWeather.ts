import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";

export type SpaceWeatherSnapshot = {
    sourceKey: string;
    sourceName: string;
    sourceAgency: string;
    sourceProduct: string;
    sourceUrl: string;
    sourceUpdatedAt: string;
    sourceRetrievedAt: string;
    staleAfterMinutes: number;
    freshnessStatus: "current" | "watching" | "stale" | "unavailable";
    statusSummary: string;
    riskLabel: "nominal" | "elevated" | "watch" | "warning" | "unknown";
    keyMetrics: Record<string, unknown>;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type SpaceWeatherSnapshotRow = {
    source_key: string;
    source_name: string;
    source_agency: string;
    source_product: string;
    source_url: string;
    source_updated_at: string;
    source_retrieved_at: string;
    stale_after_minutes: number;
    freshness_status: SpaceWeatherSnapshot["freshnessStatus"];
    status_summary: string;
    risk_label: SpaceWeatherSnapshot["riskLabel"];
    key_metrics: Record<string, unknown>;
};

export const fallbackSpaceWeatherSnapshots: SpaceWeatherSnapshot[] = [
    {
        sourceKey: "noaa-swpc-current-conditions",
        sourceName: "NOAA SWPC Current Conditions",
        sourceAgency: "NOAA / NWS Space Weather Prediction Center",
        sourceProduct: "NOAA Scales current conditions",
        sourceUrl: "https://www.spaceweather.gov/",
        sourceUpdatedAt: "2026-06-29T22:04:52.000Z",
        sourceRetrievedAt: "2026-06-29T22:06:00.000Z",
        staleAfterMinutes: 60,
        freshnessStatus: "current",
        statusSummary:
            "Latest observed NOAA scales showed no active R, S, or G event; the 24-hour observed maximum included G1 minor geomagnetic activity.",
        riskLabel: "watch",
        keyMetrics: {
            latestObserved: "R none / S none / G none",
            observed24hMax: "R none / S none / G1 minor",
        },
    },
    {
        sourceKey: "noaa-swpc-planetary-k-index",
        sourceName: "NOAA SWPC Planetary K-index",
        sourceAgency: "NOAA / NWS Space Weather Prediction Center",
        sourceProduct: "Planetary K-index",
        sourceUrl: "https://www.spaceweather.gov/products/planetary-k-index",
        sourceUpdatedAt: "2026-06-29T22:06:00.000Z",
        sourceRetrievedAt: "2026-06-29T22:06:00.000Z",
        staleAfterMinutes: 15,
        freshnessStatus: "current",
        statusSummary:
            "Kp is tracked as the primary geomagnetic disturbance indicator for spacecraft, radio, power-grid, and aurora impacts.",
        riskLabel: "watch",
        keyMetrics: {
            metric: "Kp",
            cadence: "Chart updates every minute",
        },
    },
    {
        sourceKey: "noaa-swpc-real-time-solar-wind",
        sourceName: "NOAA SWPC Real-Time Solar Wind",
        sourceAgency: "NOAA / NWS Space Weather Prediction Center",
        sourceProduct: "Real-Time Solar Wind",
        sourceUrl: "https://www.spaceweather.gov/products/real-time-solar-wind",
        sourceUpdatedAt: "2026-06-29T20:00:00.000Z",
        sourceRetrievedAt: "2026-06-29T22:06:00.000Z",
        staleAfterMinutes: 30,
        freshnessStatus: "watching",
        statusSummary:
            "Real-time solar wind context is available from L1 spacecraft data, including magnetic field, density, speed, and temperature.",
        riskLabel: "nominal",
        keyMetrics: {
            metrics: "Bt/Bz GSM, density, speed, temperature",
            spacecraft: "DSCOVR and ACE",
        },
    },
];

function rowToSpaceWeatherSnapshot(
    row: SpaceWeatherSnapshotRow
): SpaceWeatherSnapshot {
    return {
        sourceKey: row.source_key,
        sourceName: row.source_name,
        sourceAgency: row.source_agency,
        sourceProduct: row.source_product,
        sourceUrl: row.source_url,
        sourceUpdatedAt: row.source_updated_at,
        sourceRetrievedAt: row.source_retrieved_at,
        staleAfterMinutes: row.stale_after_minutes,
        freshnessStatus: row.freshness_status,
        statusSummary: row.status_summary,
        riskLabel: row.risk_label,
        keyMetrics: row.key_metrics,
    };
}

export function formatSpaceWeatherDateTime(value: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
        timeZoneName: "short",
    }).format(new Date(value));
}

export function formatSpaceWeatherFreshness(
    status: SpaceWeatherSnapshot["freshnessStatus"]
) {
    if (status === "current") {
        return "Current";
    }

    if (status === "watching") {
        return "Watching";
    }

    if (status === "stale") {
        return "Stale";
    }

    return "Unavailable";
}

export function summarizeSpaceWeatherMetrics(
    metrics: SpaceWeatherSnapshot["keyMetrics"]
) {
    return Object.entries(metrics)
        .slice(0, 3)
        .map(([key, value]) => ({
            key: key
                .replace(/([A-Z])/g, " $1")
                .replace(/_/g, " ")
                .trim(),
            value: Array.isArray(value) ? value.join(", ") : String(value),
        }));
}

export async function loadMemberSpaceWeatherSnapshots({
    supabase,
    limit = 3,
}: {
    supabase: SupabaseServerClient;
    limit?: number;
}): Promise<SpaceWeatherSnapshot[]> {
    if (!hasPotomacSupabasePublicConfig()) {
        return fallbackSpaceWeatherSnapshots.slice(0, limit);
    }

    try {
        const { data, error } = await supabase
            .from("space_weather_source_snapshots")
            .select(
                "source_key,source_name,source_agency,source_product,source_url,source_updated_at,source_retrieved_at,stale_after_minutes,freshness_status,status_summary,risk_label,key_metrics"
            )
            .eq("publication_status", "published")
            .lte("published_at", new Date().toISOString())
            .order("display_order", { ascending: true })
            .order("source_updated_at", { ascending: false })
            .limit(limit);

        if (error || !data?.length) {
            return fallbackSpaceWeatherSnapshots.slice(0, limit);
        }

        return (data as SpaceWeatherSnapshotRow[]).map(
            rowToSpaceWeatherSnapshot
        );
    } catch {
        return fallbackSpaceWeatherSnapshots.slice(0, limit);
    }
}
