import type { Metadata } from "next";
import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";
import { LunarMissionTracker } from "../_components/LunarMissionTracker";
import { loadLunarMissionTracker } from "../_data/lunarMissions";

export const metadata: Metadata = {
    title: "Lunar Launches",
    description:
        "Lunar launch tracker route for upcoming launch windows, vehicles, operators, and mission status.",
    alternates: {
        canonical: "/launches",
    },
};

export default async function LaunchesPage({
    searchParams,
}: {
    searchParams?: Promise<{ filter?: string }>;
}) {
    const params = await searchParams;
    const activeFilter =
        params?.filter === "launches" || params?.filter === "active"
            ? params.filter
            : "all";
    const supabase = hasPotomacSupabasePublicConfig()
        ? await createClient()
        : undefined;
    const missions = await loadLunarMissionTracker({ supabase });

    return (
        <LunarMissionTracker
            missions={missions}
            mode="launches"
            activeFilter={activeFilter}
            title="Lunar Launches"
            description="Upcoming and active lunar launch windows with vehicles, sites, mission status, source freshness, and detail pages."
        />
    );
}
