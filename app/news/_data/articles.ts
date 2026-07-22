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
        slug: "space-collar-workforce-lunar-economy",
        title: "The lunar workforce is expanding beyond astronauts and engineers",
        dek: "A sustained lunar presence will depend on a broader class of space-focused operators, tradespeople, analysts, financiers, insurers, lawyers, and logistics specialists.",
        summary:
            "The emerging lunar economy needs more than launch and spacecraft talent. It also needs the commercial, operational, legal, and industrial workforce required to keep remote infrastructure functioning.",
        keyPoints: [
            "Lunar infrastructure creates demand across operations, construction, power, logistics, communications, cybersecurity, finance, insurance, and law.",
            "Workforce classification and training systems have not yet caught up with the breadth of commercial space activity.",
            "Employers that combine domain expertise with lunar operating knowledge may build a durable execution advantage.",
        ],
        intro:
            "Meet the Future contributor Rich Cooper describes these roles as space collar jobs: work that enables, finances, governs, protects, and expands activity beyond Earth. For the lunar industry, the concept is useful because it exposes the people and capabilities hidden behind a mission architecture.",
        teaser:
            "The Explorer brief maps the workforce categories most likely to become lunar bottlenecks and identifies the demand signals organizations should track.",
        publishedAt: "2026-07-14",
        accessTier: "member",
        heroImageUrl: "/space-collar-lunar-workforce.png",
        heroImageAlt: "Lunar surface operations team supporting power, logistics, and mission systems",
        citations: [
            {
                label: "Source reporting",
                title: "Beyond Blue and White: The Rise of Space Collar Jobs",
                publisher: "Meet the Future / SPACE <GO>",
                url: "https://mtf.tv/beyond-blue-and-white-the-rise-of-space-collar-jobs",
                summary:
                    "Rich Cooper outlines the broad set of technical, commercial, policy, and operational professions needed to support a growing space economy.",
            },
        ],
        fallbackBody:
            "A lunar mission is the visible output of a much larger operating system. Engineers and astronauts remain central, but sustained activity also requires power technicians, construction specialists, mission operators, supply-chain managers, data analysts, accountants, lawyers, insurers, cybersecurity teams, and procurement professionals. Treating these functions as secondary understates their effect on schedule, cost, and mission resilience.\n\nThe near-term workforce market will form around programs with funded hardware and recurring operations. Employers should watch awarded task orders, planned landing cadence, surface-power deployments, relay-service procurements, and data-delivery requirements. Those signals translate architecture into specific staffing needs.\n\nThe largest risk is a mismatch between specialized lunar knowledge and established professional disciplines. A capable insurance underwriter still needs mission-risk context; a logistics planner must understand launch windows and scarce surface capacity; a cyber team must account for remote assets and intermittent links. Organizations that develop this combined expertise before demand peaks will be better positioned to execute and to price risk.\n\nFor universities and workforce programs, the practical opportunity is not to create a new degree for every space role. It is to add lunar systems, regulation, mission economics, and operational data to existing engineering, business, policy, and skilled-trade pathways.",
    },
    {
        slug: "clps-2-lunar-logistics-market",
        title: "CLPS 2.0 points toward a higher-cadence lunar logistics market",
        dek: "NASA's draft follow-on procurement signals more competition, heavier deliveries, standardized interfaces, and a longer runway for commercial lunar transportation.",
        summary:
            "A proposed successor to the current Commercial Lunar Payload Services contract would shift the market from occasional payload delivery toward a more repeatable logistics network for sustained operations.",
        keyPoints: [
            "The draft vehicle is designed to admit new providers and remove underperforming ones over a contract period extending into the next decade.",
            "Medium- and heavy-class landers would expand the addressable market beyond small science payloads.",
            "Standard interfaces and repeatable production are likely to matter as much as headline mission count.",
        ],
        intro:
            "SpaceGo reporting describes a draft NASA procurement intended to increase the frequency and capacity of commercial lunar deliveries. The strategic signal is not a single forecast number; it is the agency's move toward a market structure that can support recurring surface operations.",
        teaser:
            "The Explorer brief separates the draft procurement signal from awarded revenue and identifies the logistics, interface, and supply-chain indicators to monitor next.",
        publishedAt: "2026-06-15",
        accessTier: "member",
        heroImageUrl: "/commercial-lunar-delivery-pipeline.webp",
        heroImageAlt: "Commercial lunar lander delivering instruments and cargo to the Moon",
        citations: [
            {
                label: "Source reporting",
                title: "NASA Launches CLPS 2.0 to Boost Lunar Deliveries",
                publisher: "Meet the Future / SPACE <GO>",
                url: "https://mtf.tv/clps-2-0-nasa",
                summary:
                    "Kevin Cirilli reports on NASA's draft CLPS follow-on vehicle, delivery ambitions, provider competition, and standardization goals.",
            },
        ],
        fallbackBody:
            "The draft CLPS successor should be read as a market-design signal rather than booked revenue. NASA is testing a structure that could support more providers, larger landers, feasibility work, and recurring task orders over a longer period. Final requirements, appropriations, and individual awards will determine how much of that ambition becomes funded demand.\n\nFor lander companies, higher cadence changes the operating model. Repeatable production, common payload interfaces, supplier resilience, and mission recovery become more important than optimizing every flight as a bespoke project. Providers that can demonstrate reliable delivery and transparent performance data should be better positioned when NASA on-ramps vendors or competes task orders.\n\nThe opportunity extends beyond prime lander contracts. Heavier deliveries create demand for payload integration, deployment mechanisms, surface power, communications, navigation, thermal systems, ground operations, and data services. Those adjacent markets will mature only if delivery schedules become predictable enough for customers to plan around them.\n\nThe next evidence to track is the final solicitation, contract ceiling, eligible service categories, domestic-content rules, on-ramp process, and first task orders. Until those items are final, mission-volume estimates should be treated as planning assumptions rather than a revenue forecast.",
    },
    {
        slug: "crewed-lunar-rover-surface-mobility-market",
        title: "Crewed lunar rover awards open the surface mobility market",
        dek: "Competing rover awards to Astrolab and Lunar Outpost create a funded path toward extending astronaut range and commercial operations at the lunar south pole.",
        summary:
            "Crew-capable lunar vehicles turn mobility into a service layer, with implications for science range, cargo movement, infrastructure maintenance, and future commercial use.",
        keyPoints: [
            "NASA's dual-provider strategy preserves competition and reduces dependence on a single vehicle architecture.",
            "Rovers expand the practical operating radius around landing sites and surface infrastructure.",
            "Power, maintenance, communications, navigation, payload integration, and spares become follow-on markets.",
        ],
        intro:
            "SpaceGo reported roughly $440 million in NASA awards for crew-capable lunar rover efforts led by Astrolab and Lunar Outpost. The immediate value is funded vehicle development; the larger signal is the emergence of mobility as shared lunar infrastructure.",
        teaser:
            "The Explorer brief examines the downstream surface-services market and the milestones that will distinguish a durable mobility platform from a one-mission vehicle.",
        publishedAt: "2026-06-14",
        accessTier: "member",
        heroImageUrl: "/crewed-lunar-rover-market.png",
        heroImageAlt: "Two crew-capable lunar rover concepts operating near the lunar south pole",
        citations: [
            {
                label: "Source reporting",
                title: "NASA's $440M for crewed moon buggies",
                publisher: "Meet the Future / SPACE <GO>",
                url: "https://mtf.tv/nasa-funds-moon-buggies-for-artemis-program",
                summary:
                    "Kevin Cirilli reports on NASA's awards to Astrolab and Lunar Outpost and the role of surface mobility in sustained lunar operations.",
            },
        ],
        fallbackBody:
            "Surface mobility changes the economics of a landing site. Without a vehicle, crew and cargo operations remain concentrated near the lander. A reliable rover expands the reachable science area, links distributed infrastructure, supports inspection and repair, and reduces the labor required to move equipment.\n\nNASA's dual-provider approach creates competitive pressure while preserving architectural diversity. The commercial question is whether each provider can move from development hardware to a service with measurable availability, payload capacity, range, charging requirements, maintenance intervals, and mission-support pricing. Those operating metrics will matter to customers more than top speed alone.\n\nThe surrounding market includes charging and power management, navigation aids, communications coverage, route planning, dust mitigation, replacement parts, robotic attachments, cargo handling, and fleet telemetry. A rover that exposes standard payload and data interfaces could become a platform for instruments and commercial services rather than a closed vehicle.\n\nInvestors and suppliers should track design reviews, uncrewed demonstrations, delivery contracts, launch assignments, south-pole communications coverage, and the allocation of vehicle capacity between NASA and commercial users. Those milestones will show whether surface mobility is becoming recurring infrastructure or remains program-specific hardware.",
    },
    {
        slug: "artemis-iii-crew-integration-schedule",
        title: "Artemis III crew selection sharpens the integration schedule",
        dek: "Naming a four-person crew gives NASA's orbital test a more concrete operating sequence and raises the visibility of dependencies across Orion and commercial lander interfaces.",
        summary:
            "Artemis III is positioned as an integrated orbital test intended to reduce risk before a later lunar landing, making docking, communications, procedures, and supplier readiness central schedule indicators.",
        keyPoints: [
            "The mission is intended to test integrated systems and rendezvous procedures before a crewed lunar landing attempt.",
            "A named crew increases training and procedure dependencies alongside hardware readiness.",
            "Interface milestones across government and commercial systems are the leading schedule signals to watch.",
        ],
        intro:
            "SpaceGo reported NASA's selection of four astronauts for Artemis III and framed the mission as a critical risk-reduction step. For the lunar market, the important change is a more observable integration campaign connecting spacecraft, lander test articles, crews, facilities, and procedures.",
        teaser:
            "The Explorer brief identifies the integration milestones that matter most to suppliers, investors, and lunar program planners as the mission approaches.",
        publishedAt: "2026-06-09",
        accessTier: "member",
        heroImageUrl: "/artemis-iii-crew-integration.png",
        heroImageAlt: "Four astronauts reviewing an integrated spacecraft test plan",
        citations: [
            {
                label: "Source reporting",
                title: "NASA announces crew for crucial Artemis III",
                publisher: "Meet the Future / SPACE <GO>",
                url: "https://mtf.tv/nasa-artemis-rocket-launch",
                summary:
                    "Kevin Cirilli reports on the crew announcement, orbital test objectives, commercial-partner interfaces, and Artemis schedule context.",
            },
        ],
        fallbackBody:
            "Crew selection is not only a communications milestone. It starts a tighter cycle of training, procedure validation, simulator work, medical planning, and mission-specific integration. Each change to hardware or mission design can now propagate into crew preparation and operational certification.\n\nThe core value of Artemis III is risk retirement across interfaces. Orion, docking systems, communications, ground operations, and commercial lander test articles must function as one mission architecture. A component can be technically mature while the integrated sequence remains unproven, so interface testing and end-to-end demonstrations are more informative than isolated hardware completion.\n\nFor suppliers and investors, the most useful indicators are completed design and safety reviews, delivered flight hardware, integrated software tests, docking demonstrations, crew-training milestones, and closure of major anomalies. Program-level target dates matter, but these observable dependencies provide a better view of schedule confidence.\n\nA successful orbital test would improve confidence in later landing missions and clarify demand timing for surface systems. A delay would affect more than launch services: it could shift payload schedules, communications deployments, rover operations, and the timing of commercial lunar revenue across the supply chain.",
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
