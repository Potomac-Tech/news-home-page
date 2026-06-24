export const accessHref = "https://nexus-explore.potomacdb.com/0auth";

export type HomeStory = {
    title: string;
    summary: string;
    snippet: string;
    href: string;
    publishedAt: string;
    accessTier: "Member" | "Scout" | "Command";
    sourceLabel: string;
};

export type EventTeaser = {
    name: string;
    date: string;
    location: string;
    publicNote: string;
    memberNote: string;
};

export type MarketModule = {
    label: string;
    value: string;
    detail: string;
    cadence: string;
};

export type SponsorUnitData = {
    placementKey: string;
    surface: string;
    label: string;
    sponsorName: string;
    campaignName: string;
    creativeAltText: string;
    note: string;
    isDirectSold: boolean;
    sponsorWebsiteUrl?: string;
    creativeUrl?: string;
};

export const stories: HomeStory[] = [
    {
        title: "VIPC backs Potomac's lunar intelligence platform",
        summary:
            "The grant supports Potomac's work turning lunar mission, market, and technology signals into a member-ready intelligence product.",
        snippet:
            "Public readers can follow the company milestone while the platform prepares richer member-only analysis.",
        href: "/news/vipc-grant-winner",
        publishedAt: "2026-05-18",
        accessTier: "Member",
        sourceLabel: "Company brief",
    },
    {
        title: "Lunar data rights move into the mission-planning stack",
        summary:
            "Government contracts, private payloads, and downstream analytics are converging around who can use surface data first.",
        snippet:
            "Potomac is tracking procurement signals, data addenda, and emerging exclusivity windows for members.",
        href: "/news",
        publishedAt: "2026-06-12",
        accessTier: "Scout",
        sourceLabel: "Market watch",
    },
    {
        title: "Surface resource pricing needs confidence labels",
        summary:
            "Proxy prices are useful only when assumptions, source cadence, and uncertainty are visible to analysts.",
        snippet:
            "The public brief explains the model boundary; paid dashboards expose source tables and version history.",
        href: "/news",
        publishedAt: "2026-06-07",
        accessTier: "Scout",
        sourceLabel: "Method note",
    },
    {
        title: "Command members need early mission-intelligence workflows",
        summary:
            "Organization-level lunar programs need briefings, analyst support, and controlled access to near-real-time findings.",
        snippet:
            "The Command workflow is shaped around approved organizations, seats, and manual entitlement grants.",
        href: "/news",
        publishedAt: "2026-06-03",
        accessTier: "Command",
        sourceLabel: "Access brief",
    },
];

export const eventTeasers: EventTeaser[] = [
    {
        name: "Lunar Surface Markets Roundtable",
        date: "Jul 16",
        location: "Washington, DC",
        publicNote: "Public agenda preview and speaker themes.",
        memberNote: "Member packet includes company notes and source links.",
    },
    {
        name: "Cislunar Supply Chain Briefing",
        date: "Aug 06",
        location: "Virtual",
        publicNote: "Procurement and payload-capacity themes.",
        memberNote: "Scout+ follow-up includes supplier watchlist assumptions.",
    },
    {
        name: "Mission Data Rights Workshop",
        date: "Sep 10",
        location: "Member-only",
        publicNote: "Registration interest opens after agenda approval.",
        memberNote: "Command attendees receive a tailored pre-read.",
    },
];

export const marketModules: MarketModule[] = [
    {
        label: "Space company universe",
        value: "Top-20 model",
        detail: "Ranking module reserved for curated public-company coverage.",
        cadence: "Daily-ready",
    },
    {
        label: "Lunar resource proxies",
        value: "20 assets",
        detail: "Commodity entries carry source notes and confidence labels.",
        cadence: "Weekly model",
    },
    {
        label: "Lunar economy estimate",
        value: "Versioned",
        detail: "Public headline estimate with member-only methodology depth.",
        cadence: "Daily output",
    },
];

export const tickerItems = [
    { symbol: "DATA", label: "Mission data rights", value: "Watching" },
    { symbol: "SURF", label: "Surface operations", value: "Member brief" },
    { symbol: "PRXY", label: "Resource proxy model", value: "20 assets" },
    { symbol: "CMD", label: "Command intelligence", value: "Org-level" },
];

export const sponsorUnits: Record<string, SponsorUnitData> = {
    homepageLeadRail: {
        placementKey: "homepage_lead_rail",
        surface: "Homepage lead rail",
        label: "Sponsor",
        sponsorName: "Potomac partner briefing",
        campaignName: "Reserved partner slot",
        creativeAltText: "Potomac partner briefing placement",
        note: "Premium direct-sold placement beside the public headline feed.",
        isDirectSold: false,
    },
    marketModuleBand: {
        placementKey: "market_module_band",
        surface: "Markets band",
        label: "Partner slot",
        sponsorName: "Lunar markets sponsor",
        campaignName: "Reserved partner slot",
        creativeAltText: "Lunar markets partner placement",
        note: "Reserved for finance, infrastructure, and mission-services sponsors.",
        isDirectSold: false,
    },
    articleSidebar: {
        placementKey: "article_sidebar",
        surface: "Public article sidebar",
        label: "Sponsor",
        sponsorName: "Public article partner",
        campaignName: "Reserved partner slot",
        creativeAltText: "Public article partner placement",
        note: "Reserved for sponsors supporting public lunar intelligence coverage.",
        isDirectSold: false,
    },
    eventSidebar: {
        placementKey: "event_sidebar",
        surface: "Public event sidebar",
        label: "Sponsor",
        sponsorName: "Event intelligence partner",
        campaignName: "Reserved partner slot",
        creativeAltText: "Event intelligence partner placement",
        note: "Reserved for conferences, launch services, and lunar infrastructure partners.",
        isDirectSold: false,
    },
};
