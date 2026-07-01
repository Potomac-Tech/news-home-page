import type { Metadata } from "next";
import { getLunarMarketIntelAccess } from "../../lib/auth/lunar-market-intel";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";
import { LunarMarketIntelHub } from "../_components/LunarMarketIntelHub";
import { loadLunarMarketIntel } from "../_data/lunarMarketIntel";

export const metadata: Metadata = {
    title: "Lunar Regulatory Intelligence",
    description:
        "Scout and Command lunar regulatory intelligence route for filings, comment periods, policy milestones, and compliance notes.",
    alternates: {
        canonical: "/regulatory",
    },
};

const allowedFilters = new Set(["open", "comments", "risk", "due"]);

export default async function RegulatoryPage({
    searchParams,
}: {
    searchParams?: Promise<{ filter?: string; q?: string }>;
}) {
    const params = await searchParams;
    const activeFilter =
        params?.filter && allowedFilters.has(params.filter)
            ? params.filter
            : "all";
    const query = params?.q ?? "";
    const supabase = hasPotomacSupabasePublicConfig()
        ? await createClient()
        : undefined;
    const access = supabase
        ? await getLunarMarketIntelAccess({ supabase })
        : {
              canReadScoutDetails: false,
              canReadCommandDetails: false,
          };
    const canReadPaid =
        access.canReadScoutDetails || access.canReadCommandDetails;
    const records = await loadLunarMarketIntel({
        mode: "regulatory",
        supabase,
        includePaid: canReadPaid,
    });

    return (
        <LunarMarketIntelHub
            mode="regulatory"
            records={records}
            activeFilter={activeFilter}
            query={query}
            canReadPaid={canReadPaid}
        />
    );
}
