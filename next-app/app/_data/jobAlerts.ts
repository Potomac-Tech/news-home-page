import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";

export type JobAlert = {
    alertKey: string;
    employerName: string;
    roleTitle: string;
    locationName: string;
    sourceName: string;
    sourceUrl: string;
    postingDate: string;
    sourceRetrievedAt: string;
    freshnessStatus: "fresh" | "watching" | "stale" | "closed";
    freshnessNote: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type JobAlertRow = {
    alert_key: string;
    employer_name: string;
    role_title: string;
    location_name: string;
    source_name: string;
    source_url: string;
    posting_date: string;
    source_retrieved_at: string;
    freshness_status: JobAlert["freshnessStatus"];
    freshness_note: string | null;
};

export const fallbackJobAlerts: JobAlert[] = [
    {
        alertKey: "nasa-usajobs-artemis-systems-engineering-watch",
        employerName: "NASA",
        roleTitle: "Artemis systems engineering roles",
        locationName: "NASA centers / USAJOBS",
        sourceName: "NASA Careers",
        sourceUrl: "https://www.nasa.gov/careers/",
        postingDate: "2026-06-29",
        sourceRetrievedAt: "2026-06-29T22:00:00.000Z",
        freshnessStatus: "fresh",
        freshnessNote:
            "Watch official NASA listings for Artemis, lunar surface, avionics, power, and mission systems openings.",
    },
    {
        alertKey: "spacex-starship-lunar-systems-watch",
        employerName: "SpaceX",
        roleTitle: "Starship and lunar systems roles",
        locationName: "Hawthorne, CA; Starbase, TX; Cape Canaveral, FL",
        sourceName: "SpaceX Careers",
        sourceUrl: "https://www.spacex.com/careers/jobs",
        postingDate: "2026-06-29",
        sourceRetrievedAt: "2026-06-29T22:00:00.000Z",
        freshnessStatus: "fresh",
        freshnessNote:
            "Monitor Starship, launch operations, avionics, propulsion, payload integration, and lunar transport roles.",
    },
    {
        alertKey: "blue-origin-lunar-systems-watch",
        employerName: "Blue Origin",
        roleTitle: "Lunar systems, engines, and mission operations roles",
        locationName: "Kent, WA; Huntsville, AL; Space Coast, FL; Denver, CO",
        sourceName: "Blue Origin Careers",
        sourceUrl: "https://www.blueorigin.com/careers/search",
        postingDate: "2026-06-29",
        sourceRetrievedAt: "2026-06-29T22:00:00.000Z",
        freshnessStatus: "fresh",
        freshnessNote:
            "Track lunar transportation, propulsion, fluids, thermal, software, and mission operations openings.",
    },
    {
        alertKey: "lockheed-martin-space-lunar-architecture-watch",
        employerName: "Lockheed Martin Space",
        roleTitle: "Space systems and lunar architecture roles",
        locationName: "Denver, CO; Sunnyvale, CA; Huntsville, AL; Cape Canaveral, FL",
        sourceName: "Lockheed Martin Space Careers",
        sourceUrl: "https://www.lockheedmartinjobs.com/space-careers",
        postingDate: "2026-06-29",
        sourceRetrievedAt: "2026-06-29T22:00:00.000Z",
        freshnessStatus: "fresh",
        freshnessNote:
            "Watch spacecraft, mission systems, lunar architecture, avionics, software, and mission assurance roles.",
    },
];

function rowToJobAlert(row: JobAlertRow): JobAlert {
    return {
        alertKey: row.alert_key,
        employerName: row.employer_name,
        roleTitle: row.role_title,
        locationName: row.location_name,
        sourceName: row.source_name,
        sourceUrl: row.source_url,
        postingDate: row.posting_date,
        sourceRetrievedAt: row.source_retrieved_at,
        freshnessStatus: row.freshness_status,
        freshnessNote: row.freshness_note,
    };
}

export function formatJobAlertDate(value: string) {
    const date = new Date(`${value}T00:00:00.000Z`);

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(date);
}

export function formatJobAlertFreshness(status: JobAlert["freshnessStatus"]) {
    if (status === "fresh") {
        return "Fresh";
    }

    if (status === "watching") {
        return "Watching";
    }

    if (status === "stale") {
        return "Stale";
    }

    return "Closed";
}

export async function loadMemberJobAlerts({
    supabase,
    limit = 4,
}: {
    supabase: SupabaseServerClient;
    limit?: number;
}): Promise<JobAlert[]> {
    if (!hasPotomacSupabasePublicConfig()) {
        return fallbackJobAlerts.slice(0, limit);
    }

    try {
        const { data, error } = await supabase
            .from("space_sector_job_alerts")
            .select(
                "alert_key,employer_name,role_title,location_name,source_name,source_url,posting_date,source_retrieved_at,freshness_status,freshness_note"
            )
            .eq("publication_status", "published")
            .neq("freshness_status", "closed")
            .lte("published_at", new Date().toISOString())
            .order("display_order", { ascending: true })
            .order("posting_date", { ascending: false })
            .limit(limit);

        if (error || !data?.length) {
            return fallbackJobAlerts.slice(0, limit);
        }

        return (data as JobAlertRow[]).map(rowToJobAlert);
    } catch {
        return fallbackJobAlerts.slice(0, limit);
    }
}
