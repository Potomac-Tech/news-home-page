import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";

export const sponsorPlacementKeys = {
    homepageLeadRail: "homepage_lead_rail",
    marketModuleBand: "market_module_band",
    articleSidebar: "article_sidebar",
    eventSidebar: "event_sidebar",
} as const;

export type SponsorPlacementKey =
    (typeof sponsorPlacementKeys)[keyof typeof sponsorPlacementKeys];

export type SponsorAdUnit = {
    placementKey: SponsorPlacementKey | string;
    placementName: string;
    surface: string;
    label: string;
    sponsorName: string;
    sponsorWebsiteUrl?: string;
    campaignName: string;
    creativeUrl?: string;
    creativeAltText: string;
    note: string;
    isDirectSold: boolean;
};

type PlacementRow = {
    id: string;
    placement_key: string;
    name: string;
    surface: string;
    description: string;
    format: string;
    dimensions: string | null;
    programmatic_allowed: boolean;
};

type CampaignPlacementRow = {
    id: string;
    campaign_id: string;
    placement_id: string;
    starts_at: string;
    ends_at: string;
    priority: number;
    creative_url: string | null;
    creative_alt_text: string | null;
    utm_campaign: string | null;
};

type CampaignRow = {
    id: string;
    sponsor_id: string;
    name: string;
    starts_at: string;
    ends_at: string;
};

type SponsorRow = {
    id: string;
    name: string;
    slug: string;
    website_url: string | null;
};

const fallbackSponsorUnits: Record<string, SponsorAdUnit> = {
    [sponsorPlacementKeys.homepageLeadRail]: {
        placementKey: sponsorPlacementKeys.homepageLeadRail,
        placementName: "Briefing sponsor",
        surface: "Homepage lead rail",
        label: "Sponsor",
        sponsorName: "Potomac partner briefing",
        campaignName: "Reserved partner slot",
        creativeAltText: "Potomac partner briefing placement",
        note: "Premium direct-sold placement beside the public headline feed.",
        isDirectSold: false,
    },
    [sponsorPlacementKeys.marketModuleBand]: {
        placementKey: sponsorPlacementKeys.marketModuleBand,
        placementName: "Market module sponsor",
        surface: "Markets band",
        label: "Partner slot",
        sponsorName: "Lunar markets sponsor",
        campaignName: "Reserved partner slot",
        creativeAltText: "Lunar markets partner placement",
        note: "Reserved for finance, infrastructure, and mission-services sponsors.",
        isDirectSold: false,
    },
    [sponsorPlacementKeys.articleSidebar]: {
        placementKey: sponsorPlacementKeys.articleSidebar,
        placementName: "Article sponsor",
        surface: "Public article sidebar",
        label: "Sponsor",
        sponsorName: "Public article partner",
        campaignName: "Reserved partner slot",
        creativeAltText: "Public article partner placement",
        note: "Reserved for sponsors supporting public lunar intelligence coverage.",
        isDirectSold: false,
    },
    [sponsorPlacementKeys.eventSidebar]: {
        placementKey: sponsorPlacementKeys.eventSidebar,
        placementName: "Event calendar sponsor",
        surface: "Public event sidebar",
        label: "Sponsor",
        sponsorName: "Event intelligence partner",
        campaignName: "Reserved partner slot",
        creativeAltText: "Event intelligence partner placement",
        note: "Reserved for conferences, launch services, and lunar infrastructure partners.",
        isDirectSold: false,
    },
};

function genericFallbackUnit(placementKey: string): SponsorAdUnit {
    return {
        placementKey,
        placementName: "Sponsor placement",
        surface: "Public surface",
        label: "Partner slot",
        sponsorName: "Potomac partner",
        campaignName: "Reserved partner slot",
        creativeAltText: "Potomac partner placement",
        note: "Public sponsor placement reserved for approved campaigns.",
        isDirectSold: false,
    };
}

function withTrackingUrl(url: string | null, utmCampaign: string | null) {
    if (!url) {
        return undefined;
    }

    if (!utmCampaign) {
        return url;
    }

    try {
        const parsedUrl = new URL(url);
        parsedUrl.searchParams.set("utm_source", "potomac");
        parsedUrl.searchParams.set("utm_medium", "sponsor");
        parsedUrl.searchParams.set("utm_campaign", utmCampaign);

        return parsedUrl.toString();
    } catch {
        return url;
    }
}

function fallbackForPlacement(placement: PlacementRow): SponsorAdUnit {
    const fallback =
        fallbackSponsorUnits[placement.placement_key] ??
        genericFallbackUnit(placement.placement_key);

    return {
        ...fallback,
        placementName: placement.name,
        surface: placement.surface,
        note: placement.description || fallback.note,
    };
}

function directUnit({
    placement,
    campaignPlacement,
    campaign,
    sponsor,
}: {
    placement: PlacementRow;
    campaignPlacement: CampaignPlacementRow;
    campaign: CampaignRow;
    sponsor: SponsorRow;
}): SponsorAdUnit {
    return {
        placementKey: placement.placement_key,
        placementName: placement.name,
        surface: placement.surface,
        label: "Sponsor",
        sponsorName: sponsor.name,
        sponsorWebsiteUrl: withTrackingUrl(
            sponsor.website_url,
            campaignPlacement.utm_campaign
        ),
        campaignName: campaign.name,
        creativeUrl: campaignPlacement.creative_url ?? undefined,
        creativeAltText:
            campaignPlacement.creative_alt_text ??
            `${sponsor.name} sponsor creative`,
        note: placement.description,
        isDirectSold: true,
    };
}

export async function loadSponsorUnits(placementKeys: string[]) {
    const requestedPlacementKeys = [...new Set(placementKeys)];
    const todayIsoDate = new Date().toISOString().slice(0, 10);
    const fallbackUnits = new Map(
        requestedPlacementKeys.map((placementKey) => [
            placementKey,
            fallbackSponsorUnits[placementKey] ?? genericFallbackUnit(placementKey),
        ])
    );

    if (!requestedPlacementKeys.length) {
        return fallbackUnits;
    }

    if (!hasPotomacSupabasePublicConfig()) {
        return fallbackUnits;
    }

    try {
        const supabase = await createClient();
        const { data: placementData, error: placementError } = await supabase
            .from("ad_placements")
            .select(
                "id,placement_key,name,surface,description,format,dimensions,programmatic_allowed"
            )
            .in("placement_key", requestedPlacementKeys)
            .eq("status", "active");

        if (placementError || !placementData?.length) {
            return fallbackUnits;
        }

        const placements = (placementData ?? []) as PlacementRow[];
        const placementsById = new Map(
            placements.map((placement) => [placement.id, placement])
        );
        const units = new Map(
            placements.map((placement) => [
                placement.placement_key,
                fallbackForPlacement(placement),
            ])
        );

        const { data: campaignPlacementData, error: campaignPlacementError } =
            await supabase
                .from("sponsor_campaign_placements")
                .select(
                    "id,campaign_id,placement_id,starts_at,ends_at,priority,creative_url,creative_alt_text,utm_campaign"
                )
                .in(
                    "placement_id",
                    placements.map((placement) => placement.id)
                )
                .eq("status", "live")
                .lte("starts_at", todayIsoDate)
                .gte("ends_at", todayIsoDate)
                .order("priority", { ascending: true })
                .order("starts_at", { ascending: false });

        if (campaignPlacementError || !campaignPlacementData?.length) {
            return new Map([...fallbackUnits, ...units]);
        }

        const campaignPlacements =
            (campaignPlacementData ?? []) as CampaignPlacementRow[];
        const campaignIds = [
            ...new Set(
                campaignPlacements.map(
                    (campaignPlacement) => campaignPlacement.campaign_id
                )
            ),
        ];
        const { data: campaignData, error: campaignError } = await supabase
            .from("sponsor_campaigns")
            .select("id,sponsor_id,name,starts_at,ends_at")
            .in("id", campaignIds)
            .eq("status", "active")
            .lte("starts_at", todayIsoDate)
            .gte("ends_at", todayIsoDate);

        if (campaignError || !campaignData?.length) {
            return new Map([...fallbackUnits, ...units]);
        }

        const campaigns = (campaignData ?? []) as CampaignRow[];
        const campaignsById = new Map(
            campaigns.map((campaign) => [campaign.id, campaign])
        );
        const sponsorIds = [
            ...new Set(campaigns.map((campaign) => campaign.sponsor_id)),
        ];
        const { data: sponsorData, error: sponsorError } = await supabase
            .from("sponsors")
            .select("id,name,slug,website_url")
            .in("id", sponsorIds)
            .eq("status", "active");

        if (sponsorError || !sponsorData?.length) {
            return new Map([...fallbackUnits, ...units]);
        }

        const sponsorsById = new Map(
            ((sponsorData ?? []) as SponsorRow[]).map((sponsor) => [
                sponsor.id,
                sponsor,
            ])
        );

        for (const campaignPlacement of campaignPlacements) {
            const placement = placementsById.get(campaignPlacement.placement_id);
            const campaign = campaignsById.get(campaignPlacement.campaign_id);
            const sponsor = campaign
                ? sponsorsById.get(campaign.sponsor_id)
                : undefined;

            if (!placement || !campaign || !sponsor) {
                continue;
            }

            if (units.get(placement.placement_key)?.isDirectSold) {
                continue;
            }

            units.set(
                placement.placement_key,
                directUnit({
                    placement,
                    campaignPlacement,
                    campaign,
                    sponsor,
                })
            );
        }

        return new Map([...fallbackUnits, ...units]);
    } catch {
        return fallbackUnits;
    }
}
