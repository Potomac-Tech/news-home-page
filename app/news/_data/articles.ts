import type { ArticleAccessTier } from "../../../lib/auth/article-access";

export type ArticleCitation = {
    label: string;
    title: string;
    publisher: string;
    url?: string;
    summary: string;
};

export type ArticleRecord = {
    id?: string;
    slug: string;
    title: string;
    dek: string;
    summary: string;
    keyPoints: string[];
    intro: string;
    teaser: string;
    publishedAt: string;
    accessTier: ArticleAccessTier;
    heroImageUrl: string;
    heroImageAlt: string;
    citations: ArticleCitation[];
    fallbackBody?: string;
};

export const fallbackArticles: ArticleRecord[] = [
    {
        slug: "potomac-space-investment-forum-2026",
        title: "Space Investment Forum convenes leaders in capital, industry, and national security",
        dek: "Potomac Database Systems and Meet the Future will host an invitation-only forum in Washington on July 21 focused on investment, infrastructure, and American leadership in space.",
        summary:
            "The Space Investment Forum will bring approximately 50 curated guests to the Cosmos Club on Tuesday, July 21, for a discussion spanning Artemis, cislunar infrastructure, defense, workforce, capital allocation, and intelligence.",
        keyPoints: [
            "The invitation-only main forum runs from 9:45 a.m. to noon at the Cosmos Club in Washington, D.C.",
            "Jim Bridenstine and retired Brig. Gen. Damon Feltman will lead a featured conversation on American strength in space.",
            "The agenda connects lunar and cislunar infrastructure with capital formation, national security, workforce, data, and strategic decision-making.",
        ],
        intro:
            "Senior leaders from investment, government, industry, and national security will meet in Washington for a focused discussion on the capital, innovation, and partnerships needed to strengthen the U.S. space industrial base. The forum is co-hosted by Jake Matthews, CEO of Potomac Database Systems, and Kevin Cirilli, founder of Meet the Future.",
        teaser:
            "The member brief outlines the featured speakers, agenda themes, and why cislunar infrastructure, capital allocation, and data intelligence are converging as strategic priorities.",
        publishedAt: "2026-07-19",
        accessTier: "member",
        heroImageUrl: "/potomac-space-investment-forum.jpg",
        heroImageAlt: "Invitation for the July 21, 2026 Space Investment Forum at the Cosmos Club in Washington",
        citations: [
            {
                label: "Event invitation",
                title: "Space Investment Forum",
                publisher: "Potomac Database Systems and Meet the Future",
                url: "/potomac-space-investment-forum.jpg",
                summary:
                    "Official event invitation listing the date, venue, hosts, speakers, partners, and discussion topics.",
            },
        ],
        fallbackBody:
            "The Space Investment Forum is scheduled for Tuesday, July 21, 2026, at the Cosmos Club, 2121 Massachusetts Avenue NW in Washington, D.C. The invitation-only main forum will run from 9:45 a.m. to noon for approximately 50 curated guests. Business attire is requested.\n\nThe featured conversation, American Strength in Space: Capital, Industry, and Strategic Competition, will include Jim Bridenstine, former NASA administrator and CEO of Quantum Space, and retired Brig. Gen. Damon Feltman, CEO of the Space Force Association.\n\nDiscussion topics include Artemis and the next era of human exploration; integrated space defense; lunar and cislunar infrastructure; space-sector workforce development; capital allocation and investment trends; and the role of data and intelligence in decision-making. These subjects increasingly intersect: mission demand depends on appropriations and private capital, while infrastructure investment depends on credible schedules, customers, operating data, and national priorities.\n\nThe forum is presented in partnership with Meet the Future, the Space Force Association, Quantum Space, Potomac Database Systems, and PSW Science. Questions about the invitation may be directed to the contact listed on the official event invitation.",
    },
    {
        slug: "nasa-lunar-delivery-awards-2028",
        title: "NASA commits nearly $600 million to four more lunar deliveries",
        dek: "New awards to Astrobotic, Firefly Aerospace, and Intuitive Machines expand the funded lunar-delivery pipeline and expose the next infrastructure demand signals.",
        summary:
            "NASA selected three commercial providers for four lunar deliveries planned for late 2028, assigning $297.9 million to Astrobotic, $144.2 million to Firefly Aerospace, and $148.3 million to Intuitive Machines.",
        keyPoints: [
            "The awards put nearly $600 million of additional lunar delivery work into the commercial pipeline.",
            "NASA plans repeated payloads for plume effects, navigation, and radiation measurements across multiple landing sites.",
            "Future solicitations are expected to address surface power, imaging, technology demonstrations, and lunar communications and navigation relays.",
        ],
        intro:
            "The awards are a direct revenue signal for lunar transportation providers and an indirect demand signal for payload integration, surface operations, communications, navigation, power, and environmental data. NASA is also using repeated instruments across landers to build comparable observations rather than treating each landing as an isolated science event.",
        teaser:
            "The member brief examines where the awarded dollars flow, which follow-on procurements may emerge, and why repeat measurements could create more valuable lunar operating datasets.",
        publishedAt: "2026-06-30",
        accessTier: "member",
        heroImageUrl: "/commercial-lunar-delivery-pipeline.webp",
        heroImageAlt: "Commercial lunar lander deploying scientific instruments and cargo on the Moon",
        citations: [
            {
                label: "Primary source",
                title: "NASA Awards More Moon Base Science, Previews New Opportunities",
                publisher: "NASA",
                url: "https://www.nasa.gov/news-release/nasa-awards-more-moon-base-science-previews-new-opportunities/",
                summary:
                    "NASA's award announcement identifies the providers, delivery count, values, payloads, and prospective follow-on opportunities.",
            },
        ],
        fallbackBody:
            "The immediate market impact is concentrated in three lunar transportation providers, but the broader strategic effect is a larger and more predictable pipeline for payload, integration, launch, ground, and data suppliers. Astrobotic received the largest aggregate award because it covers two deliveries; Firefly Aerospace and Intuitive Machines each received one. Execution quality on earlier missions will remain central to margin, insurance, and customer-confidence assumptions.\n\nThe repeated payload plan is strategically important. Flying common plume, navigation, and radiation instruments across different landers and sites can create comparable datasets for landing-zone design, hazard models, navigation aids, and crew protection. That shifts part of the market from one-time mission data toward an operating evidence base that can support multiple programs.\n\nThe next investable signals are the solicitations NASA previewed for surface power and avionics, a South Pole optical imager, technology demonstrations, and a lunar communications and navigation relay constellation. Suppliers should track acquisition timing, data-rights language, interoperability requirements, and whether NASA buys infrastructure as hardware, service capacity, or both.",
    },
    {
        slug: "artemis-iii-starlink-optical-relay",
        title: "Starlink optical terminals move into the Artemis communications stack",
        dek: "NASA's selection of SpaceX laser terminals for Artemis III signals growing reliance on commercial relay infrastructure for high-volume mission data.",
        summary:
            "NASA will install two Starlink mini laser terminals on Orion to transmit 4K imagery and video during the Artemis III rendezvous and docking demonstration.",
        keyPoints: [
            "The terminals supplement Orion's existing communications system rather than replace it.",
            "The demonstration extends commercial optical relay technology into a crewed Artemis mission.",
            "Higher-volume links can increase demand for mission data transport, processing, archiving, and distribution services.",
        ],
        intro:
            "Communications capacity is becoming a strategic layer of the lunar economy. NASA's Artemis III integration gives a commercial constellation a visible role in transporting crewed-mission imagery while the agency develops a broader path toward commercial relay services.",
        teaser:
            "The member analysis separates the near-Earth demonstration from future cislunar service claims and identifies the commercial opportunities created by higher mission-data volumes.",
        publishedAt: "2026-07-16",
        accessTier: "member",
        heroImageUrl: "/artemis-starlink-optical-relay.webp",
        heroImageAlt: "Crewed spacecraft relaying data through optical communications satellites above Earth",
        citations: [
            {
                label: "Primary source",
                title: "NASA Taps SpaceX's Starlink to Deliver Artemis III Imagery from Orion",
                publisher: "NASA",
                url: "https://www.nasa.gov/blogs/missions/2026/07/16/nasa-taps-spacexs-starlink-to-deliver-artemis-iii-imagery-from-orion/",
                summary:
                    "NASA describes the two-terminal installation, planned 4K downlink, prior optical demonstrations, and commercial-relay strategy.",
            },
        ],
        fallbackBody:
            "The selection is strategically meaningful because it places commercially derived laser-crosslink hardware on Orion for a high-visibility crewed mission. It does not, by itself, establish a lunar Starlink service: NASA describes a demonstration that uses the constellation to relay data from Orion during Artemis III operations near Earth. Market forecasts should keep that boundary explicit.\n\nThe stronger signal is architectural. NASA is testing whether commercial relay capacity can supplement purpose-built government communications for demanding mission phases. If that model expands outward, value can accrue not only to network operators but also to terminal vendors, link-management software, mission operations teams, cybersecurity providers, cloud processing, archives, and companies that convert raw imagery and telemetry into decision products.\n\nFor lunar operators, the practical question is no longer only whether a spacecraft can communicate. It is how much data can be moved, with what latency, coverage, priority, security, and rights. Those service-level terms will shape instrument design and determine which surface datasets can support near-real-time operational intelligence.",
    },
    {
        slug: "artemis-iii-hardware-stacking",
        title: "Artemis III hardware stacking turns architecture into an execution test",
        dek: "Booster stacking at Kennedy makes Artemis III schedule performance, interface readiness, and supplier execution more visible to the lunar market.",
        summary:
            "NASA began stacking Artemis III solid rocket booster segments at Kennedy as the agency prepares a 2027 orbital rendezvous and docking demonstration with commercial lander test vehicles.",
        keyPoints: [
            "Physical stacking provides a concrete schedule marker after Artemis II's return.",
            "Artemis III is designed to test Orion interfaces and docking operations with commercial human landing system pathfinders.",
            "Results will influence confidence in the planned Artemis IV lunar South Pole landing campaign in 2028.",
        ],
        intro:
            "For the lunar supply chain, mission architecture matters only when hardware, software, launch operations, and partner interfaces converge on a testable schedule. Artemis III's move into stacking makes execution dependencies easier to monitor and raises the value of verified milestone intelligence.",
        teaser:
            "The member brief maps the milestone to downstream demand and identifies the schedule, integration, and supplier signals that matter most for lunar companies and investors.",
        publishedAt: "2026-07-13",
        accessTier: "member",
        heroImageUrl: "/artemis-iii-booster-stacking.webp",
        heroImageAlt: "Solid rocket booster segments being stacked inside a high-bay integration facility",
        citations: [
            {
                label: "Primary source",
                title: "NASA's Artemis III Flight Hardware Stacks Up at Kennedy",
                publisher: "NASA",
                url: "https://www.nasa.gov/blogs/missions/2026/07/13/nasas-artemis-iii-flight-hardware-stacks-up-at-kennedy/",
                summary:
                    "NASA reports the start of booster stacking and current Artemis III processing activity at Kennedy Space Center.",
            },
            {
                label: "Program architecture",
                title: "NASA Marches Toward Artemis III Mission in 2027, Names Crew Members",
                publisher: "NASA",
                url: "https://www.nasa.gov/news-release/nasa-marches-toward-artemis-iii-mission-in-2027-names-crew-members/",
                summary:
                    "NASA details the orbital test plan, commercial lander interfaces, supplier progress, and relationship to the 2028 lunar landing campaign.",
            },
        ],
        fallbackBody:
            "Hardware stacking is a stronger market signal than a target date alone because it indicates that launch infrastructure, flight hardware, and processing teams have entered a tightly coupled phase. It does not remove schedule risk. Orion integration, docking-system readiness, heat-shield work, SLS processing, and commercial lander test articles remain linked dependencies.\n\nArtemis III is also an interface test for the commercial lunar market. NASA plans for Orion to rendezvous and dock with Blue Origin and SpaceX pathfinders in Earth orbit. Success would retire operational and integration risk before the Artemis IV South Pole campaign; delays or test findings could move demand across suppliers and alter the timing of surface systems, communications, mobility, science, and logistics procurements.\n\nCompanies should track verified hardware milestones, test completion, interface changes, launch-sequence assumptions, and contract modifications rather than treating program-level dates as equally reliable. Investors should distinguish revenue already under contract from demand that depends on Artemis III results and subsequent appropriations.",
    },
];

export function findFallbackArticle(slug: string) {
    return fallbackArticles.find((article) => article.slug === slug);
}
