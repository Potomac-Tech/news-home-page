import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLunarMarketIntelAccess } from "../../../lib/auth/lunar-market-intel";
import { hasPotomacSupabasePublicConfig } from "../../../lib/supabase/config";
import { createClient } from "../../../lib/supabase/server";
import { LunarMarketIntelDetail } from "../../_components/LunarMarketIntelDetail";
import { loadLunarMarketIntelBySlug } from "../../_data/lunarMarketIntel";

export const dynamic = "force-dynamic";

type PageParams = {
    slug: string;
};

export async function generateMetadata({
    params,
}: {
    params: Promise<PageParams>;
}): Promise<Metadata> {
    const { slug } = await params;
    const record = await loadLunarMarketIntelBySlug({
        mode: "regulatory",
        slug,
    });

    if (!record) {
        return {
            title: "Regulatory Record Not Found",
        };
    }

    return {
        title: `${record.title} Regulatory Intelligence`,
        description: record.summary,
        alternates: {
            canonical: `/regulatory/${record.slug}`,
        },
    };
}

export default async function RegulatoryDetailPage({
    params,
}: {
    params: Promise<PageParams>;
}) {
    const { slug } = await params;
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
    const record = await loadLunarMarketIntelBySlug({
        mode: "regulatory",
        slug,
        supabase,
        includePaid: canReadPaid,
    });

    if (!record) {
        notFound();
    }

    return <LunarMarketIntelDetail record={record} canReadPaid={canReadPaid} />;
}
