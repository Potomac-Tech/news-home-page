import { tierConfig } from "./tiers";

export type HomeStory = {
    title: string;
    summary: string;
    snippet: string;
    href: string;
    publishedAt: string;
    accessTier: "Explorer" | "Scout" | (typeof tierConfig.enterprise)["publicName"];
    sourceLabel: string;
    imageUrl?: string;
    imageAlt?: string;
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
        title: "Space Investment Forum brings capital and strategic space leaders to Washington",
        summary:
            "Potomac Database Systems and Meet the Future will convene an invitation-only forum at the Cosmos Club on July 21.",
        snippet:
            "The agenda connects Artemis, cislunar infrastructure, national security, workforce, capital allocation, and data intelligence with a featured conversation led by Jim Bridenstine and retired Brig. Gen. Damon Feltman.",
        href: "/news/potomac-space-investment-forum-2026",
        publishedAt: "2026-07-19",
        accessTier: "Explorer",
        sourceLabel: "Upcoming event | Washington, D.C.",
        imageUrl: "/potomac-space-investment-forum.jpg",
        imageAlt: "Invitation for the July 21, 2026 Space Investment Forum",
    },
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
        name: "Space Investment Forum",
        date: "Jul 21",
        location: "Washington, DC",
        publicNote: "Invitation-only forum on leadership, capital, innovation, and orbit.",
        memberNote: "Featured discussion covers Artemis, cislunar infrastructure, investment, defense, workforce, and intelligence.",
    },
    {
        name: "Space Industrialist Week",
        date: "Sep 2026",
        location: "Details forthcoming",
        publicNote: "Leading figures from the space and lunar industries will convene for a new industry gathering.",
        memberNote: "The program will include the inaugural Cabeus Games; dates, venue, and participant details are forthcoming.",
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
