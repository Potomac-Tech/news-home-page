import { tierConfig } from "./tiers";

export type HomeStory = {
    title: string;
    summary: string;
    snippet: string;
    href: string;
    publishedAt: string;
    accessTier: "Explorer" | "Scout" | (typeof tierConfig.enterprise)["publicName"];
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

export const fallbackStories: HomeStory[] = [
    {
        title: "Starlink optical terminals move into the Artemis communications stack",
        summary:
            "NASA will add two Starlink mini laser terminals to Orion for high-volume imagery during Artemis III.",
        snippet:
            "Strategic impact: commercial relay infrastructure is moving deeper into mission architectures, expanding the market for terminals, data transport, processing, and operational intelligence.",
        href: "/news/artemis-iii-starlink-optical-relay",
        publishedAt: "2026-07-16",
        accessTier: "Explorer",
        sourceLabel: "NASA | Strategic analysis",
    },
    {
        title: "Artemis III hardware stacking raises the visibility of execution risk",
        summary:
            "NASA has begun stacking solid rocket booster segments for the 2027 orbital test campaign.",
        snippet:
            "Strategic impact: hardware progress is positive, but Orion, docking, SLS, and commercial lander interfaces remain connected schedule and supply-chain dependencies.",
        href: "/news/artemis-iii-hardware-stacking",
        publishedAt: "2026-07-13",
        accessTier: "Explorer",
        sourceLabel: "NASA | Program watch",
    },
    {
        title: "Nearly $600 million expands the commercial lunar delivery pipeline",
        summary:
            "NASA awarded four late-2028 deliveries across Astrobotic, Firefly Aerospace, and Intuitive Machines.",
        snippet:
            "Market impact: direct lander revenue is paired with future demand signals for power, imaging, communications, navigation, and repeat surface datasets.",
        href: "/news/nasa-lunar-delivery-awards-2028",
        publishedAt: "2026-06-30",
        accessTier: "Explorer",
        sourceLabel: "NASA | Market analysis",
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
        memberNote: `${tierConfig.enterprise.publicName} attendees receive a tailored pre-read.`,
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
];
