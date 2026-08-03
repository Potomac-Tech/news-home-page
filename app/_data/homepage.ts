import { tierConfig } from "./tiers";

export type HomeStory = {
    title: string;
    summary: string;
    snippet: string;
    href: string;
    publishedAt: string;
    accessTier: "Explorer" | "Scout" | (typeof tierConfig.enterprise)["publicName"];
    sourceLabel: string;
    authorSlug?: string;
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
        title: "The lunar workforce is expanding beyond astronauts and engineers",
        summary:
            "Building a sustained lunar economy will require operators, skilled trades, logistics planners, financiers, lawyers, insurers, and cybersecurity specialists.",
        snippet:
            "Strategic impact: workforce availability is becoming an infrastructure constraint, and organizations that build cross-disciplinary lunar operating expertise early may gain an execution advantage.",
        href: "/news/space-collar-workforce-lunar-economy",
        publishedAt: "2026-07-14",
        accessTier: "Explorer",
        sourceLabel: "SpaceGo | Workforce analysis",
        imageUrl: "/space-collar-lunar-workforce.png",
        imageAlt: "Lunar surface operations team supporting power, logistics, and mission systems",
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
        imageUrl: "/artemis-starlink-optical-relay.webp",
        imageAlt: "Crewed spacecraft relaying data through optical communications satellites above Earth",
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
        imageUrl: "/artemis-iii-booster-stacking.webp",
        imageAlt: "Solid rocket booster segments being stacked inside a high-bay integration facility",
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
        imageUrl: "/commercial-lunar-delivery-pipeline.webp",
        imageAlt: "Commercial lunar lander deploying scientific instruments and cargo on the Moon",
    },
    {
        title: "CLPS 2.0 points toward a higher-cadence lunar logistics market",
        summary:
            "NASA's draft follow-on procurement would expand competition, delivery capacity, and standardized services for sustained lunar operations.",
        snippet:
            "Market impact: a larger contract vehicle could reward providers that can increase production, standardize payload interfaces, and prove repeatable delivery performance.",
        href: "/news/clps-2-lunar-logistics-market",
        publishedAt: "2026-06-15",
        accessTier: "Explorer",
        sourceLabel: "SpaceGo | Procurement watch",
        imageUrl: "/commercial-lunar-delivery-pipeline.webp",
        imageAlt: "Commercial lunar lander delivering instruments and cargo to the Moon",
    },
    {
        title: "Crewed lunar rover awards open the surface mobility market",
        summary:
            "NASA selected Astrolab and Lunar Outpost for competing crew-capable rover efforts intended to extend astronaut range at the lunar south pole.",
        snippet:
            "Market impact: surface mobility creates follow-on demand for power, maintenance, communications, navigation, payload integration, and logistics services.",
        href: "/news/crewed-lunar-rover-surface-mobility-market",
        publishedAt: "2026-06-14",
        accessTier: "Explorer",
        sourceLabel: "SpaceGo | Market analysis",
        imageUrl: "/crewed-lunar-rover-market.png",
        imageAlt: "Two crew-capable lunar rover concepts operating near the lunar south pole",
    },
    {
        title: "Artemis III crew selection sharpens the integration schedule",
        summary:
            "NASA named the four-person crew for an orbital test intended to reduce risk across Orion, docking, communications, and commercial lander interfaces.",
        snippet:
            "Program impact: assigning a crew raises the visibility of interface readiness and turns supplier milestones into a more concrete mission sequence.",
        href: "/news/artemis-iii-crew-integration-schedule",
        publishedAt: "2026-06-09",
        accessTier: "Explorer",
        sourceLabel: "SpaceGo | Program watch",
        imageUrl: "/artemis-iii-crew-integration.png",
        imageAlt: "Four astronauts reviewing an integrated spacecraft test plan",
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
