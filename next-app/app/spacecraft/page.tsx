import type { Metadata } from "next";
import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";
import { LunarMissionTracker } from "../_components/LunarMissionTracker";
import { loadLunarMissionTracker } from "../_data/lunarMissions";

export const metadata: Metadata = {
    title: "Lunar Spacecraft and Landers",
    description:
        "Lunar spacecraft, lander, payload, and satellite tracker route.",
    alternates: {
        canonical: "/spacecraft",
    },
};

export default async function SpacecraftPage({
    searchParams,
}: {
    searchParams?: Promise<{ filter?: string }>;
}) {
    const params = await searchParams;
    const allowedFilters = new Set([
        "spacecraft",
        "landers",
        "satellites",
    ]);
    const activeFilter =
        params?.filter && allowedFilters.has(params.filter)
            ? params.filter
            : "all";
    const supabase = hasPotomacSupabasePublicConfig()
        ? await createClient()
        : undefined;
    const missions = await loadLunarMissionTracker({ supabase });

    return (
        <LunarMissionTracker
            missions={missions}
            mode="spacecraft"
            activeFilter={activeFilter}
            title="Spacecraft and Landers"
            description="Active lunar spacecraft, landers, satellites, payloads, destination states, landing-site context, freshness, and source citations."
        />
    );
}
