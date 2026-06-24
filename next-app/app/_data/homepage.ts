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

export type SponsorSlot = {
    name: string;
    placement: string;
    status: string;
    note: string;
};

export type TickerItem = {
    symbol: string;
    label: string;
    value: string;
};

export const fallbackStories: HomeStory[] = [
    {
        title: "VIPC backs Potomac's lunar intelligence platform",
        summary:
            "The grant supports Potomac's work turning lunar mission, market, and technology signals into a member-ready intelligence product.",
        snippet:
            "Public readers can follow the company milestone while the CMS-backed article system prepares richer member-only analysis.",
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
            "Proxy prices are useful only when the assumptions, source cadence, and uncertainty are visible to analysts.",
        snippet:
            "The public brief explains the model boundary; paid dashboards will expose the source table and version history.",
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
            "The Command workflow is being shaped around approved organizations, seats, and manual entitlement grants.",
        href: "/command",
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
        memberNote: "Member packet will include company notes and source links.",
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
        detail: "Commodity entries will carry source notes and confidence labels.",
        cadence: "Weekly model",
    },
    {
        label: "Lunar economy estimate",
        value: "Versioned",
        detail: "Public headline estimate with member-only methodology depth.",
        cadence: "Daily output",
    },
];

export const sponsorSlots: SponsorSlot[] = [
    {
        name: "Briefing sponsor",
        placement: "Homepage lead rail",
        status: "Direct-sold",
        note: "Premium placement beside the public headline feed.",
    },
    {
        name: "Market module sponsor",
        placement: "Ticker and markets band",
        status: "Reserved",
        note: "Designed for lunar finance, infrastructure, and mission services.",
    },
    {
        name: "Programmatic fallback",
        placement: "Public article surfaces",
        status: "Documented",
        note: "Fallback slot keeps layout stable when direct inventory is empty.",
    },
];

export const tickerItems: TickerItem[] = [
    {
        symbol: "DATA",
        label: "Mission data rights",
        value: "Watching",
    },
    {
        symbol: "SURF",
        label: "Surface operations",
        value: "Member brief",
    },
    {
        symbol: "PRXY",
        label: "Resource proxy model",
        value: "20 assets",
    },
    {
        symbol: "CMD",
        label: "Command intelligence",
        value: "Org-level",
    },
];
